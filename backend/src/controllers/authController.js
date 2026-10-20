const { issueUserToken } = require('../utils/userSessions');
const { signupSchema, validateProfile, siteUrl } = require('../utils/onboardingValidation');
// src/controllers/authController.js
const bcrypt = require("bcrypt");
const { randomBytes } = require("crypto");
const dummyPasswordHash = bcrypt.hash(randomBytes(32).toString("hex"), 10);
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const pool = require("../config/db");
const { createSubscription } = require("../models/subscription");
// ---------- User model ----------
const {
  createUser,
  findUserByEmail,
  findUserByPhone,
  findUserById,
  verifyOTP,
  updateOTP,
  setTrialDates,
  setOnboarded,
  getOnboardingDraft: getDraftFromModel,
  saveOnboardingDraft: saveDraftToModel,
  clearOnboardingDraft,
  completeOnboarding: completeOnboardingModel,
  // Auth-related model functions
  setResetOTP,
  verifyResetOTP: verifyResetOTPModel,
  updatePassword,
  consumePasswordReset,
  initializeWebsite,
} = require("../models/user");

// ---------- Business model ----------
const {
  createBusiness,
  findBusinessBySubdomain,
  findBusinessByUserId,
  updateBusinessOnboarding,
  activateBusinessByUserId,
} = require("../models/business");

// ---------- Email utilities ----------
const {
  sendOTPEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailureEmail,
  sendTrialStartedEmail,
  sendResetOTPEmail,
} = require("../utils/mailer");

// ---------- Helpers ----------
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// =====================================================================
//  AUTH – LOGIN / FORGOT / RESET
// =====================================================================

// ------------------ Login ------------------
async function login(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await findUserByEmail(email);
    const isValid = await bcrypt.compare(password, user?.password_hash || await dummyPasswordHash);
    if (!user || !isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.is_verified) return res.status(403).json({ error: "Please verify your email first.", code: "EMAIL_UNVERIFIED", userId: user.id });
    const admin = user.is_admin === 1;
    if ((req.body.portal === 'admin') !== admin) return res.status(403).json({ error: admin ? 'Please use the administrator login.' : 'Administrator access required.' });
    const token = await issueUserToken(user);

    const redirectUrl = user.is_admin === 1 ? "/admin/dashboard"
      : !user.is_onboarded ? "/onboarding" : "/admin/dashboard";

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        isVerified: user.is_verified,
        isOnboarded: user.is_onboarded,
        onboardingStep: user.onboarding_step || 0,
        isAdmin: user.is_admin === 1,
        redirectUrl,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ------------------ Forgot Password ------------------
async function forgotPassword(req, res, next) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      // For security, don't reveal if email exists
      return res.json({
        message: "If your email is registered, you will receive a reset code.",
      });
    }

    const otp = await setResetOTP(user.id);
    await sendResetOTPEmail(user.email, user.full_name, otp);

    res.json({ message: "If your email is registered, you will receive a reset code." });
  } catch (err) {
    next(err);
  }
}

// ------------------ Verify Reset OTP ------------------
async function verifyResetOTP(req, res, next) {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const nonce = await verifyResetOTPModel(user.id, otp);
    if (!nonce) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const resetToken = jwt.sign(
      { id: user.id, role: "artist", purpose: "reset", jti: nonce },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );

    res.json({ message: "OTP verified", resetToken });
  } catch (err) {
    next(err);
  }
}

// ------------------ Reset Password ------------------
async function resetPassword(req, res, next) {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (decoded.purpose !== "reset" || decoded.role !== "artist" || !Number.isInteger(decoded.id) || typeof decoded.jti !== "string" || !/^[a-f0-9]{64}$/.test(decoded.jti)) {
      return res.status(400).json({ error: "Invalid token" });
    }

    if (!(await consumePasswordReset(decoded.id, decoded.jti, newPassword))) return res.status(400).json({ error: "Invalid or expired reset token" });

    res.json({ message: "Password reset successfully. You can now login." });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }
    next(err);
  }
}

// =====================================================================
//  SIGNUP
// =====================================================================

async function signup(req, res, next) {
  const validated = signupSchema.validate(req.body);
  if (validated.error) return res.status(400).json({ error: validated.error.message });
  const {
    fullName, email, phone, password,
    businessName, subdomain, billingAddress,
    paymentMethodId, plan, billingCycle,
  } = validated.value;

  // ---------- Validation ----------
  if (!fullName || !email || !phone || !password || !businessName || !subdomain || !paymentMethodId || !plan || !billingCycle) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  if (!["starter", "professional", "enterprise"].includes(plan)) {
    return res.status(400).json({ error: "Invalid plan" });
  }
  if (!["monthly", "yearly"].includes(billingCycle)) {
    return res.status(400).json({ error: "Invalid billing cycle" });
  }

  let connection;
  try { connection = await pool.getConnection(); } catch (error) { return next(error); }
  let stripeSubscription = null;
  let setupFeePaymentIntent;
  let paymentSucceeded = false; // indicates setup fee paid and subscription created

  try {
    await connection.beginTransaction();

    // ---------- Duplicate checks (inside transaction, with locks) ----------
    const [existingUser] = await connection.execute(
      "SELECT id FROM users WHERE email = ? FOR UPDATE", [email]
    );
    if (existingUser.length) {
      await connection.rollback();
      return res.status(409).json({ error: "Email already registered" });
    }
    const [existingPhone] = await connection.execute(
      "SELECT id FROM users WHERE phone = ? FOR UPDATE", [phone]
    );
    if (existingPhone.length) {
      await connection.rollback();
      return res.status(409).json({ error: "Phone number already in use" });
    }
    const [existingBusiness] = await connection.execute(
      "SELECT id FROM businesses WHERE subdomain = ? FOR UPDATE", [subdomain]
    );
    if (existingBusiness.length) {
      await connection.rollback();
      return res.status(409).json({ error: "Subdomain already taken" });
    }

    // ---------- Stripe Payment Processing ----------
    let customer, subscription;
    try {
      const priceId = process.env[`STRIPE_${plan.toUpperCase()}_${billingCycle.toUpperCase()}_PRICE_ID`]
        || (plan === "starter" ? process.env[billingCycle === "yearly" ? "STRIPE_YEARLY_PRICE_ID" : "STRIPE_MONTHLY_PRICE_ID"] : null);
      if (!priceId) throw new Error("Selected plan is not configured");

      customer = await stripe.customers.create({
        email,
        name: fullName,
        payment_method: paymentMethodId,
        invoice_settings: { default_payment_method: paymentMethodId },
      }, { idempotencyKey: `signup-customer-${paymentMethodId}` });

      // One-time setup fee
      setupFeePaymentIntent = await stripe.paymentIntents.create({
  amount: 100,
  currency: "usd",
  customer: customer.id,
  payment_method: paymentMethodId,
  confirm: true,
  off_session: false,
  automatic_payment_methods: {
    enabled: true,
    allow_redirects: 'never',
  },
  description: "One-time setup fee for PTW subscription",
}, { idempotencyKey: `signup-setup-${paymentMethodId}` });

      if (setupFeePaymentIntent.status !== "succeeded") {
        throw new Error(`Setup fee payment status: ${setupFeePaymentIntent.status}`);
      }

      // Create subscription with trial
      subscription = await stripe.subscriptions.create({
        customer: customer.id,
        trial_period_days: 14,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
      }, { idempotencyKey: `signup-subscription-${paymentMethodId}` });

      stripeSubscription = subscription;
      paymentSucceeded = true;
    } catch (paymentErr) {
      // Refund setup fee if it was charged
      if (setupFeePaymentIntent && setupFeePaymentIntent.status === "succeeded") {
        await stripe.refunds.create({
          payment_intent: setupFeePaymentIntent.id,
        }).catch(refundErr => console.error("Failed to refund setup fee:", refundErr.message));
      }
      await connection.rollback();
      console.error("Stripe error:", paymentErr.message);
      await sendPaymentFailureEmail(email, fullName, paymentErr.message).catch(
        (err) => console.error("Email error:", err.message)
      );
      return res.status(402).json({ error: "Payment failed. Please check your card details." });
    }

    // ---------- Database operations (using same connection) ----------
    try {
      const { userId, otp } = await createUser(connection, {
        fullName, email, phone, password,
        stripeCustomerId: customer.id,
        stripePaymentIntentId: subscription.id,
        plan, billingCycle, billingAddress,
      });

      const businessId = await createBusiness(connection, {
        userId, businessName, subdomain, billingAddress,
      });

      await createSubscription(connection, {
        businessId,
        plan,
        billingCycle,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
      });

      await connection.commit();

      // Post-commit emails
      try {
        await sendPaymentSuccessEmail(
          email, fullName, new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        );
      } catch (emailErr) {
        console.error("Failed to send payment success email:", emailErr.message);
      }

      sendOTPEmail(email, fullName, otp)
        .then(() => console.log(`OTP email sent to ${email}`))
        .catch(err => console.error("Email error:", err.message));

      return res.status(201).json({
        message: "Payment successful! Please verify your OTP.",
        userId,
        businessId,
      });
    } catch (dbErr) {
      await connection.rollback();
      console.error("Database error during signup:", dbErr.message);

      if (paymentSucceeded && stripeSubscription) {
        await stripe.subscriptions.cancel(stripeSubscription.id).catch(cancelErr => {
          console.error("Failed to cancel Stripe subscription:", cancelErr.message);
        });
      }
      if (setupFeePaymentIntent?.status === "succeeded") {
        await stripe.refunds.create({ payment_intent: setupFeePaymentIntent.id }, { idempotencyKey: `signup-refund-${setupFeePaymentIntent.id}` })
          .catch(err => console.error("SIGNUP_REFUND_REQUIRES_RECONCILIATION", setupFeePaymentIntent.id, err.message));
      }
      return next(dbErr);
    }
  } catch (err) {
    await connection.rollback();
    if (paymentSucceeded && stripeSubscription) {
      await stripe.subscriptions.cancel(stripeSubscription.id).catch(cancelErr => {
        console.error("Failed to cancel Stripe subscription:", cancelErr.message);
      });
    }
    next(err);
  } finally {
    connection.release();
  }
}

async function verifyOTPFunc(req, res, next) {
  const { userId, otp } = req.body;
  if (!userId || !otp) {
    return res.status(400).json({ error: "User ID and OTP are required" });
  }

  try {
    const isValid = await verifyOTP(userId, otp);
    if (!isValid) return res.status(400).json({ error: "Invalid or expired OTP" });
    const business1 = await findBusinessByUserId(userId);
    const liveSiteUrl = siteUrl(business1);
    const activatedUser = await findUserById(userId);
    const trialEnd = activatedUser.trial_end_date;

    // 5. Send trial email
    const user = await findUserById(userId);
    if (user) {
      await sendTrialStartedEmail(
        user.email,
        user.full_name,
        trialEnd,
        liveSiteUrl,
      ).catch((err) => console.error("Email error:", err.message));
    }

    // 6. Generate JWT token (same payload as login)
    const token = await issueUserToken(user);

    // 7. Get business subdomain
    const business = await findBusinessByUserId(userId);

    res.json({
      message: "Email verified successfully! Your site is now live.",
      token, // 👈 important
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        isVerified: true,
        isOnboarded: false,
        onboardingStep: 0,
        isAdmin: user.is_admin === 1,
      },
      subdomain: business?.subdomain || null,
      siteUrl: business
        ? siteUrl(business)
        : null,
    });
  } catch (err) {
    next(err);
  }
}

async function resendOTP(req, res, next) {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.is_verified) {
      return res.status(400).json({ error: "User already verified" });
    }

    const newOTP = await updateOTP(userId);
    await sendOTPEmail(user.email, user.full_name, newOTP);

    res.json({ message: "OTP resent successfully" });
  } catch (err) {
    next(err);
  }
}


async function onboarding(req, res, next) {
  const { userId, logo, industry, website, taxId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!user.is_verified) {
      return res.status(403).json({ error: "Please verify your email first." });
    }
    if (user.is_onboarded) {
      return res
        .status(403)
        .json({ error: "Already onboarded. Redirect to dashboard." });
    }

    await updateBusinessOnboarding(userId, { logo, industry, website, taxId });
    await setOnboarded(userId, true);

    const business = await findBusinessByUserId(userId);
    res.json({
      message: "Onboarding complete!",
      redirectUrl: siteUrl(business),
    });
  } catch (err) {
    next(err);
  }
}

// =====================================================================
//  ONBOARDING DRAFT (new multi-step flow)
// =====================================================================

// =====================================================================
//  ONBOARDING DRAFT (new multi-step flow)
// =====================================================================

// async function getOnboardingDraft(req, res, next) {
//     try {
//         const userId = req.user.id;
//         // Check if user exists
//         const user = await findUserById(userId);
//         if (!user) {
//             return res.status(404).json({ error: 'User not found' });
//         }
//         const draft = await getDraftFromModel(userId);
//         if (!draft || !draft.onboarding_data) {
//             return res.json({ step: 0, data: null });
//         }
//         const data = JSON.parse(draft.onboarding_data);
//         res.json({ step: draft.onboarding_step, data });
//     } catch (err) {
//         next(err);
//     }
// }
// Safe helper to parse JSON, handling both string and object
function safeParseJSON(data) {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return data; // already an object
}

async function getOnboardingDraft(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.is_verified) return res.status(403).json({ error: "Please verify your email first.", redirect: "/signup" });
    if (user.is_onboarded) return res.status(403).json({ error: "Already onboarded", redirect: "/admin/dashboard" });
    const draft = await getDraftFromModel(userId);
    if (!draft || !draft.onboarding_data) {
      return res.json({ step: 0, data: null });
    }
    const data = safeParseJSON(draft.onboarding_data);
    res.json({ step: draft.onboarding_step, data });
  } catch (err) {
    next(err);
  }
}
async function saveOnboardingDraft(req, res, next) {
  try {
    const userId = req.user.id;
    const { step, data } = req.body;
    if (step === undefined || !data) {
      return res.status(400).json({ error: "Missing step or data" });
    }
    // Check if user exists
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!user.is_verified) return res.status(403).json({ error: "Please verify your email first.", redirect: "/signup" });
    if (user.is_onboarded) return res.status(403).json({ error: "Already onboarded", redirect: "/admin/dashboard" });
    if (!Number.isInteger(step) || step < 0 || step > 5) return res.status(400).json({ error: "Invalid onboarding step" });
    const validated = validateProfile(data);
    if (validated.error) return res.status(400).json({ error: validated.error.message });
    await saveDraftToModel(userId, step, validated.value);
    res.json({ message: "Draft saved" });
  } catch (err) {
    next(err);
  }
}

async function completeOnboarding(req, res, next) {
  try {
    const userId = req.user.id;
    const validated = validateProfile(req.body, true);
    if (validated.error) return res.status(400).json({ error: validated.error.message });
    const profileData = validated.value;

    if (
      !profileData.artistName ||
      !profileData.bio ||
      !profileData.primaryGenre
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Check if user exists
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!user.is_verified) return res.status(403).json({ error: "Please verify your email first.", redirect: "/signup" });
    if (user.is_onboarded) return res.status(403).json({ error: "Already onboarded", redirect: "/admin/dashboard" });

    if (user.is_onboarded) {
      return res.status(403).json({ error: "Already onboarded" });
    }

    const redirectUrl = siteUrl(await findBusinessByUserId(userId));
    await completeOnboardingModel(userId, profileData);

    res.json({
      message: "Onboarding complete!",
      redirectUrl,
    });
  } catch (err) {
    next(err);
  }
}
// =====================================================================
//  EXPORTS
// =====================================================================

module.exports = {
  // Auth
  login,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  // Signup & OTP
  signup,
  verifyOTPFunc,
  resendOTP,
  // Onboarding
  onboarding,
  getOnboardingDraft,
  saveOnboardingDraft,
  completeOnboarding,
};

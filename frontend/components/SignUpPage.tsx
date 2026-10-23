"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSignup, useVerifyOTP, useResendOTP } from "@/hooks/useSignup";
import { SignupPayload } from "@/types/auth";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/store/authSlice'; 
import { readSignupDraft, saveSignupDraft, clearLegacySignupData, clearSignupDraft, clearSignupAfterLogin } from '@/lib/signupDraft';
import { api } from '@/lib/api';
const initialSignupForm = {
    fullName: "",
    // countryCode is now fixed, we keep it in state for display but won't be editable
    countryCode: "+1 US",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    subdomain: "",
    plan: "",
    billingCycle: "",
    billingAddress: "",
    // card fields removed – now handled by Stripe
  };

export default function SignUpPage() {
  const features = [
    {
      id: 1,
      icon: "/s-icon1.png",
      title: "Streamlined Interface",
      description: "Navigate seamlessly with optimal user experience.",
    },
    {
      id: 2,
      icon: "/s-icon2.png",
      title: "Intuitive Controls",
      description:
        "Easily manage your content, engage with your audience, and track your progress.",
    },
    {
      id: 3,
      icon: "/s-icon3.png",
      title: "Focus on Creativity",
      description:
        "Spend less time navigating and more time focusing on creating your music.",
    },
  ];

  const stepLabels = ["Account", "Business", "Verify"];

  // Step state
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");

  // Per-field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP state
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const router = useRouter();
  // Stripe
  const stripe = useStripe();
  const elements = useElements();
  const [stripeError, setStripeError] = useState<string | null>(null);
const dispatch = useDispatch();
  const [formData, setFormData] = useState(initialSignupForm);
  const [verificationEmail, setVerificationEmail] = useState("");

  const [draftReady, setDraftReady] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const submittingRef = useRef(false);
  const accountGenerationRef = useRef(0);
  const draftDisabledRef = useRef(false);
  const completedRef = useRef(false);
  const resetSignup = () => {
    accountGenerationRef.current++;
    draftDisabledRef.current = false;
    completedRef.current = false;
    setFormData({ ...initialSignupForm });
    setUserId(null); setVerificationEmail(''); setOtp(''); setOtpError('');
    setOtpSuccess(false); setResendMessage(''); setFieldErrors({}); setStep(1);
  };
  useEffect(() => {
    let active = true;
    try { clearLegacySignupData(localStorage); } catch { /* Storage is optional. */ }
    if (new URLSearchParams(window.location.search).get('verify') === '1') {
      draftDisabledRef.current = true;
      api.get('/api/verification').then(response => {
        if (!active) return;
        setUserId(response.data.userId);
        setVerificationEmail(response.data.email);
        setStep(3); setDraftReady(true);
      }).catch(() => { if (active) router.replace('/login'); });
    } else {
      let saved = {};
      try { saved = readSignupDraft(localStorage); } catch { /* Storage is optional. */ }
      setFormData(prev => ({ ...prev, ...saved }));
      setDraftReady(true);
    }
    let channel: BroadcastChannel | undefined;
    try {
      channel = new BroadcastChannel('artistnation-account');
      channel.onmessage = event => {
        if (event.data === 'signed-in' && !completedRef.current) {
          resetSignup();
          setErrorMessage('The signed-in account changed. Start a fresh signup to use another email.');
          window.history.replaceState(null, '', '/signup');
        }
      };
    } catch { /* Verification is also bound to its server-side context. */ }
    return () => { active = false; channel?.close(); };
  }, [router]);
  useEffect(() => {
    if (!draftReady || draftDisabledRef.current) return;
    try { saveSignupDraft(localStorage, formData); }
    catch { setErrorMessage('Your browser could not save this draft. Keep this page open to avoid losing it.'); }
  }, [formData, draftReady]);

  // Hooks
  const signupMutation = useSignup();
  const verifyOTPMutation = useVerifyOTP();
  const resendOTPMutation = useResendOTP();

  const MAX_NAME_LENGTH = 50;

  // ---------- Validation helpers ----------

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const isValidSubdomain = (value: string) => {
    return (
      /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value) &&
      value.length >= 3 &&
      value.length <= 30
    );
  };

  const sanitizeSubdomain = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-{2,}/g, "-");
  };

  const isValidPhone = (value: string) => {
    const digitCount = (value.match(/\d/g) || []).length;
    return /^[0-9 ()-]+$/.test(value) && digitCount >= 7 && digitCount <= 15;
  };

  // Removed card validation helpers

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "fullName":
        if (!value.trim()) return "Full name is required";
        if (value.length > MAX_NAME_LENGTH)
          return `Full name cannot exceed ${MAX_NAME_LENGTH} characters`;
        return "";

      // countryCode is fixed, no validation needed
      case "countryCode":
        return "";

      case "phone":
        if (!value.trim()) return "Phone number is required";
        if (!isValidPhone(value)) return "Enter a valid phone number";
        return "";

      case "email":
        if (!value.trim()) return "Email is required";
        if (!isValidEmail(value)) return "Enter a valid email address";
        return "";

      case "password":
        if (!value) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        return "";

      case "confirmPassword":
        if (!value) return "Please confirm your password";
        if (value !== formData.password) return "Passwords do not match";
        return "";

      case "businessName":
        if (!value.trim()) return "Business name is required";
        if (value.length > MAX_NAME_LENGTH)
          return `Business name cannot exceed ${MAX_NAME_LENGTH} characters`;
        return "";

      case "subdomain":
        if (!value.trim()) return "Subdomain is required";
        if (value.length < 3) return "Subdomain must be at least 3 characters";
        if (value.length > 30) return "Subdomain cannot exceed 30 characters";
        if (['www', 'admin', 'api', 'test', 'unavailable', 'mail', 'support'].includes(value)) return 'This subdomain is reserved';
        if (!isValidSubdomain(value))
          return "Use lowercase letters, numbers, and hyphens only (no leading/trailing/double hyphens)";
        return "";

      case "plan":
        if (!value) return "Please select a plan";
        return "";

      case "billingCycle":
        if (!value) return "Please select a billing cycle";
        return "";

      case "billingAddress":
        if (!value.trim()) return "Billing address is required";
        return "";

      // card fields removed

      default:
        return "";
    }
  };

  const step1Fields = [
    "fullName",
    "countryCode",
    "phone",
    "email",
    "password",
    "confirmPassword",
  ];
  const step2Fields = [
    "businessName",
    "subdomain",
    "plan",
    "billingCycle",
    "billingAddress",
    // card fields removed
  ];

  const validateStep = (stepNumber: number): boolean => {
    const fieldsToValidate = stepNumber === 1 ? step1Fields : step2Fields;
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fieldsToValidate.forEach((field) => {
      const error = validateField(field, (formData as any)[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setFieldErrors((prev) => ({ ...prev, ...newErrors }));
    return isValid;
  };

  // ---------- Handlers ----------

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    let nextValue = value;

    if (name === "fullName" || name === "businessName") {
      nextValue = value.slice(0, MAX_NAME_LENGTH);
    }

    if (name === "subdomain") {
      nextValue = sanitizeSubdomain(value).slice(0, 30);
    }

    // phone: allow only digits, spaces, hyphens, parentheses
    if (name === "phone") {
      nextValue = value.replace(/[^0-9 ()-]/g, "");
    }

    // countryCode is fixed – ignore changes
    if (name === "countryCode") {
      nextValue = "+1 US"; // always reset to fixed
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: nextValue };
      return updated;
    });

    setFieldErrors((prev) => {
      const updatedErrors = { ...prev };
      const error = validateField(name, nextValue);
      if (error) {
        updatedErrors[name] = error;
      } else {
        delete updatedErrors[name];
      }

      if (name === "password" && formData.confirmPassword) {
        const confirmError =
          formData.confirmPassword !== nextValue
            ? "Passwords do not match"
            : "";
        if (confirmError) {
          updatedErrors.confirmPassword = confirmError;
        } else {
          delete updatedErrors.confirmPassword;
        }
      }

      return updatedErrors;
    });
  };

  const goToStep = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
    setErrorMessage("");
    setOtpError("");
    setResendMessage("");
    setStripeError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftReady || submittingRef.current) return;
    setErrorMessage("");
    setStripeError(null);

    if (step === 1) {
      if (!validateStep(1)) {
        setErrorMessage("Please fix the highlighted fields before continuing");
        return;
      }
      goToStep(2);
      return;
    }

    if (step === 2) {
      // Validate business fields
      if (!validateStep(2)) {
        setErrorMessage("Please fix the highlighted fields before continuing");
        return;
      }

      // Check Stripe availability
      if (!stripe || !elements) {
        setErrorMessage("Stripe is not loaded. Please try again.");
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setErrorMessage("Card element not found. Please refresh.");
        return;
      }

      if (submittingRef.current) return;
      submittingRef.current = true;
      setCreatingPayment(true);
      const accountGeneration = accountGenerationRef.current;
      try {
      // Create PaymentMethod
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: formData.fullName,
          email: formData.email,
        },
      });

      if (error) {
        setStripeError(error.message || "Failed to create payment method.");
        return;
      }

      // Build payload with paymentMethodId
      const payload: SignupPayload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        businessName: formData.businessName,
        subdomain: formData.subdomain,
        billingAddress: formData.billingAddress || undefined,
        plan: formData.plan || undefined,
        billingCycle: formData.billingCycle || undefined,
        paymentMethodId: paymentMethod.id, // 👈 important
      };

      let data;
      try {
        data = await signupMutation.mutateAsync(payload);
      } catch (paymentError: any) {
        if (paymentError.response?.data?.code !== 'PAYMENT_AUTHENTICATION_REQUIRED') throw paymentError;
        const result = await stripe.confirmCardPayment(paymentError.response.data.clientSecret);
        if (result.error) throw new Error(result.error.message || 'Card authentication failed');
        if (result.paymentIntent?.status !== 'succeeded') throw new Error('Payment is not confirmed. Please retry.');
        if (accountGenerationRef.current !== accountGeneration) return;
        data = await signupMutation.mutateAsync(payload);
      }
      if (accountGenerationRef.current !== accountGeneration) return;
      setUserId(data.userId);
      draftDisabledRef.current = true;
      setVerificationEmail(data.email);
      try { clearSignupDraft(localStorage); } catch { /* Storage is optional. */ }
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      goToStep(3);
      } catch (error: any) {
        setErrorMessage(error.response?.data?.error || error.message || 'Signup failed. Please try again.');
      } finally {
        submittingRef.current = false;
        setCreatingPayment(false);
      }
    }
  };

  // OTP verification
  const handleVerifyOTP = () => {
    if (!otp || otp.length !== 6) {
      setOtpError("Please enter a 6-digit OTP");
      return;
    }
    setOtpError("");
    if (!userId) return;

   verifyOTPMutation.mutate(
  { userId, otp },
  {
    onSuccess: (data) => {
      // data now contains { token, user, message }
      draftDisabledRef.current = true;
      completedRef.current = true;
      clearSignupAfterLogin();
      setOtpSuccess(true);

      // 1. Store the token (same as login flow)
      dispatch(loginSuccess({ token: data.token,  user: {
    id: data.user.id,
    email: data.user.email,
    fullName: data.user.fullName,
    isVerified: true,               // OTP verified means verified
    isOnboarded: false,
    isAdmin: data.user.isAdmin ?? false,   // 👈 add this (new users are never admin)
    
  }, }));

      // 2. Redirect to onboarding after a short delay
      setTimeout(() => {
        router.push("/onboarding");
      }, 1500);
    },
    onError: (error: any) => {
      setOtpError(error.response?.data?.error || 'Verification failed. Please try again.');
    },
  }
);
  };

  const handleResendOTP = () => {
    if (!userId) return;
    setResendMessage("");
    resendOTPMutation.mutate(
      { userId },
      {
        onSuccess: (data) => {
          setResendMessage(data.message);
          setOtpError("");
          setOtp("");
        },
        onError: (error: any) => {
          const msg =
            error.response?.data?.error ||
            error.message ||
            "Failed to resend OTP";
          setResendMessage(msg);
        },
      },
    );
  };

  const isSubmitting = creatingPayment || signupMutation.isPending;

  // ----- UI rendering -----
  const getInputClass = (hasError: boolean) =>
    `w-full px-3.5 py-2 text-xs bg-white border rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 transition-colors ${
      hasError
        ? "border-red-300 hover:border-red-400 focus:ring-red-400 focus:border-red-400"
        : "border-gray-300 hover:border-purple-300 focus:ring-purple-400 focus:border-purple-400"
    }`;

  const labelClass =
    "text-[10px] font-semibold text-gray-500 uppercase tracking-wider block";

  const errorTextClass = "text-[10px] text-red-500";

  const FieldError = ({ name }: { name: string }) =>
    fieldErrors[name] ? (
      <p className={errorTextClass}>{fieldErrors[name]}</p>
    ) : null;

  const EyeIcon = ({ visible }: { visible: boolean }) =>
    visible ? (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
        <circle
          cx="12"
          cy="12"
          r="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3l18 18M10.584 10.587a2 2 0 002.828 2.83M9.363 5.365A9.466 9.466 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.523 10.523 0 01-4.293 5.412M6.228 6.228A10.45 10.45 0 002.458 12c1.274 4.057 5.064 7 9.542 7a9.46 9.46 0 004.635-1.19"
        />
      </svg>
    );

  const renderFields = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div>
              <label className={labelClass}>
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                placeholder="Jane Smith"
                value={formData.fullName}
                onChange={handleChange}
                maxLength={MAX_NAME_LENGTH}
                className={getInputClass(!!fieldErrors.fullName)}
              />
              <div className="flex items-center justify-between">
                <FieldError name="fullName" />
                <span className="text-[10px] text-gray-400 ml-auto">
                  {formData.fullName.length}/{MAX_NAME_LENGTH}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-[88px_1fr] gap-3">
              <div>
                <label className={labelClass}>Code</label>
                {/* Fixed country code display */}
                <div className="w-full px-3.5 py-2 text-xs bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed">
                  +1 US
                </div>
              </div>
              <div>
                <label className={labelClass}>
                  Phone <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  placeholder="555 000 1234"
                  value={formData.phone}
                  onChange={handleChange}
                  className={getInputClass(!!fieldErrors.phone)}
                />
                <FieldError name="phone" />
              </div>
            </div>
            <div>
              <label className={labelClass}>
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="jane@company.com"
                value={formData.email}
                onChange={handleChange}
                className={getInputClass(!!fieldErrors.email)}
              />
              <FieldError name="email" />
            </div>
            <div>
              <label className={labelClass}>
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className={`${getInputClass(!!fieldErrors.password)} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
              <FieldError name="password" />
            </div>
            <div>
              <label className={labelClass}>
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`${getInputClass(!!fieldErrors.confirmPassword)} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  <EyeIcon visible={showConfirmPassword} />
                </button>
              </div>
              <FieldError name="confirmPassword" />
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div>
              <label className={labelClass}>
                Business Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="businessName"
                placeholder="Acme Inc."
                value={formData.businessName}
                onChange={handleChange}
                maxLength={MAX_NAME_LENGTH}
                className={getInputClass(!!fieldErrors.businessName)}
              />
              <div className="flex items-center justify-between">
                <FieldError name="businessName" />
                <span className="text-[10px] text-gray-400 ml-auto">
                  {formData.businessName.length}/{MAX_NAME_LENGTH}
                </span>
              </div>
            </div>
            <div>
              <label className={labelClass}>
                Subdomain <span className="text-red-400">*</span>
              </label>
              <div className="flex items-stretch">
                <input
                  type="text"
                  name="subdomain"
                  placeholder="yourbrand"
                  value={formData.subdomain}
                  onChange={handleChange}
                  maxLength={30}
                  className={`flex-1 px-3.5 py-2 text-sm bg-white border rounded-l-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 transition-colors ${
                    fieldErrors.subdomain
                      ? "border-red-300 hover:border-red-400 focus:ring-red-400 focus:border-red-400"
                      : "border-gray-300 hover:border-purple-300 focus:ring-purple-400 focus:border-purple-400"
                  }`}
                />
                <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-500 whitespace-nowrap">
                  .artistnation.studio
                </span>
              </div>
              <FieldError name="subdomain" />
              {!fieldErrors.subdomain && (
                <p className="text-[10px] text-gray-400 mt-1">
                  Lowercase letters, numbers, and hyphens only. 3–30 characters.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>
                  Plan <span className="text-red-400">*</span>
                </label>
                <select
                  name="plan"
                  value={formData.plan}
                  onChange={handleChange}
                  className={getInputClass(!!fieldErrors.plan)}
                >
                  <option value="">Select plan</option>
                  <option value="starter">Starter</option>

                </select>
                <FieldError name="plan" />
              </div>
              <div>
                <label className={labelClass}>
                  Billing <span className="text-red-400">*</span>
                </label>
                <select
                  name="billingCycle"
                  value={formData.billingCycle}
                  onChange={handleChange}
                  className={getInputClass(!!fieldErrors.billingCycle)}
                >
                  <option value="">Billing cycle</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <FieldError name="billingCycle" />
              </div>
            </div>
            <div>
              <label className={labelClass}>
                Billing Address <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="billingAddress"
                placeholder="123 Main St, New York"
                value={formData.billingAddress}
                onChange={handleChange}
                className={getInputClass(!!fieldErrors.billingAddress)}
              />
              <FieldError name="billingAddress" />
            </div>

            {/* Stripe Card Element */}
            <div>
              <label className={labelClass}>
                Card Details <span className="text-red-400">*</span>
              </label>
              <div
                className={`border rounded-lg p-3 bg-white focus-within:ring-1 focus-within:ring-purple-400 ${
                  stripeError ? "border-red-300" : "border-gray-300"
                }`}
              >
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: "14px",
                        color: "#424770",
                        "::placeholder": { color: "#aab7c4" },
                      },
                      invalid: { color: "#9e2146" },
                    },
                  }}
                />
              </div>
              {stripeError && (
                <p className="text-[10px] text-red-500 mt-1">{stripeError}</p>
              )}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-0 mb-2">
      {[1, 2, 3].map((s, idx) => (
        <React.Fragment key={s}>
          {idx !== 0 && (
            <div
              className={`h-px w-10 transition-colors ${
                step > idx ? "bg-purple-500" : "bg-gray-200"
              }`}
            />
          )}
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                step > s
                  ? "btn-primary-gradient text-white"
                  : step === s
                    ? "btn-primary-gradient text-white ring-2 ring-purple-200"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {step > s ? (
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                s
              )}
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="w-full h-screen flex overflow-hidden bg-white">
      {/* Left panel - features */}
      <div className="relative flex-3 bg-[url('/signup-bg.png')] bg-cover bg-center items-center justify-center hidden lg:flex">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 w-[70%] flex flex-col gap-6 text-white">
          <Link
            href="/"
            className="flex items-center cursor-pointer flex-shrink-0"
          >
            <img src="/favicon.png" alt="logo" className="h-[70px] w-auto" />
          </Link>
          <div className="flex flex-col gap-1">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="flex flex-row items-start gap-4 py-3"
              >
                <Image
                  src={feature.icon}
                  alt={feature.title}
                  width={348}
                  height={348}
                  className="w-14 object-contain"
                />
                <div className="flex flex-col gap-0.5">
                  <p className="text-base font-semibold">{feature.title}</p>
                  <p className="text-sm font-light">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-4 flex items-center justify-center px-6">
        <div className="w-full max-w-[420px] mx-auto">
          {renderStepIndicator()}
          <div className="flex justify-center gap-10 mb-5">
            {stepLabels.map((label, idx) => (
              <span
                key={label}
                className={`text-[11px] font-medium ${
                  step === idx + 1 ? "text-purple-600" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={step}
                custom={direction}
                initial={{ opacity: 0, x: direction === 1 ? 60 : -60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction === 1 ? -60 : 60 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                {step === 3 ? (
                  <div className="text-center space-y-4 py-4">
                    {otpSuccess ? (
                      <>
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                          <svg
                            className="w-8 h-8 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">
                          Email Verified!
                        </h2>
                        <p className="text-gray-500 text-sm">
                          Your account is now active. Redirecting...
                        </p>
                      </>
                    ) : (
                      <>
                        <h2 className="text-xl font-bold text-gray-800">
                          Verify Your Email
                        </h2>
                        <p className="text-gray-500 text-sm">
                          We sent a 6-digit OTP to{" "}
                          <strong>{verificationEmail}</strong>
                        </p>
                        <button type="button" disabled={verifyOTPMutation.isPending || resendOTPMutation.isPending} className="text-sm text-purple-600 hover:underline" onClick={async () => {
                          try {
                            await api.delete('/api/verification');
                            try { clearSignupDraft(localStorage); } catch { /* Storage is optional. */ }
                            resetSignup();
                            window.history.replaceState(null, '', '/signup');
                          } catch { setOtpError('Could not switch accounts. Please try again.'); }
                        }}>Use a different account</button>
                        <div className="max-w-[200px] mx-auto">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => {
                              const val = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 6);
                              setOtp(val);
                              setOtpError("");
                            }}
                            className="w-full px-3.5 py-2 text-center text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
                          />
                        </div>
                        {otpError && (
                          <p className="text-sm text-red-600">{otpError}</p>
                        )}
                        <div className="flex flex-col gap-2 items-center">
                          <motion.button
                            onClick={handleVerifyOTP}
                            disabled={
                              verifyOTPMutation.isPending || otp.length !== 6
                            }
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-2 btn-primary-gradient text-white text-sm font-medium px-5 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            {verifyOTPMutation.isPending ? (
                              <>
                                <svg
                                  className="w-3.5 h-3.5 animate-spin"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                                Verifying...
                              </>
                            ) : (
                              "Verify"
                            )}
                          </motion.button>
                          <button
                            type="button"
                            onClick={handleResendOTP}
                            disabled={resendOTPMutation.isPending}
                            className="text-sm text-purple-600 hover:underline disabled:opacity-50"
                          >
                            {resendOTPMutation.isPending
                              ? "Sending..."
                              : "Resend OTP"}
                          </button>
                          {resendMessage && (
                            <p className="text-sm text-gray-600">
                              {resendMessage}
                            </p>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs">
                          OTP expires in 10 minutes
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <h1 className="text-xl font-bold text-gray-800 tracking-tight font-unbounded">
                        {step === 1 ? "Create Account" : "Business & Payment"}
                      </h1>
                      <p className="text-gray-500 text-xs mt-1">
                        {step === 1
                          ? "Set up your personal details to get started."
                          : "Almost there — your business info"}
                      </p>
                    </div>

                    {errorMessage && (
                      <div className="mb-3 p-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg">
                        {errorMessage}
                      </div>
                    )}

                    <form
                      onSubmit={handleSubmit}
                      className="space-y-3"
                      noValidate
                    >
                      {renderFields()}

                      <div className="flex items-center justify-between pt-2">
                        {step > 1 ? (
                          <button
                            type="button"
                            onClick={() => goToStep(step - 1)}
                            disabled={isSubmitting || !draftReady}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 disabled:opacity-30"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              viewBox="0 0 14 14"
                              fill="none"
                            >
                              <path
                                d="M9 11L5 7l4-4"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Back
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-[#30ACEB] text-gray-900 text-sm font-medium px-5 py-2 rounded-lg">
                            <Link href="/" className="text-xs">
                              Back
                            </Link>
                          </div>
                        )}

                        <motion.button
                          type="submit"
                          disabled={isSubmitting}
                          whileTap={{ scale: 0.97 }}
                          className="flex items-center gap-2 btn-primary-gradient text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 shadow-lg"
                        >
                          {isSubmitting ? (
                            <>
                              <svg
                                className="w-3.5 h-3.5 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                              Creating...
                            </>
                          ) : step === 1 ? (
                            <>
                              Continue
                              <svg
                                className="w-3.5 h-3.5"
                                viewBox="0 0 14 14"
                                fill="none"
                              >
                                <path
                                  d="M5 11l4-4-4-4"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </>
                          ) : (
                            <>
                              Create Account
                              <svg
                                className="w-3.5 h-3.5"
                                viewBox="0 0 14 14"
                                fill="none"
                              >
                                <path
                                  d="M5 11l4-4-4-4"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </>
                          )}
                        </motion.button>
                      </div>
                    </form>

                    <div className="text-center mt-4">
                      <p className="text-gray-500 text-xs">
                        Already have an account?{" "}
                        <Link
                          href="/login"
                          className="text-purple-600 font-semibold hover:underline"
                        >
                          Log In
                        </Link>
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

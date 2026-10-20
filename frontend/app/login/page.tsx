"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useLogin, useForgotPassword, useVerifyResetOTP, useResetPassword } from "@/hooks/useSignup";
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/store/authSlice';
import { PENDING_VERIFICATION_KEY } from '@/lib/signupDraft';
type Step = "login" | "forgot" | "otp" | "reset";

const EASE = [0.4, 0, 0.2, 1] as const;

const slide = {
  initial: { x: 40, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -40, opacity: 0 },
  transition: { duration: 0.3, ease: EASE },
};

const inputCls =
  "w-full px-3.5 py-2 text-sm bg-white border border-gray-300 hover:border-purple-300 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 transition-colors";

const labelClass =
  "text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block";

function L({ t }: { t: string }) {
  return <label className={labelClass}>{t}</label>;
}

export default function Login() {
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

  const router = useRouter();

  // Step state
  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  // Mutations
  const loginMutation = useLogin();
  const forgotMutation = useForgotPassword();
  const verifyMutation = useVerifyResetOTP();
  const resetMutation = useResetPassword();
const dispatch = useDispatch();

const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  loginMutation.mutate(
    { email, password },
    {
      onSuccess: (res) => {
        const { token, user } = res.data;
          if (user.isAdmin) {
            setError("Admins must log in via the admin portal.");
            // Optional: redirect after a short delay
           router.push("/admin")
            return;
          }
        dispatch(loginSuccess({ token,  user: {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    isVerified: user.isVerified,
    isOnboarded: user.isOnboarded,
    isAdmin: user.isAdmin,   // <-- add
   
    redirectUrl: user.redirectUrl,
  }, }));
        window.location.replace(user.redirectUrl);
      },
      onError: (err: any) => {
        if (err.response?.data?.code === 'EMAIL_UNVERIFIED') {
          try { localStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify({ userId: err.response.data.userId, email })); } catch { /* Show the server error if storage is unavailable. */ }
          router.replace('/signup');
        }
        const msg = err.response?.data?.error || "Login failed. Please try again.";
        setError(msg);
      },
    }
  );
};
  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) {
      const el = document.getElementById(`otp-${i + 1}`);
      el?.focus();
    }
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      const el = document.getElementById(`otp-${i - 1}`);
      el?.focus();
    }
  };

  const stepMeta: Record<Step, { title: string; sub: string }> = {
    login: { title: "Welcome back", sub: "Sign in to your account" },
    forgot: { title: "Forgot password?", sub: "Enter your email and we'll send a code" },
    otp: { title: "Check your email", sub: `We sent a 6-digit code to ${email || "your email"}` },
    reset: { title: "Set new password", sub: "Choose a strong password to continue" },
  };

  const EyeIcon = ({ open }: { open: boolean }) => (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
      {open ? (
        <>
          <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" />
        </>
      ) : (
        <path
          d="M3 3l14 14M8.46 8.52A3 3 0 0013 13M6.35 6.39C4.26 7.6 2.5 10 2.5 10s3 6 7.5 6c1.55 0 2.94-.5 4.1-1.28M9.88 4.07C9.92 4.05 9.96 4 10 4c4.5 0 7.5 6 7.5 6a13 13 0 01-1.67 2.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      )}
    </svg>
  );

  // ---------- Handlers ----------

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    forgotMutation.mutate(
      { email },
      {
        onSuccess: () => {
          setStep("otp");
          setOtp(["", "", "", "", "", ""]);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.error || "Failed to send reset code.";
          setError(msg);
        },
      }
    );
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    verifyMutation.mutate(
      { email, otp: otpCode },
      {
        onSuccess: (res) => {
          setResetToken(res.data.resetToken);
          setStep("reset");
        },
        onError: (err: any) => {
          const msg = err.response?.data?.error || "Invalid or expired OTP.";
          setError(msg);
        },
      }
    );
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    resetMutation.mutate(
      { resetToken, newPassword },
      {
        onSuccess: () => {
          // Go back to login
          setStep("login");
          setNewPassword("");
          setConfirmPassword("");
          setResetToken("");
          setError("");
          // Optionally show success message
        },
        onError: (err: any) => {
          const msg = err.response?.data?.error || "Failed to reset password.";
          setError(msg);
        },
      }
    );
  };

  const loading =
    loginMutation.isPending ||
    forgotMutation.isPending ||
    verifyMutation.isPending ||
    resetMutation.isPending;

  return (
    <div className="w-full h-screen flex overflow-hidden bg-white">
      {/* Left panel - features */}
      <div className="relative flex-3 bg-[url('/signup-bg.png')] bg-cover bg-center items-center justify-center hidden lg:flex">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 w-[70%] flex flex-col gap-6 text-white">
           <Link href="/" className="flex items-center cursor-pointer flex-shrink-0">
            <img src="/favicon.png" alt="logo" className="h-[70px] w-auto" />
          </Link>
          <div className="flex flex-col gap-1">
            {features.map((feature) => (
              <div key={feature.id} className="flex flex-row items-start gap-4 py-3">
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
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`h-${step}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="mb-5"
            >
              <h1 className="text-xl font-bold text-gray-800 tracking-tight font-unbounded">
                {stepMeta[step].title}
              </h1>
              <p className="text-gray-500 text-xs mt-1">{stepMeta[step].sub}</p>
            </motion.div>
          </AnimatePresence>

          {error && (
            <div className="mb-3 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <AnimatePresence mode="wait" initial={false}>
              {step === "login" && (
                <motion.div key="login" {...slide}>
                  <form onSubmit={handleLogin} className="space-y-3">
                    <div>
                      <L t="Email" />
                      <input
                        type="email"
                        placeholder="jane@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputCls}
                        required
                      />
                    </div>
                    <div>
                      <L t="Password" />
                      <div className="relative">
                        <input
                          type={showPass ? "text" : "password"}
                          placeholder="Your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={inputCls + " pr-10"}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <EyeIcon open={showPass} />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end pt-0.5">
                      <button
                        type="button"
                        onClick={() => setStep("forgot")}
                        className="text-[11px] font-semibold text-brand-gradient hover:text-purple-700"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center justify-center gap-2 w-full btn-primary-gradient text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 shadow-lg mt-1"
                    >
                      {loading ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Signing in
                        </>
                      ) : (
                        <>
                          Sign in
                          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                            <path d="M5 11l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {step === "forgot" && (
                <motion.div key="forgot" {...slide}>
                  <form onSubmit={handleForgot} className="space-y-3">
                    <div>
                      <L t="Email address" />
                      <input
                        type="email"
                        placeholder="jane@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputCls}
                        required
                      />
                    </div>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center justify-center gap-2 w-full btn-primary-gradient text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 shadow-lg"
                    >
                      {loading ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Sending
                        </>
                      ) : (
                        "Send reset code"
                      )}
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => setStep("login")}
                      className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1 pt-1"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                        <path d="M8 10L4 6l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Back to sign in
                    </button>
                  </form>
                </motion.div>
              )}

              {step === "otp" && (
                <motion.div key="otp" {...slide}>
                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div>
                      <L t="6-digit code" />
                      <div className="flex gap-2">
                        {otp.map((v, i) => (
                          <input
                            key={i}
                            id={`otp-${i}`}
                            type="text"
                            inputMode="numeric"
                            value={v}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKey(i, e)}
                            maxLength={1}
                            className="w-full h-11 rounded-lg border border-gray-300 bg-white text-center text-lg font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 transition-colors caret-transparent"
                            required
                          />
                        ))}
                      </div>
                    </div>
                    <motion.button
                      type="submit"
                      disabled={loading || otp.join("").length < 6}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center justify-center gap-2 w-full btn-primary-gradient text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 shadow-lg"
                    >
                      {loading ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Verifying
                        </>
                      ) : (
                        "Verify code"
                      )}
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => {
                        // Resend – call forgot again with same email
                        forgotMutation.mutate({ email });
                      }}
                      className="w-full text-xs text-gray-400 hover:text-purple-600 transition-colors text-center"
                    >
                      Didn't receive it? Resend
                    </button>
                  </form>
                </motion.div>
              )}

              {step === "reset" && (
                <motion.div key="reset" {...slide}>
                  <form onSubmit={handleReset} className="space-y-3">
                    <div>
                      <L t="New password" />
                      <div className="relative">
                        <input
                          type={showNew ? "text" : "password"}
                          placeholder="Min. 8 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={inputCls + " pr-10"}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <EyeIcon open={showNew} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <L t="Confirm password" />
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          placeholder="Re-enter password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={inputCls + " pr-10"}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <EyeIcon open={showConfirm} />
                        </button>
                      </div>
                    </div>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center justify-center gap-2 w-full btn-primary-gradient text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 shadow-lg mt-1"
                    >
                      {loading ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Saving
                        </>
                      ) : (
                        "Set new password"
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="text-center mt-5">
            <p className="text-gray-500 text-xs">
              No account?{" "}
              <Link href="/signup" className="text-brand-gradient font-semibold hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
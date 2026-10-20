"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { RxCross1, RxEyeOpen, RxEyeClosed } from "react-icons/rx";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useDispatch } from "react-redux";
import { fanLoginSuccess } from "@/store/fanAuthSlice";
// ---------- Types ----------
type View =
  | "signin"
  | "signup"
  | "signup-otp"
  | "forgot-email"
  | "forgot-otp"
  | "reset-password"
  | "success";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: View;
  logoSrc: string;
  siteName: string;
  primaryColor: string;
  onAuthSuccess?: (user: any, token: string) => void;
}

// ---------- OTP Input ----------
function OtpInput({
  length = 6,
  value,
  onChange,
}: {
  length?: number;
  value: string;
  onChange: (val: string) => void;
}) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  const handleChange = (i: number, raw: string) => {
    const char = raw.replace(/[^0-9]/g, "").slice(-1);
    const next = digits.slice();
    next[i] = char;
    onChange(next.join(""));
    if (char && i < length - 1) {
      inputsRef.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (pasted) {
      e.preventDefault();
      onChange(pasted.slice(0, length));
      inputsRef.current[Math.min(pasted.length, length - 1)]?.focus();
    }
  };

  return (
    <div className="flex justify-between gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-lg font-semibold rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition"
          style={{ ["--tw-ring-color" as string]: "var(--auth-primary)" }}
        />
      ))}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wide">
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 transition";

function PasswordInput({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  id: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${inputClass} pr-12`}
        style={{ ["--tw-ring-color" as string]: "var(--auth-primary)" }}
        required
        minLength={8}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <RxEyeOpen size={20} /> : <RxEyeClosed size={20} />}
      </button>
    </div>
  );
}

// ---------- Main Component ----------
export default function AuthModal({
  isOpen,
  onClose,
  initialView = "signin",
  logoSrc,
  siteName,
  primaryColor,
  onAuthSuccess,
}: AuthModalProps) {
  const params = useParams<{ subdomain: string }>();
  const subdomain = params?.subdomain;
  const dispatch = useDispatch();
  const [view, setView] = useState<View>(initialView);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState("");

  // form state
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupOtp, setSignupOtp] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setDirection(1);
      setResetToken("");
    }
  }, [isOpen, initialView]);

  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const go = (next: View, dir: 1 | -1) => {
    setDirection(dir);
    setView(next);
  };

  // ---------- API Handlers ----------

  const handleSignin = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!subdomain) { toast.error("Invalid artist"); return; }
  setSubmitting(true);
  try {
    const res = await api.post(`/api/fans/${subdomain}/login`, {
      email: signinEmail,
      password: signinPassword,
    });
    const { token, fan } = res.data;
    // Dispatch Redux action
    dispatch(fanLoginSuccess({ token, fan }));
    if (onAuthSuccess) onAuthSuccess(fan, token);
    onClose();
  } catch (err: any) {
    toast.error(err.response?.data?.error || "Login failed");
  } finally {
    setSubmitting(false);
  }
};

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain) {
      toast.error("Invalid artist");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/api/fans/${subdomain}/register`, {
        fullName,
        email: signupEmail,
        password: signupPassword,
      }, { timeout: 150000 });
      toast.success("Account created. Please verify your email.");
      go("signup-otp", 1);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

 const handleVerifySignupOtp = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!subdomain) { toast.error("Invalid artist"); return; }
  if (signupOtp.length < 6) { toast.error("Please enter the full OTP"); return; }
  setSubmitting(true);
  try {
    const res = await api.post(`/api/fans/${subdomain}/verify-otp`, {
      email: signupEmail,
      otp: signupOtp,
    });
    const { token, fan } = res.data;
    dispatch(fanLoginSuccess({ token, fan }));
    if (onAuthSuccess) onAuthSuccess(fan, token);
    toast.success("Email verified!");
    go("success", 1);
  } catch (err: any) {
    toast.error(err.response?.data?.error || "Verification failed");
  } finally {
    setSubmitting(false);
  }
};

  const handleResendSignupOtp = async () => {
    if (!subdomain) return toast.error("Invalid artist");
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post(`/api/fans/${subdomain}/resend-otp`, {
        email: signupEmail,
      }, { timeout: 150000 });
      toast.success("OTP resent");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to resend");
    } finally { setSubmitting(false); }
  };

  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain) {
      toast.error("Invalid artist");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/api/fans/${subdomain}/forgot-password`, {
        email: forgotEmail,
      }, { timeout: 150000 });
      setForgotOtp('');
      setResetToken('');
      toast.success(res.data.message);
      go("forgot-otp", 1);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send code");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain) {
      toast.error("Invalid artist");
      return;
    }
    if (forgotOtp.length < 6) {
      toast.error("Please enter the full OTP");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/api/fans/${subdomain}/verify-reset-otp`, {
        email: forgotEmail,
        otp: forgotOtp,
      });
      setResetToken(res.data.resetToken);
      toast.success("OTP verified. Set a new password.");
      go("reset-password", 1);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Invalid OTP");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!subdomain) {
      toast.error("Invalid artist");
      return;
    }
    if (!resetToken) {
      toast.error("Something went wrong. Please restart the process.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/api/fans/${subdomain}/reset-password`, {
        resetToken,
        newPassword,
      });
      toast.success("Password reset successfully!");
      go("success", 1);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to reset password");
    } finally {
      setSubmitting(false);
    }
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 32 : -32, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -32 : 32, opacity: 0 }),
  };

  const titleFor: Record<View, string> = {
    signin: "Welcome back",
    signup: "Create your account",
    "signup-otp": "Verify your email",
    "forgot-email": "Reset your password",
    "forgot-otp": "Enter the code",
    "reset-password": "Set a new password",
    success: "You're all set",
  };

  const subtitleFor: Partial<Record<View, string>> = {
    signin: "Sign in to continue",
    signup: `Join ${siteName}`,
    "signup-otp": `We sent a 6-digit code to ${signupEmail || "your email"}`,
    "forgot-email": "We'll send a code to your email",
    "forgot-otp": `Enter the code sent to ${forgotEmail || "your email"}`,
    "reset-password": "Make it something you'll remember",
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ ["--auth-primary" as string]: primaryColor }}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
        >
          <RxCross1 size={18} />
        </button>

        <div className="px-8 pt-10 pb-8">
          <div className="flex justify-center mb-6">
            <Image
              src={logoSrc}
              alt={siteName}
              width={140}
              height={40}
              unoptimized={true}
              className="h-9 w-auto object-contain"
            />
          </div>

          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={`head-${view}`}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="text-center mb-6"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                {titleFor[view]}
              </h2>
              {subtitleFor[view] && (
                <p className="mt-1 text-sm text-gray-500">{subtitleFor[view]}</p>
              )}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={view}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {view === "signin" && (
                <form onSubmit={handleSignin} className="space-y-4">
                  <div>
                    <FieldLabel>Email</FieldLabel>
                    <input
                      type="email"
                      required
                      value={signinEmail}
                      onChange={(e) => setSigninEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputClass}
                      style={{ ["--tw-ring-color" as string]: "var(--auth-primary)" }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <FieldLabel>Password</FieldLabel>
                    </div>
                    <PasswordInput
                      id="signin-password"
                      value={signinPassword}
                      onChange={(e) => setSigninPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => go("forgot-email", 1)}
                      className="mt-2 text-xs font-medium text-gray-500 hover:text-gray-800 transition"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl py-3 text-white text-sm font-medium transition disabled:opacity-60"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {submitting ? "Signing in…" : "Sign in"}
                  </button>

                  <p className="text-center text-sm text-gray-500 pt-2">
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => go("signup", -1)}
                      className="font-medium"
                      style={{ color: primaryColor }}
                    >
                      Sign up
                    </button>
                  </p>
                </form>
              )}

              {view === "signup" && (
                <form onSubmit={handleSignupSubmit} className="space-y-4">
                  <div>
                    <FieldLabel>Full name</FieldLabel>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className={inputClass}
                      style={{ ["--tw-ring-color" as string]: "var(--auth-primary)" }}
                    />
                  </div>
                  <div>
                    <FieldLabel>Email</FieldLabel>
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputClass}
                      style={{ ["--tw-ring-color" as string]: "var(--auth-primary)" }}
                    />
                  </div>
                  <div>
                    <FieldLabel>Password</FieldLabel>
                    <PasswordInput
                      id="signup-password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="At least 8 characters"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl py-3 text-white text-sm font-medium transition disabled:opacity-60"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {submitting ? "Creating account…" : "Create account"}
                  </button>

                  <p className="text-center text-sm text-gray-500 pt-2">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => go("signin", -1)}
                      className="font-medium"
                      style={{ color: primaryColor }}
                    >
                      Sign in
                    </button>
                  </p>
                </form>
              )}

              {view === "signup-otp" && (
                <form onSubmit={handleVerifySignupOtp} className="space-y-6">
                  <OtpInput value={signupOtp} onChange={setSignupOtp} />
                  <button
                    type="submit"
                    disabled={submitting || signupOtp.length < 6}
                    className="w-full rounded-xl py-3 text-white text-sm font-medium transition disabled:opacity-60"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {submitting ? "Verifying…" : "Verify email"}
                  </button>
                  <p className="text-center text-sm text-gray-500">
                    Didn&apos;t get a code?{" "}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleResendSignupOtp}
                      className="font-medium"
                      style={{ color: primaryColor }}
                    >
                      Resend
                    </button>
                  </p>
                </form>
              )}

              {view === "forgot-email" && (
                <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                  <div>
                    <FieldLabel>Email</FieldLabel>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputClass}
                      style={{ ["--tw-ring-color" as string]: "var(--auth-primary)" }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl py-3 text-white text-sm font-medium transition disabled:opacity-60"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {submitting ? "Sending code…" : "Send code"}
                  </button>
                  <p className="text-center text-sm text-gray-500 pt-2">
                    Remembered it?{" "}
                    <button
                      type="button"
                      onClick={() => go("signin", -1)}
                      className="font-medium"
                      style={{ color: primaryColor }}
                    >
                      Sign in
                    </button>
                  </p>
                </form>
              )}

              {view === "forgot-otp" && (
                <form onSubmit={handleVerifyForgotOtp} className="space-y-6">
                  <OtpInput value={forgotOtp} onChange={setForgotOtp} />
                  <button
                    type="submit"
                    disabled={submitting || forgotOtp.length < 6}
                    className="w-full rounded-xl py-3 text-white text-sm font-medium transition disabled:opacity-60"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {submitting ? "Verifying…" : "Verify code"}
                  </button>
                  <p className="text-center text-sm text-gray-500">
                    Didn&apos;t get a code?{" "}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={async () => {
                        try {
                          if (submitting) return;
                          setSubmitting(true);
                          const res = await api.post(`/api/fans/${subdomain}/forgot-password`, { email: forgotEmail }, { timeout: 150000 });
                          setForgotOtp('');
                          setResetToken('');
                          toast.success(res.data.message);
                        } catch (error: any) {
                          toast.error(error.response?.data?.error || "Failed to resend");
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      className="font-medium"
                      style={{ color: primaryColor }}
                    >
                      Resend
                    </button>
                  </p>
                </form>
              )}

              {view === "reset-password" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <FieldLabel>New password</FieldLabel>
                    <PasswordInput
                      id="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                    />
                  </div>
                  <div>
                    <FieldLabel>Confirm password</FieldLabel>
                    <PasswordInput
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                    />
                    {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                      <p className="mt-1.5 text-xs text-red-500">
                        Passwords don&apos;t match
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      !newPassword ||
                      newPassword !== confirmPassword
                    }
                    className="w-full rounded-xl py-3 text-white text-sm font-medium transition disabled:opacity-60"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {submitting ? "Saving…" : "Save new password"}
                  </button>
                </form>
              )}

              {view === "success" && (
                <div className="text-center space-y-6">
                  <div
                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
                    style={{ backgroundColor: primaryColor + "1A" }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={primaryColor}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">
                    All done. You can continue to your account.
                  </p>
                  <button
                    onClick={onClose}
                    className="w-full rounded-xl py-3 text-white text-sm font-medium transition"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Continue
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "@/hooks/useSignup";
import { useDispatch } from "react-redux";
import { loginSuccess } from "@/store/authSlice";
import { clearSignupAfterLogin } from "@/lib/signupDraft";

export default function AdminLogin() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate(
      { email, password, portal: "admin" },
      {
        onSuccess: (res) => {
          const { token, user } = res.data;

          // ✅ Enforce admin role
          if (!user.isAdmin) {
            setError("Access denied. This portal is for administrators only.");
            return;
          }

          // Store auth state
          clearSignupAfterLogin();
          dispatch(loginSuccess({ token, user }));
          window.location.replace(user.redirectUrl); // should be "/admin/dashboard"
        },
        onError: (err: any) => {
          const msg = err.response?.data?.error || "Login failed.";
          setError(msg);
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Admin Login
        </h1>
        {error && (
          <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {loginMutation.isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
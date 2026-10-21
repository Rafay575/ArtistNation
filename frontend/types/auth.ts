// types/auth.ts

// Request payload for signup (matches backend)
export interface SignupRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  businessName: string;
  subdomain: string;
  billingAddress?: string;
  plan?: string;
  billingCycle?: string;
}

// Response from backend on success


// Generic error response (optional)
export interface ApiError {
  error: string;
}



export interface SignupPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  businessName: string;
  subdomain: string;
  billingAddress?: string;
  plan?: string;
  billingCycle?: string;
  paymentMethodId: string; // 👈 new
}

export interface SignupResponse {
  email: string;
  message: string;
  userId: number;
  businessId: number;
}

export interface VerifyOTPPayload {
  userId: number;
  otp: string;
}

export interface ResendOTPPayload {
  userId: number;
}

export interface LoginPayload {
  portal?: 'artist' | 'admin';
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    isVerified: boolean;
    isOnboarded: boolean;
    onboardingStep: number;
    redirectUrl: string;
    isAdmin: boolean;
  };
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyResetOTPPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  resetToken: string;
  newPassword: string;
}
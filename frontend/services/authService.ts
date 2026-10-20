import {api} from '@/lib/api';
import { SignupPayload, SignupResponse, VerifyOTPPayload, ResendOTPPayload } from '@/types/auth';

import {
  LoginPayload,
  LoginResponse,
  ForgotPasswordPayload,
  VerifyResetOTPPayload,
  ResetPasswordPayload,
} from '@/types/auth';


export const signupUser = async (payload: SignupPayload): Promise<SignupResponse> => {
  const response = await api.post('/api/signup', payload);
  return response.data;
};

export const verifyOTP = async (payload: VerifyOTPPayload): Promise<{
  message: string;
  verified: boolean;
  token: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    isVerified: boolean;
    isOnboarded: boolean;
    isAdmin: boolean;
  };
  subdomain?: string;
  siteUrl?: string;
}> => {
  const response = await api.post('/api/verify-otp', payload);
  return response.data;
};

export const resendOTP = async (payload: ResendOTPPayload): Promise<{ message: string }> => {
  const response = await api.post('/api/resend-otp', payload);
  return response.data;
};

export const authService = {
  login: (data: LoginPayload) => api.post<LoginResponse>('/api/login', data),
  forgotPassword: (data: ForgotPasswordPayload) =>
    api.post<{ message: string }>('/api/forgot-password', data),
  verifyResetOTP: (data: VerifyResetOTPPayload) =>
    api.post<{ message: string; resetToken: string }>('/api/verify-reset-otp', data),
  resetPassword: (data: ResetPasswordPayload) =>
    api.post<{ message: string }>('/api/reset-password', data),
};
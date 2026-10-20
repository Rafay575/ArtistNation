import { useMutation } from '@tanstack/react-query';
import { resendOTP, signupUser, verifyOTP } from '@/services/authService';
import { SignupPayload, SignupResponse } from '@/types/auth';
import { authService } from '@/services/authService';
import {
  LoginPayload,
  ForgotPasswordPayload,
  VerifyResetOTPPayload,
  ResetPasswordPayload,
} from '@/types/auth';
export function useSignup() {
  return useMutation<SignupResponse, Error, SignupPayload>({
    mutationFn: signupUser,
  });
}

export function useVerifyOTP() {
  return useMutation({
    mutationFn: verifyOTP,
  });
}

export function useResendOTP() {
  return useMutation({
    mutationFn: resendOTP,
  });
}



export const useLogin = () => {
  return useMutation({
    mutationFn: (data: LoginPayload) => authService.login(data),
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (data: ForgotPasswordPayload) => authService.forgotPassword(data),
  });
};

export const useVerifyResetOTP = () => {
  return useMutation({
    mutationFn: (data: VerifyResetOTPPayload) => authService.verifyResetOTP(data),
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (data: ResetPasswordPayload) => authService.resetPassword(data),
  });
};
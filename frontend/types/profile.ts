// types/profile.ts

// === User Table (all columns) ===
export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string; // sensitive – handle with care
  createdAt: string;    // ISO date
  updatedAt: string;
  isVerified: boolean;
  otpHash: string | null;
  otpExpiresAt: string | null;
  stripeCustomerId: string | null;
  stripePaymentIntentId: string | null;
  trialStartDate: string | null;
  trialEndDate: string | null;
  isTrialExpired: boolean;
  isOnboarded: boolean;
  plan: string | null;
  billingCycle: string | null;
  billingAddress: string | null;
  onboardingData: any; // JSON
  onboardingStep: number;
  artistName: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  websiteUrl: string | null;
  primaryGenre: string | null;
  secondaryGenres: string[] | null;
  artistType: string | null;
  yearsActive: string | null;
  experienceLevel: string | null;
  signedStatus: string | null;
  labelName: string | null;
  managementCompany: string | null;
  agencyInfo: string | null;
  socials: Record<string, string> | null;
  goals: string[] | null;
  profilePictureUrl: string | null;
  resetOtpHash: string | null;
  resetOtpExpiresAt: string | null;
  isAdmin: boolean;
}

// === Business Table (all columns) ===
export interface BusinessProfile {
  id: number;
  userId: number;
  businessName: string;
  subdomain: string;
  isActive: boolean;
  billingAddress: string | null;
  createdAt: string;
  isOnboarded: boolean;
  stripeAccountId: string | null;
  stripeAccountStatus: 'pending' | 'active' | 'restricted' | null;
}

// Combined profile response from API
export interface ProfileResponse {
  user: UserProfile;
  business: BusinessProfile;
}

// Payload for updating (only editable fields)
// This includes BOTH user and business editable fields
export type UpdateProfilePayload = Partial<{
  // User editable fields
  fullName: string;
  phone: string;
  billingAddress: string;
  plan: string;
  billingCycle: string;
  artistName: string;
  bio: string;
  city: string;
  state: string;
  country: string;
  websiteUrl: string;
  primaryGenre: string;
  secondaryGenres: string[];
  artistType: string;
  yearsActive: string;
  experienceLevel: string;
  signedStatus: string;
  labelName: string;
  managementCompany: string;
  agencyInfo: string;
  socials: Record<string, string>;
  goals: string[];
  profilePictureUrl: string;
  
  // Business editable fields
  businessName: string;
  businessBillingAddress: string;
  
  // Read-only fields (for display in UI)
  id: number;
  email: string;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
  isOnboarded: boolean;
  isTrialExpired: boolean;
  trialStartDate: string;
  trialEndDate: string;
  stripeCustomerId: string;
  stripePaymentIntentId: string;
  onboardingStep: number;
  onboardingData: any;
  isAdmin: boolean;
  businessId: number;
  subdomain: string;
  isActive: boolean;
  stripeAccountId: string;
  stripeAccountStatus: string;
}>;
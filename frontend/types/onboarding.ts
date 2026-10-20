// types/onboarding.ts
export type ExperienceLevel = "beginner" | "intermediate" | "professional" | "veteran" | "";
export type SignedStatus = "independent" | "signed" | "";

export interface OnboardingData {
  profilePicture: string | null;
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
  experienceLevel: ExperienceLevel;
  signedStatus: SignedStatus;
  labelName: string;
  managementCompany: string;
  agencyInfo: string;
  socials: Record<string, string>;
  goals: string[];
}

export interface DraftResponse {
  step: number;
  data: OnboardingData | null;
}
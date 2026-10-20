"use client";
import {
  ChevronDown,
  User,
  Music2,
  Briefcase,
  Share2,
  Target,
  Pencil,
} from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '@/store/authSlice';
import type { RootState } from '@/store';
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { VscDeviceCamera } from "react-icons/vsc";
import { RxCross1 } from "react-icons/rx";
import {
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaSpotify,
  FaSoundcloud,
  FaFacebook,
  FaXTwitter,
} from "react-icons/fa6";
import { useOnboardingDraft, useSaveDraft, useCompleteOnboarding } from "@/hooks/useOnboarding";
import type { OnboardingData } from "@/types/onboarding";
import Link from "next/link";
import { useMemo } from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { State, City } from "country-state-city";
import toast from 'react-hot-toast';
type OptionType = { value: string; label: string };

const US_COUNTRY: OptionType = { value: "US", label: "United States" };

// Shared tailwind-driven styling for react-select (v5 `unstyled` + `classNames` API)
const selectClassNames = {
  control: (state: any) =>
    `min-h-[38px] rounded-lg border bg-white px-2 text-sm transition-colors ${
      state.isFocused
        ? "border-purple-400 ring-1 ring-purple-200"
        : "border-gray-200"
    } ${state.isDisabled ? "bg-gray-50" : ""}`,
  menu: () =>
    "mt-1 rounded-lg border border-gray-200 bg-white shadow-md overflow-hidden z-20",
  menuList: () => "py-1 max-h-56",
  option: (state: any) =>
    `px-3 py-2 text-sm cursor-pointer ${
      state.isSelected
        ? "bg-purple-600 text-white"
        : state.isFocused
        ? "bg-purple-50 text-gray-900"
        : "text-gray-700"
    }`,
  placeholder: () => "text-gray-400 text-sm",
  singleValue: () => "text-sm text-gray-900",
  input: () => "text-sm",
  indicatorSeparator: () => "hidden",
  dropdownIndicator: () => "text-gray-400 px-2",
  clearIndicator: () => "text-gray-400 px-1 cursor-pointer hover:text-gray-600",
  noOptionsMessage: () => "text-xs text-gray-400 px-3 py-2",
};

type ExperienceLevel = "beginner" | "intermediate" | "professional" | "veteran" | "";
type SignedStatus = "independent" | "signed" | "";

// Initial data
const initialData: OnboardingData = {
  profilePicture: null,
  artistName: "",
  bio: "",
  city: "",
  state: "",
  country: "",
  websiteUrl: "",
  primaryGenre: "",
  secondaryGenres: [],
  artistType: "",
  yearsActive: "",
  experienceLevel: "",
  signedStatus: "",
  labelName: "",
  managementCompany: "",
  agencyInfo: "",
  socials: {},
  goals: [],
};

// ---------------------------------------------------------------------------
// Static option lists
// ---------------------------------------------------------------------------

const GENRES = [
  "Pop", "Hip-Hop", "R&B", "Country", "Rock", "Electronic", "Indie",
  "Jazz", "Classical", "Latin", "Reggae", "Folk", "Metal", "Gospel",
  "Afrobeat", "K-Pop",
];

const ARTIST_TYPES = [
  "Singer", "Rapper", "DJ", "Producer", "Band", "Songwriter",
  "Influencer", "Content Creator",
];

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string; hint: string }[] = [
  { value: "beginner", label: "Beginner", hint: "Just getting started" },
  { value: "intermediate", label: "Intermediate", hint: "Some releases or shows" },
  { value: "professional", label: "Professional", hint: "Earning from your craft" },
  { value: "veteran", label: "Veteran", hint: "10+ years in the game" },
];

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: FaInstagram, placeholder: "@yourhandle" },
  { key: "tiktok", label: "TikTok", icon: FaTiktok, placeholder: "@yourhandle" },
  { key: "youtube", label: "YouTube", icon: FaYoutube, placeholder: "Channel URL" },
  { key: "spotify", label: "Spotify", icon: FaSpotify, placeholder: "Artist profile URL" },
  { key: "soundcloud", label: "SoundCloud", icon: FaSoundcloud, placeholder: "Profile URL" },
  { key: "facebook", label: "Facebook", icon: FaFacebook, placeholder: "Page URL" },
  { key: "x", label: "X (Twitter)", icon: FaXTwitter, placeholder: "@yourhandle" },
];

const GOALS = [
  "Grow Fan Base",
  "Book Performances",
  "Promote Music Releases",
  "Collaborate with Artists",
  "Build Personal Brand",
  "Network with Industry Professionals",
];

const STEPS = ["Profile", "Artist Details", "Career", "Social", "Goals", "Review"];

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

const labelClass =
  "text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block";

const inputCls =
  "w-full px-3.5 py-2 text-sm bg-white border border-gray-300 hover:border-purple-300 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 transition-colors";

const inputErrCls =
  "w-full px-3.5 py-2 text-sm bg-white border border-red-300 hover:border-red-400 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-colors";

function L({ t, required }: { t: string; required?: boolean }) {
  return (
    <label className={labelClass}>
      {t} {required && <span className="text-red-400">*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-[11px] text-red-500 mt-1">{msg}</p>;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Onboarding() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const restoredRef = useRef(false);
  const features = [
    {
      id: 1,
      icon: "/o-icon1.png",
      title: "Explore Events Worldwide",
      description: "Stay updated on concerts, festivals and tours.",
    },
    {
      id: 2,
      icon: "/o-icon2.png",
      title: "Exclusive Access",
      description: "Get early tickets and special offers for your favorite artists.",
    },
    {
      id: 3,
      icon: "/o-icon3.png",
      title: "Personalized Alerts",
      description: "Never miss a beat with custom notifications tailored to your music tastes.",
    },
  ];

  // ------------------ State ------------------
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restoredNotice, setRestoredNotice] = useState(false);

  // ------------------ TanStack Query Hooks ------------------
  const { data: draftData, isLoading: draftLoading, error: draftError } = useOnboardingDraft();
  const saveDraftMutation = useSaveDraft();
  const completeMutation = useCompleteOnboarding();

  // ------------------ Load draft on mount ------------------
  useEffect(() => {
    if (draftData && !restoredRef.current) {
      restoredRef.current = true;
      const { step: savedStep, data: savedData } = draftData;
      if (savedData) {
        setData((prev) => ({ ...prev, ...savedData }));
        setStep(Number.isInteger(savedStep) ? Math.max(0, Math.min(savedStep, STEPS.length - 1)) : 0);
        setRestoredNotice(true);
      }
    }
  }, [draftData]);

  // ------------------ Handle already onboarded (403 redirect) ------------------
  useEffect(() => {
    if (draftError) {
      if ((draftError as any).response?.status === 401) { router.replace("/login"); return; }
      const error = draftError as any;
      if (error.response?.status === 403 && error.response?.data?.redirect) {
        const destination = error.response.data.redirect;
        if (/^https?:\/\//.test(destination)) window.location.replace(destination);
        else router.replace(destination);
      }
    }
  }, [draftError, router]);

  // ------------------ Save draft with mutation ------------------
  const saveDraft = useCallback((nextStep: number, nextData: OnboardingData) => {
    setSaveStatus("saving");
    saveDraftMutation.mutate(
      { step: nextStep, data: nextData },
      {
        onSuccess: () => {
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 1500);
        },
        onError: () => { setSaveStatus("idle"); setErrors(prev => ({ ...prev, submit: 'Draft could not be saved. Please retry before leaving.' })); },
      }
    );
  }, [saveDraftMutation]);

  // ------------------ Handlers ------------------
  const update = (patch: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  };

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateStep = (s: number): boolean => {
    const next: Record<string, string> = {};
    if (s === 0) {
      if (!data.artistName.trim()) next.artistName = "Artist / stage name is required";
      else if (data.artistName.length > 50) next.artistName = "Cannot exceed 50 characters";
      if (!data.bio.trim()) next.bio = "A short bio is required";
      else if (data.bio.length > 500) next.bio = "Bio cannot exceed 500 characters";
      if (!data.city.trim()) next.city = "City is required";
      if (!data.state.trim()) next.state = "State is required";
      if (!data.country.trim()) next.country = "Country is required";
      if (data.websiteUrl.trim()) {
        const ok = /^https?:\/\/[^\s]+\.[^\s]+$/.test(data.websiteUrl.trim());
        if (!ok) next.websiteUrl = "Enter a valid URL, e.g. https://yoursite.com";
      }
    }
    if (s === 1) {
      if (!data.primaryGenre) next.primaryGenre = "Select a primary genre";
      if (!data.artistType) next.artistType = "Select an artist type";
    }
    if (s === 2) {
      if (!data.yearsActive.trim()) next.yearsActive = "Years active is required";
      else if (!/^\d{1,2}$/.test(data.yearsActive.trim()))
        next.yearsActive = "Enter a number of years (0-99)";
      if (!data.experienceLevel) next.experienceLevel = "Select your experience level";
      if (!data.signedStatus) next.signedStatus = "Select independent or signed";
      if (data.signedStatus === "signed") {
        if (!data.labelName.trim()) next.labelName = "Label name is required";
        if (!data.managementCompany.trim())
          next.managementCompany = "Management company is required";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goToStep = (s: number) => {
    setDirection(s > step ? 1 : -1);
    setStep(s);
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    const nextStep = Math.min(step + 1, STEPS.length - 1);
    saveDraft(nextStep, data);
    goToStep(nextStep);
  };

  const handleBack = () => {
    goToStep(Math.max(step - 1, 0));
  };

  const handleSaveAndExit = async () => {
    try { await saveDraftMutation.mutateAsync({ step, data }); router.replace('/'); }
    catch { setErrors(prev => ({ ...prev, submit: 'Draft could not be saved. Please retry before leaving.' })); }
  };

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate size (2 MB)
  if (file.size > 2 * 1024 * 1024) {
    toast.error('Profile picture must be smaller than 2 MB');
    return;
  }

  // Validate type
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    toast.error('Only JPEG, PNG, or WebP images are allowed');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    update({ profilePicture: reader.result as string });
    clearError('profilePicture');
  };
  reader.readAsDataURL(file);
};

  const toggleSecondaryGenre = (genre: string) => {
    setData((prev) => {
      const exists = prev.secondaryGenres.includes(genre);
      return {
        ...prev,
        secondaryGenres: exists
          ? prev.secondaryGenres.filter((g) => g !== genre)
          : [...prev.secondaryGenres, genre],
      };
    });
  };

  const toggleGoal = (goal: string) => {
    setData((prev) => {
      const exists = prev.goals.includes(goal);
      return {
        ...prev,
        goals: exists ? prev.goals.filter((g) => g !== goal) : [...prev.goals, goal],
      };
    });
  };

  const updateSocial = (key: string, value: string) => {
    setData((prev) => ({ ...prev, socials: { ...prev.socials, [key]: value } }));
  };

  const handleSubmit = async () => {
    if (saveDraftMutation.isPending || completeMutation.isPending) return;
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      for (let s = 0; s <= 2; s++) {
        if (!validateStep(s)) {
          goToStep(s);
          break;
        }
      }
      return;
    }

    setIsSubmitting(true);
    completeMutation.mutate(data, {
      onSuccess: (response) => {
        // Clear localStorage (if any)
        localStorage.removeItem("artist-onboarding-draft");
        if (user) dispatch(updateUser({ ...user, isOnboarded: true, redirectUrl: response.data.redirectUrl }));
        window.location.replace(response.data.redirectUrl);
      },
      onError: (error: any) => {
        const msg = error.response?.data?.error || "Something went wrong. Please try again.";
        setErrors((prev) => ({ ...prev, submit: msg }));
        setIsSubmitting(false);
      },
      onSettled: () => {
        setIsSubmitting(false);
      },
    });
  };

  const isDone = step === STEPS.length;

  // ------------------ Loading state ------------------
  if (draftLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // ------------------ Render step indicator ------------------
  const renderStepIndicator = () => (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 mb-2">
        {STEPS.map((_, idx) => (
          <div
            key={idx}
            className={`h-1 flex-1 rounded-full transition-colors ${
              idx <= step || isDone ? "btn-primary-gradient" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-purple-600">
          {isDone ? "Complete" : `Step ${step + 1} of ${STEPS.length}`}
        </span>
        <span className="text-[11px] text-gray-400">{!isDone && STEPS[step]}</span>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen flex overflow-hidden bg-white">
      {/* Left panel */}
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

      {/* Right panel */}
      <div className="flex-4 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-[420px] mx-auto">
          {!isDone && (
            <>
              {renderStepIndicator()}

              {restoredNotice && (
                <div className="mb-3 px-3 py-2 text-[11px] text-purple-700 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                  <span>Welcome back — we restored your saved progress.</span>
                  <button
                    onClick={() => setRestoredNotice(false)}
                    className="text-purple-400 hover:text-purple-600"
                    aria-label="Dismiss"
                  >
                    <RxCross1 size={10} />
                  </button>
                </div>
              )}

              <div className="mb-4">
                <h1 className="text-xl font-bold text-gray-800 tracking-tight font-unbounded">
                  {step === 0 && "Tell us about yourself"}
                  {step === 1 && "Your sound"}
                  {step === 2 && "Career so far"}
                  {step === 3 && "Connect your platforms"}
                  {step === 4 && "What are you here for?"}
                  {step === 5 && "Review your profile"}
                </h1>
                <p className="text-gray-500 text-xs mt-1">
                  {step === 0 && "Personalize your profile"}
                  {step === 1 && "Help fans and collaborators find you"}
                  {step === 2 && "A little context on where you're at"}
                  {step === 3 && "Optional — link any profiles you'd like to share"}
                  {step === 4 && "Select all that apply — this shapes your experience"}
                  {step === 5 && "Make sure everything looks right"}
                </p>
              </div>

              {errors.submit && (
                <div className="mb-3 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {errors.submit}
                </div>
              )}
            </>
          )}

          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={isDone ? "done" : step}
                custom={direction}
                initial={{ opacity: 0, x: direction === 1 ? 60 : -60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction === 1 ? -60 : 60 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {isDone ? (
                  <DoneStep />
                ) : (
                  <>
                    {step === 0 && (
                      <ProfileStep
                        data={data}
                        errors={errors}
                        update={update}
                        clearError={clearError}
                        handleFileChange={handleFileChange}
                      />
                    )}
                    {step === 1 && (
                      <ArtistDetailsStep
                        data={data}
                        errors={errors}
                        update={update}
                        clearError={clearError}
                        toggleSecondaryGenre={toggleSecondaryGenre}
                      />
                    )}
                    {step === 2 && (
                      <CareerStep
                        data={data}
                        errors={errors}
                        update={update}
                        clearError={clearError}
                      />
                    )}
                    {step === 3 && (
                      <SocialStep data={data} updateSocial={updateSocial} />
                    )}
                    {step === 4 && (
                      <GoalsStep data={data} toggleGoal={toggleGoal} />
                    )}
                    {step === 5 && <ReviewStep data={data} goToStep={goToStep} />}

                    <div className="flex items-center justify-between pt-4 mt-2">
                      <div className="flex items-center gap-3">
                        {step > 0 ? (
                          <button
                            type="button"
                            onClick={handleBack}
                            disabled={isSubmitting || saveDraftMutation.isPending}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
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
                          <div />
                        )}
                        <button
                          type="button"
                          onClick={handleSaveAndExit}
                          className="text-xs text-gray-400 hover:text-purple-600 transition-colors"
                          disabled={saveDraftMutation.isPending || isSubmitting}
                        >
                          {saveDraftMutation.isPending
                            ? "Saving…"
                            : saveStatus === "saved"
                            ? "Saved ✓"
                            : "Save & exit"}
                        </button>
                      </div>

                      {step < STEPS.length - 1 ? (
                        <motion.button
                          type="button"
                          onClick={handleNext}
                          whileTap={{ scale: 0.97 }}
                          disabled={saveDraftMutation.isPending}
                          className="flex items-center gap-2 btn-primary-gradient text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-lg disabled:opacity-50"
                        >
                          Continue
                          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                            <path d="M5 11l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </motion.button>
                      ) : (
                        <motion.button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isSubmitting || completeMutation.isPending || saveDraftMutation.isPending}
                          whileTap={{ scale: 0.97 }}
                          className="flex items-center gap-2 btn-primary-gradient text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-lg disabled:opacity-50"
                        >
                          {isSubmitting || completeMutation.isPending ? (
                            <>
                              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Submitting…
                            </>
                          ) : (
                            <>
                              Complete Profile
                              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                                <path d="M5 11l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </>
                          )}
                        </motion.button>
                      )}
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

// ---------------------------------------------------------------------------
// Step 1: Profile
// ---------------------------------------------------------------------------


function ProfileStep({
  data,
  errors,
  update,
  clearError,
  handleFileChange,
}: {
  data: OnboardingData;
  errors: Record<string, string>;
  update: (p: Partial<OnboardingData>) => void;
  clearError: (f: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  // Lock country to the US on mount
 

  const stateOptions = useMemo<OptionType[]>(
    () =>
      State.getStatesOfCountry("US").map((s) => ({
        value: s.isoCode,
        label: s.name,
      })),
    []
  );

  const selectedStateOption = useMemo(
    () => stateOptions.find((s) => s.label === data.state) || null,
    [stateOptions, data.state]
  );

  const cityOptions = useMemo<OptionType[]>(() => {
    if (!selectedStateOption) return [];
    return City.getCitiesOfState("US", selectedStateOption.value).map((c) => ({
      value: c.name,
      label: c.name,
    }));
  }, [selectedStateOption]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center gap-2 mb-1">
        <div className="relative">
          <label
            htmlFor="avatar-upload"
            className="h-20 w-20 overflow-hidden rounded-full border-2 border-white shadow-sm relative block cursor-pointer"
          >
            {data.profilePicture ? (
              <img
                src={data.profilePicture}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gray-100 flex items-center justify-center text-gray-300 text-2xl font-semibold">
                ?
              </div>
            )}
            <div className="bg-black/50 flex items-center justify-center absolute bottom-0 left-0 w-full h-8">
              <VscDeviceCamera size={18} className="text-white" />
            </div>
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <FieldError msg={errors.profilePicture} />
        <p className="text-[10px] text-gray-400">Profile picture (optional) · Max 2 MB (JPEG, PNG, WebP)</p>
      </div>

      <div>
        <L t="Artist / Stage Name" required />
        <input
          type="text"
          value={data.artistName}
          
          maxLength={50}
          onChange={(e) => {
            update({ artistName: e.target.value });
            clearError("artistName");
          }}
          placeholder="Taylor Swift"
          className={errors.artistName ? inputErrCls : inputCls}
        />
        <div className="flex items-center justify-between">
          <FieldError msg={errors.artistName} />
          <span className="text-[10px] text-gray-400 ml-auto">{data.artistName.length}/50</span>
        </div>
      </div>

      <div>
        <L t="Professional Bio" required />
        <textarea
          value={data.bio}
          maxLength={500}
          rows={3}
          onChange={(e) => {
            update({ bio: e.target.value });
            clearError("bio");
          }}
          placeholder="Tell fans and collaborators who you are…"
          className={`${errors.bio ? inputErrCls : inputCls} resize-none`}
        />
        <div className="flex items-center justify-between">
          <FieldError msg={errors.bio} />
          <span className="text-[10px] text-gray-400 ml-auto">{data.bio.length}/500</span>
        </div>
      </div>
 <div>
  <L t="Country" required />
  <Select<OptionType>
    unstyled
    classNames={selectClassNames}
    options={[US_COUNTRY]}
    value={data.country ? { value: "US", label: data.country } : null}
    onChange={(opt) => {
      update({ country: opt?.label || "" });
      clearError("country");
    }}
    placeholder="Select country…"
  />
  <FieldError msg={errors.country} />
</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <L t="State" required />
          <Select<OptionType>
            unstyled
            classNames={selectClassNames}
            options={stateOptions}
            value={selectedStateOption}
            onChange={(opt) => {
              // reset city whenever state changes, since the old city may not belong to the new state
              update({ state: opt?.label || "", city: "" });
              clearError("state");
            }}
            placeholder="Search states…"
            isClearable
          />
          <FieldError msg={errors.state} />
        </div>

        <div>
          <L t="City" required />
          <CreatableSelect<OptionType>
            unstyled
            classNames={selectClassNames}
            options={cityOptions}
            value={data.city ? { value: data.city, label: data.city } : null}
            onChange={(opt) => {
              update({ city: opt?.value || "" });
              clearError("city");
            }}
            onCreateOption={(inputValue) => {
              update({ city: inputValue });
              clearError("city");
            }}
            formatCreateLabel={(input) => `Use "${input}"`}
            isDisabled={!selectedStateOption}
            placeholder={selectedStateOption ? "Search or type a city…" : "Select a state first"}
            isClearable
          />
          <FieldError msg={errors.city} />
        </div>
      </div>

    

      <div>
        <L t="Website URL" />
        <input
          type="text"
          value={data.websiteUrl}
          onChange={(e) => {
            update({ websiteUrl: e.target.value });
            clearError("websiteUrl");
          }}
          placeholder="https://yoursite.com"
          className={errors.websiteUrl ? inputErrCls : inputCls}
        />
        <FieldError msg={errors.websiteUrl} />
      </div>
    </div>
  );
}
// ---------------------------------------------------------------------------
// Step 2: Artist Details
// ---------------------------------------------------------------------------

function ArtistDetailsStep({
  data,
  errors,
  update,
  clearError,
  toggleSecondaryGenre,
}: {
  data: OnboardingData;
  errors: Record<string, string>;
  update: (p: Partial<OnboardingData>) => void;
  clearError: (f: string) => void;
  toggleSecondaryGenre: (g: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <L t="Primary Genre" required />
        <select
          value={data.primaryGenre}
          onChange={(e) => {
            update({ primaryGenre: e.target.value });
            clearError("primaryGenre");
          }}
          className={errors.primaryGenre ? inputErrCls : inputCls}
        >
          <option value="">Select a genre</option>
          {GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <FieldError msg={errors.primaryGenre} />
      </div>

      <div>
        <L t="Artist Type" required />
        <div className="flex flex-wrap gap-2 mt-1">
          {ARTIST_TYPES.map((type) => {
            const selected = data.artistType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  update({ artistType: type });
                  clearError("artistType");
                }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors border ${
                  selected
                    ? "btn-primary-gradient text-white border-transparent"
                    : "bg-white text-gray-600 border-gray-300 hover:border-purple-300"
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
        <FieldError msg={errors.artistType} />
      </div>

      <div className="rounded-lg border border-gray-300 bg-white p-3.5">
        <L t="Secondary Genres" />
        <p className="text-[10px] text-gray-400 -mt-0.5 mb-2">Optional — select any that fit</p>
        <div className="flex flex-wrap gap-2">
          {GENRES.filter((g) => g !== data.primaryGenre).map((genre) => {
            const selected = data.secondaryGenres.includes(genre);
            return selected ? (
              <span
                key={genre}
                onClick={() => toggleSecondaryGenre(genre)}
                className="flex items-center gap-1 rounded-full bg-[#1e005d] px-3.5 py-1 text-xs font-medium text-white cursor-pointer"
              >
                {genre}
                <RxCross1 size={11} className="opacity-80 hover:opacity-100" />
              </span>
            ) : (
              <button
                key={genre}
                type="button"
                onClick={() => toggleSecondaryGenre(genre)}
                className="rounded-full px-3.5 py-1 text-xs font-medium border border-gray-300 text-gray-500 hover:border-purple-300 transition-colors"
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Career
// ---------------------------------------------------------------------------

function CareerStep({
  data,
  errors,
  update,
  clearError,
}: {
  data: OnboardingData;
  errors: Record<string, string>;
  update: (p: Partial<OnboardingData>) => void;
  clearError: (f: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <L t="Years Active" required />
        <input
          type="text"
          inputMode="numeric"
          value={data.yearsActive}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
            update({ yearsActive: v });
            clearError("yearsActive");
          }}
          placeholder="e.g. 3"
          className={errors.yearsActive ? inputErrCls : inputCls}
        />
        <FieldError msg={errors.yearsActive} />
      </div>

      <div>
        <L t="Experience Level" required />
        <div className="grid grid-cols-2 gap-2 mt-1">
          {EXPERIENCE_LEVELS.map((lvl) => {
            const selected = data.experienceLevel === lvl.value;
            return (
              <button
                key={lvl.value}
                type="button"
                onClick={() => {
                  update({ experienceLevel: lvl.value });
                  clearError("experienceLevel");
                }}
                className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                  selected
                    ? "border-purple-400 bg-purple-50"
                    : "border-gray-300 hover:border-purple-300 bg-white"
                }`}
              >
                <p className={`text-xs font-semibold ${selected ? "text-purple-700" : "text-gray-700"}`}>
                  {lvl.label}
                </p>
                <p className="text-[10px] text-gray-400">{lvl.hint}</p>
              </button>
            );
          })}
        </div>
        <FieldError msg={errors.experienceLevel} />
      </div>

      <div>
        <L t="Status" required />
        <div className="grid grid-cols-2 gap-2 mt-1">
          {(["independent", "signed"] as const).map((status) => {
            const selected = data.signedStatus === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => {
                  update({ signedStatus: status });
                  clearError("signedStatus");
                }}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                  selected
                    ? "btn-primary-gradient text-white border-transparent"
                    : "border-gray-300 hover:border-purple-300 bg-white text-gray-600"
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
        <FieldError msg={errors.signedStatus} />
      </div>

      <AnimatePresence>
        {data.signedStatus === "signed" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-3.5"
          >
            <div>
              <L t="Label Name" required />
              <input
                type="text"
                value={data.labelName}
                onChange={(e) => {
                  update({ labelName: e.target.value });
                  clearError("labelName");
                }}
                placeholder="Big Machine Records"
                className={errors.labelName ? inputErrCls : inputCls}
              />
              <FieldError msg={errors.labelName} />
            </div>
            <div>
              <L t="Management Company" required />
              <input
                type="text"
                value={data.managementCompany}
                onChange={(e) => {
                  update({ managementCompany: e.target.value });
                  clearError("managementCompany");
                }}
                placeholder="13 Management"
                className={errors.managementCompany ? inputErrCls : inputCls}
              />
              <FieldError msg={errors.managementCompany} />
            </div>
            <div>
              <L t="Agency Information" />
              <input
                type="text"
                value={data.agencyInfo}
                onChange={(e) => update({ agencyInfo: e.target.value })}
                placeholder="CAA, WME, etc."
                className={inputCls}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Social
// ---------------------------------------------------------------------------

function SocialStep({
  data,
  updateSocial,
}: {
  data: OnboardingData;
  updateSocial: (k: string, v: string) => void;
}) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {SOCIAL_PLATFORMS.map((platform) => {
        const Icon = platform.icon;
        const isActive = active === platform.key;
        const hasValue = !!data.socials[platform.key]?.trim();

        return (
          <div
            key={platform.key}
            className={`rounded-lg border transition-colors ${
              isActive || hasValue ? "border-purple-300" : "border-gray-300"
            } bg-white overflow-hidden`}
          >
            <button
              type="button"
              onClick={() => setActive(isActive ? null : platform.key)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  hasValue ? "btn-primary-gradient text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                <Icon size={15} />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-700">{platform.label}</span>
              {hasValue && !isActive && (
                <span className="text-[11px] text-purple-500 truncate max-w-[120px]">
                  {data.socials[platform.key]}
                </span>
              )}
              <svg
                className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isActive ? "rotate-90" : ""}`}
                viewBox="0 0 14 14"
                fill="none"
              >
                <path d="M5 11l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3.5 pb-3">
                    <input
                      autoFocus
                      type="text"
                      value={data.socials[platform.key] || ""}
                      onChange={(e) => updateSocial(platform.key, e.target.value)}
                      placeholder={platform.placeholder}
                      className={inputCls}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Goals
// ---------------------------------------------------------------------------

function GoalsStep({ data, toggleGoal }: { data: OnboardingData; toggleGoal: (g: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {GOALS.map((goal) => {
        const selected = data.goals.includes(goal);
        return (
          <button
            key={goal}
            type="button"
            onClick={() => toggleGoal(goal)}
            className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
              selected
                ? "border-purple-400 bg-purple-50"
                : "border-gray-300 hover:border-purple-300 bg-white"
            }`}
          >
            <span className={`text-sm font-medium ${selected ? "text-purple-700" : "text-gray-700"}`}>
              {goal}
            </span>
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                selected ? "btn-primary-gradient border-transparent" : "border-gray-300"
              }`}
            >
              {selected && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 6: Review
// ---------------------------------------------------------------------------


function ReviewStep({
  data,
  goToStep,
}: {
  data: OnboardingData;
  goToStep: (s: number) => void;
}) {
  const [openSection, setOpenSection] = useState<number | null>(0);

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-[11px] text-gray-400 shrink-0">{label}</span>
      <span className="text-xs text-gray-700 text-right">{value || "—"}</span>
    </div>
  );

  const connectedSocials = Object.entries(data.socials).filter(([, v]) => v?.trim());

  const sections = [
    {
      title: "Profile",
      icon: User,
      step: 0,
      summary: data.artistName || "Not set",
      content: (
        <>
          <Row label="Name" value={data.artistName} />
          <Row
            label="Location"
            value={[data.city, data.state, data.country].filter(Boolean).join(", ")}
          />
          <Row label="Website" value={data.websiteUrl} />
        </>
      ),
    },
    {
      title: "Artist Details",
      icon: Music2,
      step: 1,
      summary: data.primaryGenre || "Not set",
      content: (
        <>
          <Row label="Primary genre" value={data.primaryGenre} />
          <Row label="Secondary genres" value={data.secondaryGenres.join(", ")} />
          <Row label="Artist type" value={data.artistType} />
        </>
      ),
    },
    {
      title: "Career",
      icon: Briefcase,
      step: 2,
      summary: data.experienceLevel || "Not set",
      content: (
        <>
          <Row label="Years active" value={data.yearsActive} />
          <Row label="Experience" value={data.experienceLevel} />
          <Row label="Status" value={data.signedStatus} />
          {data.signedStatus === "signed" && (
            <>
              <Row label="Label" value={data.labelName} />
              <Row label="Management" value={data.managementCompany} />
            </>
          )}
        </>
      ),
    },
    {
      title: "Social",
      icon: Share2,
      step: 3,
      summary: connectedSocials.length ? `${connectedSocials.length} connected` : "None connected",
      content: connectedSocials.length ? (
        connectedSocials.map(([k, v]) => (
          <Row
            key={k}
            label={SOCIAL_PLATFORMS.find((p) => p.key === k)?.label || k}
            value={v}
          />
        ))
      ) : (
        <p className="text-xs text-gray-400 py-1.5">None connected</p>
      ),
    },
    {
      title: "Goals",
      icon: Target,
      step: 4,
      summary: data.goals.length ? `${data.goals.length} selected` : "Not set",
      content: data.goals.length ? (
        <div className="flex flex-wrap gap-1.5 py-2">
          {data.goals.map((goal) => (
            <span
              key={goal}
              className="rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-medium text-purple-700"
            >
              {goal}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 py-1.5">No goals selected</p>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      {sections.map(({ title, icon: Icon, step, summary, content }, i) => {
        const isOpen = openSection === i;
        return (
          <div
            key={title}
            className={`rounded-xl border transition-colors duration-200 ${
              isOpen ? "border-purple-200 bg-purple-50/40" : "border-gray-200 bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenSection(isOpen ? null : i)}
              className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
                  isOpen ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                <Icon size={14} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-800">
                  {title}
                </p>
                {!isOpen && (
                  <p className="truncate text-xs text-gray-700">{summary}</p>
                )}
              </div>

              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  goToStep(step);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    goToStep(step);
                  }
                }}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-purple-600 hover:bg-purple-100"
              >
                <Pencil size={11} />
                Edit
              </span>

              <ChevronDown
                size={16}
                className={`shrink-0 text-gray-400 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`grid transition-all duration-200 ease-in-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="border-t border-purple-100 px-3.5 pb-3">
                  {content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
// ---------------------------------------------------------------------------
// Done Step
// ---------------------------------------------------------------------------

function DoneStep() {
  return (
    <div className="text-center space-y-4 py-4">
      <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 font-unbounded">Profile Complete!</h2>
      <p className="text-gray-500 text-sm">
        Your artist profile has been saved. Let's get you to your dashboard.
      </p>
      <a
        href="/admin/dashboard"
        className="inline-block bg-gradient-to-r from-[#0a054d] to-[#4c0082] text-white text-sm font-medium px-8 py-2.5 rounded-lg hover:opacity-90 transition-opacity shadow-lg mt-2"
      >
        Go to Dashboard
      </a>
    </div>
  );
}

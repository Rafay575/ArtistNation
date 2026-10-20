"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import {
  Camera,
  Loader2,
  Save,
  X,
  Pencil,
  Check,
  User,
  Music2,
  Briefcase,
  Share2,
  Info,
  CreditCard,
  Shield,
  Building2,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { UpdateProfilePayload } from "@/types/profile";

// ============================================================
// CONSTANTS & CONFIG
// ============================================================

const TABS = [
  { id: "personal", label: "Personal", icon: User },
  { id: "artist", label: "Artist", icon: Music2 },
  { id: "business", label: "Business", icon: Building2 },
  { id: "social", label: "Social & Goals", icon: Share2 },
  { id: "meta", label: "Account Meta", icon: Info },
] as const;

type TabId = (typeof TABS)[number]["id"];

const GENRES = [
  "Pop", "Hip-Hop", "R&B", "Country", "Rock", "Electronic", 
  "Indie", "Jazz", "Classical", "Latin", "Reggae", "Folk", 
  "Metal", "Gospel", "Afrobeat", "K-Pop"
];

const ARTIST_TYPES = [
  "Singer", "Rapper", "DJ", "Producer", "Band", 
  "Songwriter", "Influencer", "Content Creator"
];

const EXPERIENCE_LEVELS = ["beginner", "intermediate", "professional", "veteran"];

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", placeholder: "@yourhandle" },
  { key: "tiktok", label: "TikTok", placeholder: "@yourhandle" },
  { key: "youtube", label: "YouTube", placeholder: "Channel URL" },
  { key: "spotify", label: "Spotify", placeholder: "Artist profile URL" },
  { key: "soundcloud", label: "SoundCloud", placeholder: "Profile URL" },
  { key: "facebook", label: "Facebook", placeholder: "Page URL" },
  { key: "x", label: "X (Twitter)", placeholder: "@yourhandle" },
];

const GOALS = [
  "Grow Fan Base",
  "Book Performances",
  "Promote Music Releases",
  "Collaborate with Artists",
  "Build Personal Brand",
  "Network with Industry Professionals",
];

const GRADIENT = "bg-gradient-to-r from-[#110034] to-[#4b007d]";

const fieldInput =
  "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 " +
  "focus-visible:ring-2 focus-visible:ring-[#4b007d]/25 focus-visible:border-[#4b007d]/40 " +
  "disabled:opacity-60 disabled:bg-slate-50 disabled:cursor-not-allowed transition-colors";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ProfilePage() {
  const { data, isLoading, error } = useProfile();
  const updateMutation = useUpdateProfile();

  const [formData, setFormData] = useState<UpdateProfilePayload>({});
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedFormRef = useRef<UpdateProfilePayload>({});
  const [imageLoading, setImageLoading] = useState(false);

  // Load profile data
  useEffect(() => {
  if (data && !isEditing) {
    const { user, business } = data;

    // Helper: Convert null to undefined
    const toUndefined = <T,>(value: T | null | undefined): T | undefined => {
      if (value === null || value === undefined) return undefined;
      return value as T;
    };

    const loadedForm: UpdateProfilePayload = {
      // Personal
      fullName: toUndefined(user.fullName),
      phone: toUndefined(user.phone),
      billingAddress: toUndefined(user.billingAddress),
      plan: toUndefined(user.plan),
      billingCycle: toUndefined(user.billingCycle),

      // Artist
      artistName: toUndefined(user.artistName),
      bio: toUndefined(user.bio),
      city: toUndefined(user.city),
      state: toUndefined(user.state),
      country: toUndefined(user.country),
      websiteUrl: toUndefined(user.websiteUrl),
      primaryGenre: toUndefined(user.primaryGenre),
      secondaryGenres: user.secondaryGenres || [],
      artistType: toUndefined(user.artistType),
      yearsActive: toUndefined(user.yearsActive),
      experienceLevel: toUndefined(user.experienceLevel),
      signedStatus: toUndefined(user.signedStatus),
      labelName: toUndefined(user.labelName),
      managementCompany: toUndefined(user.managementCompany),
      agencyInfo: toUndefined(user.agencyInfo),

      // Social & Goals
      socials: user.socials || {},
      goals: user.goals || [],
      profilePictureUrl: toUndefined(user.profilePictureUrl),

      // Business
      businessName: toUndefined(business?.businessName),
      businessBillingAddress: toUndefined(business?.billingAddress),

      // Read-only (stored for display)
      id: user.id,
      email: user.email,
      createdAt: toUndefined(user.createdAt),
      updatedAt: toUndefined(user.updatedAt),
      isVerified: user.isVerified,
      isOnboarded: user.isOnboarded,
      isTrialExpired: user.isTrialExpired,
      trialStartDate: toUndefined(user.trialStartDate),
      trialEndDate: toUndefined(user.trialEndDate),
      stripeCustomerId: toUndefined(user.stripeCustomerId),
      stripePaymentIntentId: toUndefined(user.stripePaymentIntentId),
      onboardingStep: user.onboardingStep,
      onboardingData: user.onboardingData,
      isAdmin: user.isAdmin,

      // Business read-only
      businessId: business?.id,
      subdomain: toUndefined(business?.subdomain),
      isActive: business?.isActive,
      stripeAccountId: toUndefined(business?.stripeAccountId),
      stripeAccountStatus: toUndefined(business?.stripeAccountStatus),
    };
    savedFormRef.current = loadedForm;
    setFormData(loadedForm);
    setProfileImage(user.profilePictureUrl || null);
  }
}, [data, isEditing]);

  const handleChange = (field: keyof UpdateProfilePayload, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please choose a JPEG, PNG or WebP image');
      return;
    }
    setImageLoading(true);
    const reader = new FileReader();
    reader.onerror = () => { setImageLoading(false); toast.error('Could not read this image'); };
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImageLoading(false);
      setProfileImage(base64);
      setFormData((prev) => ({ ...prev, profilePictureUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (imageLoading || updateMutation.isPending) return;
    try {
      await updateMutation.mutateAsync(formData);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setFormData(savedFormRef.current);
    setProfileImage(savedFormRef.current.profilePictureUrl || null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsEditing(false);
  };

  if (isLoading) return <ProfileSkeleton />;

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-800">Failed to load profile</h2>
        <p className="mt-0.5 text-xs text-slate-400">Please try again later</p>
        <button
          onClick={() => window.location.reload()}
          className={`mt-6 rounded-full ${GRADIENT} px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-[#4b007d]/20 transition-transform hover:scale-[1.03] active:scale-[0.97]`}
        >
          Retry
        </button>
      </div>
    );
  }

  const isSubmitting = updateMutation.isPending || imageLoading;
  const displayName = formData.fullName || data?.user?.fullName || "User";

  return (
    <div className="relative min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Profile</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete profile with all your information
          </p>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="flex gap-2"
            >
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className={`flex items-center gap-1.5 rounded-full ${GRADIENT} px-4 py-2 text-sm font-medium text-white shadow-md shadow-[#4b007d]/20 transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-60 disabled:hover:scale-100`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsEditing(true)}
              className={`flex items-center gap-1.5 rounded-full ${GRADIENT} px-4 py-2 text-sm font-medium text-white shadow-md shadow-[#4b007d]/20 transition-transform hover:scale-[1.03] active:scale-[0.97]`}
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT — Profile Card */}
        <ProfileCard
          formData={formData}
          profileImage={profileImage}
          displayName={displayName}
          isEditing={isEditing && !isSubmitting}
          onImageUpload={handleImageUpload}
          fileInputRef={fileInputRef}
        />

        {/* RIGHT — Tabs */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-2"
        >
          {/* Tab Bar */}
          <div className="mb-6 flex gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap min-w-[80px]"
                >
                  {active && (
                    <motion.div
                      layoutId="activeTabPill"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      className={`absolute inset-0 rounded-full ${GRADIENT} shadow-md shadow-[#4b007d]/20`}
                    />
                  )}
                  <span
                    className={`relative z-10 flex items-center justify-center gap-1.5 ${
                      active ? "text-white" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                {activeTab === "personal" && (
                  <PersonalTab
                    formData={formData}
                    handleChange={handleChange}
                    isEditing={isEditing && !isSubmitting}
                  />
                )}
                {activeTab === "artist" && (
                  <ArtistTab
                    formData={formData}
                    handleChange={handleChange}
                    isEditing={isEditing && !isSubmitting}
                  />
                )}
                {activeTab === "business" && (
                  <BusinessTab
                    formData={formData}
                    handleChange={handleChange}
                    isEditing={isEditing && !isSubmitting}
                  />
                )}
                {activeTab === "social" && (
                  <SocialTab
                    formData={formData}
                    handleChange={handleChange}
                    isEditing={isEditing && !isSubmitting}
                  />
                )}
                {activeTab === "meta" && <MetaTab formData={formData} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================
// PROFILE CARD COMPONENT
// ============================================================

function ProfileCard({
  formData,
  profileImage,
  displayName,
  isEditing,
  onImageUpload,
  fileInputRef,
}: {
  formData: UpdateProfilePayload;
  profileImage: string | null;
  displayName: string;
  isEditing: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="lg:col-span-1"
    >
      <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0.15] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className={`absolute inset-0 -z-10 rounded-full ${GRADIENT} blur-xl`}
            />
            <div className={`rounded-full ${GRADIENT} p-[3px]`}>
              <Avatar className="h-28 w-28 border-4 border-white">
                <AvatarImage src={profileImage || undefined} alt={displayName} />
                <AvatarFallback className="bg-slate-100 text-2xl font-medium text-slate-600">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            {isEditing && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                className={`absolute bottom-0 right-0 rounded-full ${GRADIENT} p-2 text-white shadow-md shadow-[#4b007d]/30`}
              >
                <Camera className="h-4 w-4" />
              </motion.button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onImageUpload}
            />
          </div>

          <h2 className="text-lg font-semibold text-slate-800">{displayName}</h2>
          <p className="text-xs text-slate-400">{formData.email}</p>

          {/* Badges */}
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {formData.isVerified && (
              <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">
                <Check className="h-3 w-3 mr-1" /> Verified
              </Badge>
            )}
            {formData.isAdmin && (
              <Badge className="bg-purple-50 text-purple-600 border-purple-200">
                <Shield className="h-3 w-3 mr-1" /> Admin
              </Badge>
            )}
            {formData.isOnboarded && (
              <Badge className="bg-blue-50 text-blue-600 border-blue-200">
                <Check className="h-3 w-3 mr-1" /> Onboarded
              </Badge>
            )}
            {formData.isActive !== undefined && formData.isActive === true && (
              <Badge className="bg-green-50 text-green-600 border-green-200">
                <Check className="h-3 w-3 mr-1" /> Active
              </Badge>
            )}
          </div>

          <div className="my-5 h-px w-full bg-slate-100" />

          {/* Key Info */}
          <div className="w-full space-y-3 text-sm">
            <InfoRow label="User ID" value={formData.id} />
            <InfoRow label="Billing" value={formData.billingCycle || "Monthly"} capitalize />
            <InfoRow
              label="Subdomain"
              value={
                formData.subdomain
                  ? `${formData.subdomain}.artistnation.studio`
                  : "Not set"
              }
            />
            <InfoRow label="Trial" value={formData.isTrialExpired ? "Expired" : "Active"} />
            {formData.trialEndDate && (
              <InfoRow
                label="Trial End"
                value={new Date(formData.trialEndDate).toLocaleDateString()}
              />
            )}
            <InfoRow label="Onboarding Step" value={`Step ${formData.onboardingStep || 0}`} />
            <InfoRow
              label="Created"
              value={
                formData.createdAt
                  ? new Date(formData.createdAt).toLocaleDateString()
                  : "N/A"
              }
            />
            <InfoRow
              label="Updated"
              value={
                formData.updatedAt
                  ? new Date(formData.updatedAt).toLocaleDateString()
                  : "N/A"
              }
            />
          </div>

          {/* Stripe Info */}
          {(formData.stripeCustomerId || formData.stripePaymentIntentId) && (
            <>
              <div className="my-5 h-px w-full bg-slate-100" />
              <div className="w-full text-left space-y-2">
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5" /> Stripe Info
                </p>
                {formData.stripeCustomerId && (
                  <p className="text-xs text-slate-400 truncate">
                    Customer: {formData.stripeCustomerId}
                  </p>
                )}
                {formData.stripePaymentIntentId && (
                  <p className="text-xs text-slate-400 truncate">
                    Payment: {formData.stripePaymentIntentId}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Business Stripe Info */}
          {(formData.stripeAccountId || formData.stripeAccountStatus) && (
            <>
              <div className="my-5 h-px w-full bg-slate-100" />
              <div className="w-full text-left space-y-2">
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5" /> Stripe Account
                </p>
                {formData.stripeAccountId && (
                  <p className="text-xs text-slate-400 truncate">
                    ID: {formData.stripeAccountId}
                  </p>
                )}
                {formData.stripeAccountStatus && (
                  <InfoRow label="Status" value={formData.stripeAccountStatus} capitalize />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// SHARED COMPONENTS
// ============================================================

function InfoRow({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value?: string | number | boolean | null;
  capitalize?: boolean;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <span
        className={`text-xs font-medium text-slate-700 ${
          capitalize ? "capitalize" : ""
        }`}
      >
        {typeof value === "boolean" ? (value ? "Yes" : "No") : value}
      </span>
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-400 mt-0.5">{description}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <motion.div variants={item}>
      <Label className="mb-1.5 block text-xs font-medium text-slate-500">
        {label}
      </Label>
      {children}
    </motion.div>
  );
}

function SelectField({
  value,
  onChange,
  disabled,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder: string;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${fieldInput}`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o.charAt(0).toUpperCase() + o.slice(1)}
        </option>
      ))}
    </select>
  );
}

// ============================================================
// TAB 1 — PERSONAL
// ============================================================

function PersonalTab({
  formData,
  handleChange,
  isEditing,
}: {
  formData: UpdateProfilePayload;
  handleChange: (field: keyof UpdateProfilePayload, value: any) => void;
  isEditing: boolean;
}) {
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <SectionHeading
        title="Personal Information"
        description="Update your personal details and contact information"
      />
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Full Name">
            <Input
              value={formData.fullName || ""}
              onChange={(e) => handleChange("fullName", e.target.value)}
              disabled={!isEditing}
              placeholder="Your full name"
              className={fieldInput}
            />
          </Field>
          <Field label="Email">
            <Input value={formData.email || ""} disabled className={fieldInput} />
          </Field>
        </div>

        <Field label="Phone Number">
          <Input
            value={formData.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            disabled={!isEditing}
            placeholder="+1 234 567 8900"
            className={fieldInput}
          />
        </Field>

        <Field label="Billing Address">
          <Textarea
            value={formData.billingAddress || ""}
            onChange={(e) => handleChange("billingAddress", e.target.value)}
            disabled={!isEditing}
            placeholder="123 Main St, City, State, ZIP"
            rows={2}
            className={fieldInput}
          />
        </Field>



        {/* Read-only meta info */}
        <div className="mt-6 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-slate-400">User ID</p>
            <p className="text-sm font-medium text-slate-700">{formData.id}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Account Created</p>
            <p className="text-sm font-medium text-slate-700">
              {formData.createdAt
                ? new Date(formData.createdAt).toLocaleString()
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Last Updated</p>
            <p className="text-sm font-medium text-slate-700">
              {formData.updatedAt
                ? new Date(formData.updatedAt).toLocaleString()
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Status</p>
            <p className="text-sm font-medium text-slate-700">
              {formData.isVerified ? "✅ Verified" : "❌ Not Verified"}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// TAB 2 — ARTIST
// ============================================================

function ArtistTab({
  formData,
  handleChange,
  isEditing,
}: {
  formData: UpdateProfilePayload;
  handleChange: (field: keyof UpdateProfilePayload, value: any) => void;
  isEditing: boolean;
}) {
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <SectionHeading
        title="Artist Profile"
        description="Manage your artist persona and music career details"
      />
      <div className="space-y-5">
        <Field label="Artist / Stage Name">
          <Input
            value={formData.artistName || ""}
            onChange={(e) => handleChange("artistName", e.target.value)}
            disabled={!isEditing}
            placeholder="Your stage name"
            className={fieldInput}
          />
        </Field>

        <Field label="Bio">
          <Textarea
            value={formData.bio || ""}
            onChange={(e) => handleChange("bio", e.target.value)}
            disabled={!isEditing}
            placeholder="Tell your story…"
            rows={4}
            className={fieldInput}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Field label="City">
            <Input
              value={formData.city || ""}
              onChange={(e) => handleChange("city", e.target.value)}
              disabled={!isEditing}
              placeholder="Nashville"
              className={fieldInput}
            />
          </Field>
          <Field label="State">
            <Input
              value={formData.state || ""}
              onChange={(e) => handleChange("state", e.target.value)}
              disabled={!isEditing}
              placeholder="Tennessee"
              className={fieldInput}
            />
          </Field>
          <Field label="Country">
            <Input
              value={formData.country || ""}
              onChange={(e) => handleChange("country", e.target.value)}
              disabled={!isEditing}
              placeholder="United States"
              className={fieldInput}
            />
          </Field>
        </div>

        <Field label="Website">
          <Input
            value={formData.websiteUrl || ""}
            onChange={(e) => handleChange("websiteUrl", e.target.value)}
            disabled={!isEditing}
            placeholder="https://yoursite.com"
            className={fieldInput}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Primary Genre">
            <SelectField
              value={formData.primaryGenre || ""}
              onChange={(v) => handleChange("primaryGenre", v)}
              disabled={!isEditing}
              placeholder="Select a genre"
              options={GENRES}
            />
          </Field>
          <Field label="Artist Type">
            <SelectField
              value={formData.artistType || ""}
              onChange={(v) => handleChange("artistType", v)}
              disabled={!isEditing}
              placeholder="Select an artist type"
              options={ARTIST_TYPES}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Years Active">
            <Input
              value={formData.yearsActive || ""}
              onChange={(e) => handleChange("yearsActive", e.target.value)}
              disabled={!isEditing}
              placeholder="5"
              className={fieldInput}
            />
          </Field>
          <Field label="Experience Level">
            <SelectField
              value={formData.experienceLevel || ""}
              onChange={(v) => handleChange("experienceLevel", v)}
              disabled={!isEditing}
              placeholder="Select level"
              options={EXPERIENCE_LEVELS}
            />
          </Field>
        </div>

        <Field label="Status">
          <SelectField
            value={formData.signedStatus || ""}
            onChange={(v) => handleChange("signedStatus", v)}
            disabled={!isEditing}
            placeholder="Select status"
            options={["independent", "signed"]}
          />
        </Field>

        <AnimatePresence>
          {formData.signedStatus === "signed" && (
            <motion.div
              key="signed-details"
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={{
                hidden: { opacity: 0, height: 0 },
                show: { opacity: 1, height: "auto" },
              }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-5 rounded-xl border-l-2 border-[#4b007d]/40 bg-slate-50 p-4 md:grid-cols-2">
                <Field label="Label Name">
                  <Input
                    value={formData.labelName || ""}
                    onChange={(e) => handleChange("labelName", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Big Machine Records"
                    className={fieldInput}
                  />
                </Field>
                <Field label="Management Company">
                  <Input
                    value={formData.managementCompany || ""}
                    onChange={(e) => handleChange("managementCompany", e.target.value)}
                    disabled={!isEditing}
                    placeholder="13 Management"
                    className={fieldInput}
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Agency Information">
                    <Input
                      value={formData.agencyInfo || ""}
                      onChange={(e) => handleChange("agencyInfo", e.target.value)}
                      disabled={!isEditing}
                      placeholder="CAA, WME, etc."
                      className={fieldInput}
                    />
                  </Field>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Secondary Genres */}
        <motion.div variants={item}>
          <Label className="text-xs font-medium text-slate-500">
            Secondary Genres
          </Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {GENRES.map((genre) => {
              const isSelected = (formData.secondaryGenres || []).includes(genre);
              return (
                <motion.button
                  key={genre}
                  type="button"
                  whileTap={isEditing ? { scale: 0.94 } : undefined}
                  onClick={() => {
                    if (!isEditing) return;
                    const current = formData.secondaryGenres || [];
                    const updated = isSelected
                      ? current.filter((g) => g !== genre)
                      : [...current, genre];
                    handleChange("secondaryGenres", updated);
                  }}
                  disabled={!isEditing}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? `${GRADIENT} text-white shadow-sm shadow-[#4b007d]/20`
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  } ${!isEditing && "cursor-default"}`}
                >
                  {genre}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ============================================================
// TAB 3 — BUSINESS
// ============================================================

function BusinessTab({
  formData,
  handleChange,
  isEditing,
}: {
  formData: UpdateProfilePayload;
  handleChange: (field: keyof UpdateProfilePayload, value: any) => void;
  isEditing: boolean;
}) {
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <SectionHeading
        title="Business Information"
        description="Manage your business and company details"
      />
      <div className="space-y-5">
        <Field label="Business Name">
          <Input
            value={formData.businessName || ""}
            onChange={(e) => handleChange("businessName", e.target.value)}
            disabled={!isEditing}
            placeholder="Your business name"
            className={fieldInput}
          />
        </Field>

        <Field label="Business Billing Address">
          <Textarea
            value={formData.businessBillingAddress || ""}
            onChange={(e) => handleChange("businessBillingAddress", e.target.value)}
            disabled={!isEditing}
            placeholder="Business address"
            rows={2}
            className={fieldInput}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <motion.div
            variants={item}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <Label className="text-xs font-medium text-slate-500">Business ID</Label>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {formData.businessId || "N/A"}
            </p>
          </motion.div>
          <motion.div
            variants={item}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <Label className="text-xs font-medium text-slate-500">User ID</Label>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {formData.id || "N/A"}
            </p>
          </motion.div>
        </div>

        <motion.div
          variants={item}
          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <Label className="text-xs font-medium text-slate-500">Subdomain</Label>
          <p className="mt-1.5 font-mono text-sm text-[#4b007d]">
            {formData.subdomain
              ? `${formData.subdomain}.artistnation.studio`
              : "Not set"}
          </p>
          <p className="mt-1 text-xs text-slate-400">Your unique artist domain</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <motion.div
            variants={item}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <Label className="text-xs font-medium text-slate-500">Status</Label>
            <p
              className={`mt-1 text-sm font-medium ${
                formData.isActive ? "text-emerald-600" : "text-slate-500"
              }`}
            >
              {formData.isActive ? "✅ Active" : "❌ Inactive"}
            </p>
          </motion.div>
          <motion.div
            variants={item}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <Label className="text-xs font-medium text-slate-500">Onboarded</Label>
            <p
              className={`mt-1 text-sm font-medium ${
                formData.isOnboarded ? "text-emerald-600" : "text-slate-500"
              }`}
            >
              {formData.isOnboarded ? "✅ Yes" : "❌ No"}
            </p>
          </motion.div>
        </div>

        {formData.stripeAccountId && (
          <motion.div
            variants={item}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <Label className="text-xs font-medium text-slate-500">
              Stripe Account
            </Label>
            <p className="mt-1 text-sm font-mono text-slate-700">
              {formData.stripeAccountId}
            </p>
            {formData.stripeAccountStatus && (
              <p
                className={`mt-1 text-xs font-medium capitalize ${
                  formData.stripeAccountStatus === "active"
                    ? "text-emerald-600"
                    : formData.stripeAccountStatus === "pending"
                    ? "text-amber-600"
                    : "text-red-600"
                }`}
              >
                Status: {formData.stripeAccountStatus}
              </p>
            )}
          </motion.div>
        )}

        <motion.div
          variants={item}
          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <Label className="text-xs font-medium text-slate-500">Created At</Label>
          <p className="mt-1 text-sm font-medium text-slate-700">
            {formData.createdAt
              ? new Date(formData.createdAt).toLocaleString()
              : "N/A"}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ============================================================
// TAB 4 — SOCIAL & GOALS
// ============================================================

function SocialTab({
  formData,
  handleChange,
  isEditing,
}: {
  formData: UpdateProfilePayload;
  handleChange: (field: keyof UpdateProfilePayload, value: any) => void;
  isEditing: boolean;
}) {
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <SectionHeading
        title="Social Media & Goals"
        description="Connect your social profiles and set your goals"
      />

      <div className="space-y-3">
        {SOCIAL_PLATFORMS.map((platform) => (
          <motion.div
            key={platform.key}
            variants={item}
            className="grid grid-cols-3 items-center gap-2"
          >
            <Label className="col-span-1 text-xs text-slate-500">
              {platform.label}
            </Label>
            <Input
              className={`col-span-2 ${fieldInput}`}
              value={formData.socials?.[platform.key] || ""}
              onChange={(e) => {
                const newSocials = { ...(formData.socials || {}) };
                newSocials[platform.key] = e.target.value;
                handleChange("socials", newSocials);
              }}
              disabled={!isEditing}
              placeholder={platform.placeholder}
            />
          </motion.div>
        ))}
      </div>

      <div className="my-6 h-px w-full bg-slate-100" />

      <motion.div variants={item}>
        <Label className="text-xs font-medium text-slate-500">Goals</Label>
        <div className="mt-3 flex flex-wrap gap-2">
          {GOALS.map((goal) => {
            const isSelected = (formData.goals || []).includes(goal);
            return (
              <motion.button
                key={goal}
                type="button"
                whileTap={isEditing ? { scale: 0.94 } : undefined}
                onClick={() => {
                  if (!isEditing) return;
                  const currentGoals = formData.goals || [];
                  const newGoals = isSelected
                    ? currentGoals.filter((g) => g !== goal)
                    : [...currentGoals, goal];
                  handleChange("goals", newGoals);
                }}
                disabled={!isEditing}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? `${GRADIENT} text-white shadow-sm shadow-[#4b007d]/20`
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                } ${!isEditing && "cursor-default"}`}
              >
                <span className="flex items-center gap-1">
                  {goal}
                  {isSelected && isEditing && <X className="h-3 w-3" />}
                </span>
              </motion.button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {isEditing
            ? "Click to add/remove goals"
            : "Edit your profile to update goals"}
        </p>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// TAB 5 — META (Read-Only Everything)
// ============================================================

function MetaTab({ formData }: { formData: UpdateProfilePayload }) {
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <SectionHeading
        title="Account Metadata"
        description="Your account status and saved profile information"
      />

      <div className="space-y-6">
        {/* User Table Metadata */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-[#4b007d]" /> Account
          </h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <MetaRow label="ID" value={formData.id} />
            <MetaRow label="Full Name" value={formData.fullName} />
            <MetaRow label="Email" value={formData.email} />
            <MetaRow label="Phone" value={formData.phone} />
            <MetaRow label="Created At" value={formData.createdAt} />
            <MetaRow label="Updated At" value={formData.updatedAt} />
            <MetaRow label="Verified" value={formData.isVerified ? "Yes" : "No"} />
            <MetaRow label="Admin" value={formData.isAdmin ? "Yes" : "No"} />
            <MetaRow label="Onboarded" value={formData.isOnboarded ? "Yes" : "No"} />
            <MetaRow label="Onboarding Step" value={formData.onboardingStep} />
            <MetaRow label="Billing Cycle" value={formData.billingCycle} capitalize />
            <MetaRow label="Billing Address" value={formData.billingAddress} />
            <MetaRow label="Trial Ends" value={formData.trialEndDate} />
            <MetaRow
              label="Trial Expired"
              value={formData.isTrialExpired ? "Yes" : "No"}
            />
            <MetaRow
              label="Stripe Customer ID"
              value={formData.stripeCustomerId}
              code
            />
            <MetaRow
              label="Stripe Payment Intent"
              value={formData.stripePaymentIntentId}
              code
            />
          </div>
        </div>

        {/* Business Table Metadata */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#4b007d]" /> Business
          </h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <MetaRow label="Business ID" value={formData.businessId} />
            <MetaRow label="Business Name" value={formData.businessName} />
            <MetaRow label="Subdomain" value={formData.subdomain} />
            <MetaRow label="Active" value={formData.isActive ? "Yes" : "No"} />
            <MetaRow
              label="Billing Address"
              value={formData.businessBillingAddress}
            />
            <MetaRow
              label="Stripe Account ID"
              value={formData.stripeAccountId}
              code
            />
            <MetaRow
              label="Stripe Account Status"
              value={formData.stripeAccountStatus}
              capitalize
            />
          </div>
        </div>

        {/* Artist Data */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Music2 className="h-4 w-4 text-[#4b007d]" /> Artist Data
          </h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <MetaRow label="Artist Name" value={formData.artistName} />
            <MetaRow label="Primary Genre" value={formData.primaryGenre} />
            <MetaRow
              label="Secondary Genres"
              value={formData.secondaryGenres?.join(", ")}
            />
            <MetaRow label="Artist Type" value={formData.artistType} />
            <MetaRow label="Years Active" value={formData.yearsActive} />
            <MetaRow
              label="Experience Level"
              value={formData.experienceLevel}
              capitalize
            />
            <MetaRow
              label="Signed Status"
              value={formData.signedStatus}
              capitalize
            />
            <MetaRow label="Label Name" value={formData.labelName} />
            <MetaRow label="Management Company" value={formData.managementCompany} />
            <MetaRow label="Agency Info" value={formData.agencyInfo} />
            <MetaRow label="Bio" value={formData.bio} long />
            <MetaRow label="City" value={formData.city} />
            <MetaRow label="State" value={formData.state} />
            <MetaRow label="Country" value={formData.country} />
            <MetaRow label="Website URL" value={formData.websiteUrl} />
          </div>
        </div>

        {/* Onboarding Data (JSON) */}
        {formData.onboardingData && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-[#4b007d]" /> Onboarding Data (JSON)
            </h4>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 overflow-auto max-h-60">
              <pre className="text-xs text-slate-700 whitespace-pre-wrap break-all">
                {JSON.stringify(formData.onboardingData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MetaRow({
  label,
  value,
  capitalize = false,
  code = false,
  long = false,
}: {
  label: string;
  value?: unknown;
  capitalize?: boolean;
  code?: boolean;
  long?: boolean;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div
      className={`rounded-lg border border-slate-100 bg-white p-3 ${
        long ? "md:col-span-2" : ""
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p
        className={`mt-0.5 text-sm font-medium text-slate-700 ${
          capitalize ? "capitalize" : ""
        } ${code ? "font-mono text-xs" : ""}`}
      >
        {typeof value === "boolean"
          ? value
            ? "Yes"
            : "No"
          : typeof value === "string" && value.startsWith("{")
          ? "[JSON Object]"
          : typeof value === "object" ? JSON.stringify(value) : String(value)}
      </p>
    </div>
  );
}

// ============================================================
// SKELETON LOADING STATE
// ============================================================

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-32 bg-slate-200" />
          <Skeleton className="mt-2 h-3 w-56 bg-slate-200" />
        </div>
        <Skeleton className="h-10 w-32 rounded-full bg-slate-200" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <Skeleton className="h-28 w-28 rounded-full bg-slate-200" />
              <Skeleton className="mt-4 h-5 w-32 bg-slate-200" />
              <Skeleton className="mt-2 h-3 w-48 bg-slate-200" />
              <Skeleton className="mt-3 h-5 w-20 rounded-full bg-slate-200" />
              <div className="my-5 h-px w-full bg-slate-100" />
              <div className="w-full space-y-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-20 bg-slate-200" />
                    <Skeleton className="h-4 w-16 bg-slate-200" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Skeleton className="mb-6 h-11 w-full rounded-full bg-slate-200" />
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <Skeleton className="h-5 w-40 bg-slate-200" />
            <Skeleton className="mt-2 h-3 w-64 bg-slate-200" />
            <div className="mt-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full bg-slate-200" />
                  <Skeleton className="h-10 w-full bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

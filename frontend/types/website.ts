// lib/types/website.ts

export interface HeroSlide {
  bg: string;
  bgAlt: string;
  headline: string;
  subtext: string;
  cta: string;
}

export interface ArtistCard {
  src: string;
  name: string;
  subtitle: string;
  verified: boolean;
}

export interface AboutSection {
  title: string;
  heading: string;
  description1: string;
  founderName: string;
  founderTitle: string;
  founderBio: string;
  image: string;
  ctaText: string;
  artistCards: ArtistCard[];
}

export interface FeatureItem {
  title: string;
  description: string;
  icon: string;
}

export interface FeaturesSection {
  tag: string;
  heading: string;
  subtext: string;
  items: FeatureItem[];
}

export interface IconFeature {
  title: string;
  description: string;
  icon: string;
}

export interface ServicesSection {
  title: string;
  description: string;
  backgroundImage: string;
  features: IconFeature[];
}

export interface MerchandiseSection {
  title: string;
  description: string;
  mainImage: string;
  features: IconFeature[];
}

export interface EventsSection {
  backgroundImage: string;
  title: string;
  description: string;
  mainImage: string;
  bottomIconsImage: string;
  features: IconFeature[];
}

export interface PricingPlan {
  name: string;
  description: string;
  price: string;
  period: string;
  cta: string;
  popular: boolean;
  popularLabel: string;
  features: string[];
}

export interface PricingSection {
  heading: string;
  subtext: string;
  artistPlans: PricingPlan[];
  labelPlans: PricingPlan[];
}

export interface ContactSection {
  backgroundImage: string;
  heading: string;
  description: string;
}

export interface SocialIcon {
  src: string;
  alt: string;
}

export interface FooterLink {
  label: string;
  to: string;
}

export interface FooterSection {
  backgroundImage: string;
  brandName: string;
  tagline: string;
  socialIcons: SocialIcon[];
  subscribePlaceholder: string;
  subscribeButtonText: string;
  companyLinks: FooterLink[];
  helpLinks: FooterLink[];
  contactInfo: { address: string; email: string };
  copyright: string;
}

export interface NavbarSection {
  logo: string;
}

// Sections that can be hidden by an admin come back as `null` when hidden.
// navbar/footer are never null.
export interface HeroVideo {
  type: 'youtube' | 'file';
  url: string;   // used when type === 'youtube'
  file: string;  // used when type === 'file' (uploaded video URL)
}

export interface WebsiteConfig {
  navbar: NavbarSection;
  heroSlides: HeroSlide[] | null;
  heroVideo: HeroVideo;        // ✅ NEW — shared video for the hero
  about: AboutSection | null;
  features: FeaturesSection | null;
  services: ServicesSection | null;
  merchandise: MerchandiseSection | null;
  events: EventsSection | null;
  pricing: PricingSection | null;
  contact: ContactSection | null;
  footer: FooterSection;
  updatedAt: string;
}
// lib/types/website.ts
// Mirrors SECTION_COLUMNS / HIDEABLE_SECTIONS in controllers/mainWebsiteController.js
// and the seed JSON, so the admin forms and the backend never drift apart.

export type SectionKey =
  | "navbar"
  | "heroSlides"
   | 'heroVideo'  
  | "about"
  | "features"
  | "services"
  | "merchandise"
  | "events"
  | "pricing"
  | "contact"
  | "footer";

// Matches HIDEABLE_SECTIONS on the backend exactly — navbar/footer can't be hidden.
export type HideableSection =
  | "heroSlides"
  | "about"
  | "features"
  | "services"
  | "merchandise"
  | "events"
  | "pricing"
  | "contact";

export interface NavbarConfig {
  logo: string;
}

export interface HeroSlide {
  bg: string;
  bgAlt: string;
  headline: string;
  subtext: string;
  cta: string;
}

export interface ArtistCard {
  src: string;
  name: string;
  subtitle: string;
  verified: boolean;
}

export interface AboutConfig {
  title: string;
  heading: string;
  description1: string;
  founderName: string;
  founderTitle: string;
  founderBio: string;
  image: string;
  ctaText: string;
  artistCards: ArtistCard[];
}

export interface FeatureItem {
  title: string;
  description: string;
  icon: string; // emoji
}

export interface FeaturesConfig {
  tag: string;
  heading: string;
  subtext: string;
  items: FeatureItem[];
}

// Shared shape for services / merchandise / events "feature point" rows,
// which all use an icon *image path* rather than an emoji.
export interface IconFeature {
  title: string;
  description: string;
  icon: string;
}

export interface ServicesConfig {
  title: string;
  description: string;
  backgroundImage: string;
  features: IconFeature[];
}

export interface MerchandiseConfig {
  title: string;
  description: string;
  mainImage: string;
  features: IconFeature[];
}

export interface EventsConfig {
  backgroundImage: string;
  title: string;
  description: string;
  mainImage: string;
  bottomIconsImage: string;
  features: IconFeature[];
}

export interface PricingPlan {
  name: string;
  description: string;
  price: string;
  period: string;
  cta: string;
  popular: boolean;
  popularLabel: string;
  features: string[];
}

export interface PricingConfig {
  heading: string;
  subtext: string;
  artistPlans: PricingPlan[];
  labelPlans: PricingPlan[];
}

export interface ContactConfig {
  backgroundImage: string;
  heading: string;
  description: string;
}

export interface SocialIcon {
  src: string;
  alt: string;
}

export interface FooterLink {
  label: string;
  to: string;
}

export interface FooterConfig {
  backgroundImage: string;
  brandName: string;
  tagline: string;
  socialIcons: SocialIcon[];
  subscribePlaceholder: string;
  subscribeButtonText: string;
  companyLinks: FooterLink[];
  helpLinks: FooterLink[];
  contactInfo: {
    address: string;
    email: string;
  };
  copyright: string;
}

// visibility[section] === false means hidden; anything else (true/undefined) means visible.
export type VisibilityMap = Partial<Record<HideableSection, boolean>>;

export interface AdminWebsiteConfig {
  navbar: NavbarConfig;
  heroSlides: HeroSlide[];
  about: AboutConfig;
  heroVideo: HeroVideo;
  features: FeaturesConfig;
  services: ServicesConfig;
  merchandise: MerchandiseConfig;
  events: EventsConfig;
  pricing: PricingConfig;
  contact: ContactConfig;
  footer: FooterConfig;
  visibility: VisibilityMap;
  updatedAt: string;
}
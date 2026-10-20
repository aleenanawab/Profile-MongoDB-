export type ProfileType = 'individual' | 'team';

export function normalizeProfileType(type?: string): ProfileType {
  if (!type) return 'individual';
  const clean = type.toLowerCase().trim();
  if (clean === 'team' || clean === 'company') return 'team';
  return 'individual';
}

export type ProfileTheme = 
  | 'editorial' 
  | 'cyber' 
  | 'luxe' 
  | 'default' 
  | 'dark' 
  | 'minimal' 
  | 'professional' 
  | 'elegant' 
  | 'modern'
  | 'gradient'
  | 'soft';

export interface ProfileLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  visible?: boolean;
  order?: number;
}

export interface SharingSettings {
  photo?: boolean;
  nameAndTitle?: boolean;
  bio?: boolean;
  contactInfo?: boolean;
  email?: boolean;
  phone?: boolean;
  links?: boolean;
  socialLinks?: boolean;
  skills?: boolean;
  experience?: boolean;
  education?: boolean;
  certifications?: boolean;
  projects?: boolean;
  services?: boolean;
  recommendations?: boolean;
  volunteer?: boolean;
  languages?: boolean;
  companySection?: boolean;
  nfcCard?: boolean;
  customFields?: boolean;
}

export const DEFAULT_SHARING_SETTINGS: SharingSettings = {
  photo: true,
  nameAndTitle: true,
  bio: true,
  contactInfo: true,
  email: true,
  phone: true,
  links: true,
  socialLinks: true,
  skills: true,
  experience: true,
  education: true,
  certifications: true,
  projects: true,
  services: true,
  languages: true,
  recommendations: true,
  companySection: true,
  nfcCard: true,
  customFields: true
};

export const DEFAULT_SECTION_VISIBILITY: Record<string, boolean> = {
  hero: true,
  about: true,
  contact: true,
  services: true,
  skills: true,
  projects: true,
  'custom-fields': true,
  experience: true,
  education: true,
  certifications: true,
  languages: true,
  recommendations: true,
  socialLinks: true,
  socials: true,
  'virtual-card': true,
  company: true
};

export const DEFAULT_SECTION_ORDER: string[] = [
  'hero',
  'about',
  'contact',
  'services',
  'skills',
  'projects',
  'custom-fields',
  'experience',
  'education',
  'certifications',
  'languages',
  'recommendations',
  'socialLinks',
  'virtual-card',
  'company'
];


export interface UserSession {
  id: string;
  userId?: string;
  name: string;
  email: string;
  avatar?: string;
  role?: ProfileType;
  preferredTheme?: ProfileTheme;
  onboardingCompleted?: boolean;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  role?: ProfileType;
  avatar?: string;
  resetToken?: string;
  resetTokenExpires?: string;
  onboardingCompleted?: boolean;
  recoveryCodeHash?: string;
  preferredTheme?: ProfileTheme;
  googleSub?: string;
}

export interface UserConnection {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  toProfileId: string;
  toUserId?: string;
  createdAt: string;
  note?: string;
}

export type UserRole = 'owner' | 'team_member' | 'company_admin' | 'visitor';

export type NavigationOrigin = 'company' | 'my_card' | 'direct' | 'team';

export interface SocialLink {
  platform: 'linkedin' | 'instagram' | 'twitter' | 'github' | 'website' | 'email' | 'facebook' | 'dribbble' | 'behance' | 'youtube' | 'whatsapp' | 'phone' | 'other';
  url: string;
  label?: string;
  handle?: string;
  visible?: boolean;
}

export interface MetricHighlight {
  label: string;
  value: string;
  description?: string;
}

export interface SkillItem {
  name: string;
  category?: string;
  level?: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description?: string;
  badge?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  tagline?: string;
  description: string;
  coverImage?: string;
  image?: string;
  category?: string;
  technology?: string;
  tags?: string[];
  liveUrl?: string;
  link?: string;
  imagePosition?: string;
  imageFit?: 'cover' | 'contain';
  client?: string;
  year?: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  year?: string;
  period?: string;
  description?: string;
}

export interface ExperienceItem {
  id: string;
  role?: string;
  company: string;
  period?: string;
  location?: string;
  description?: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  issued: string;
  expires?: string;
  credentialId?: string;
  url?: string;
}

export interface VolunteerItem {
  id: string;
  role: string;
  organization: string;
  period: string;
  category?: string;
}

export interface LanguageItem {
  language: string;
  proficiency: string;
}

export interface RecommendationItem {
  id: string;
  author: string;
  designation?: string;
  company?: string;
  summary: string;
  fullText?: string;
  avatar?: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  designation: string;
  company: string;
  avatar: string;
  rating?: number;
  date?: string;
}

export interface TeamMemberItem {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  bio: string;
  email?: string;
  phone?: string;
  profileId?: string;
  socials?: SocialLink[];
  status?: 'ACTIVE' | 'PENDING' | 'REMOVED';
}

export interface CompanyInfo {
  id: string;
  name: string;
  tagline: string;
  logo: string;
  industry: string;
  location: string;
  website: string;
  employeeCount?: string;
  profileId: string;
}

export interface CustomCta {
  label: string;
  url: string;
  active: boolean;
}

export interface DirectContactItem {
  id: string;
  type: 'whatsapp' | 'phone' | 'email' | 'website' | 'location' | 'telegram' | 'booking' | 'custom';
  label: string;
  value: string;
  url?: string;
  active?: boolean;
}

export interface CustomFieldItem {
  id: string;
  label: string;
  value: string;
  title?: string;
  content?: string;
  type?: 'text' | 'link' | 'email' | 'phone' | 'date' | 'number' | 'markdown';
  icon?: string;
  visible?: boolean;
  order?: number;
}

export interface DynamicSection<T = React.ReactNode> {
  id: string;
  key: string;
  title: string;
  type: string;
  visible: boolean;
  order: number;
  data?: T;
  customFields?: CustomFieldItem[];
}

export interface ProfileData {
  id: string;
  userId?: string;
  theme?: ProfileTheme;
  type: ProfileType;
  profileType?: 'individual' | 'team';
  slug: string;
  username?: string;
  companyId?: string;
  companyName?: string;
  
  // Linktree-Style Links and Button Styling
  links?: ProfileLink[];
  buttonRadius?: 'square' | 'rounded' | 'pill';
  buttonStyle?: 'solid' | 'outline' | 'soft';
  customThemeColors?: {
    background?: string;
    textColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
  };
  
  // Identity
  name: string;
  firstName?: string;
  secondName?: string;
  lastName?: string;
  designation?: string;
  professionalTitle?: string;
  department?: string;
  company?: string;
  companyLogo?: string;
  companyInfo?: CompanyInfo;
  tagline?: string;
  coverSlogan?: string;
  avatar: string;
  avatarPublicId?: string;
  coverImage?: string;
  coverImagePublicId?: string;
  verified?: boolean;
  pronouns?: string;
  birthday?: string;
  location: string;
  country?: string;
  bio?: string;
  about?: string;
  shortBio?: string;
  fullBio?: string;
  statusBadge?: string;
  customCta?: CustomCta;
  followersCount?: string;
  connectionsCount?: string;

  // Contact Channels
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  bookingUrl?: string;
  officeAddress?: string;
  googleMapsUrl?: string;
  contactOrder?: string[];
  customContacts?: DirectContactItem[];

  // NFC Pass
  nfcCard?: {
    cardNumber: string;
    chipId: string;
    finish?: 'obsidian' | 'white' | 'emerald' | 'gold';
  };

  // Highlights & Sections
  highlights?: MetricHighlight[];
  skills?: (string | SkillItem)[];
  services?: ServiceItem[];
  experience?: ExperienceItem[];
  experiences?: ExperienceItem[];
  education?: EducationItem[];
  projects?: ProjectItem[];
  certifications?: CertificationItem[];
  volunteerExperiences?: VolunteerItem[];
  languages?: LanguageItem[];
  recommendations?: RecommendationItem[];
  testimonials?: TestimonialItem[];
  resumeUrl?: string;
  resumeFileName?: string;
  
  // Dynamic Custom Fields (Unlimited & Flexible)
  customFields?: CustomFieldItem[];

  // Dynamic Sections (Modular Extensible Sections)
  dynamicSections?: DynamicSection[];

  // For Company Profiles
  teamMembers?: TeamMemberItem[];

  // Socials
  socials: SocialLink[];
  socialLinks?: { platform: string; url: string; label?: string; visible?: boolean }[];

  // Multi-Profile Identity & Metadata
  profileName?: string;
  profession?: string;
  createdAt?: string;
  updatedAt?: string;

  // Sharing Configuration & Layout Order / Visibility
  sharingSettings?: SharingSettings;
  sectionOrder?: string[];
  sectionVisibility?: Record<string, boolean>;
}

export function ensureProfileLinks(profile?: Partial<ProfileData> | null): ProfileLink[] {
  if (profile?.links && Array.isArray(profile.links) && profile.links.length > 0) {
    return profile.links.map((link, idx) => ({
      ...link,
      id: link.id || `link-${idx + 1}`,
      order: typeof link.order === 'number' ? link.order : idx + 1,
      visible: link.visible !== false
    }));
  }

  // Derive initial links gracefully from projects and website if links not yet populated
  const derived: ProfileLink[] = [];
  let order = 1;

  if (profile?.website) {
    derived.push({
      id: 'link-website',
      title: 'Official Website / Portfolio',
      url: profile.website,
      icon: 'website',
      visible: true,
      order: order++
    });
  }

  if (profile?.projects && Array.isArray(profile.projects)) {
    profile.projects.forEach((proj, idx) => {
      const url = proj.liveUrl || proj.link;
      if (url) {
        derived.push({
          id: proj.id || `link-proj-${idx + 1}`,
          title: proj.title || `Project ${idx + 1}`,
          url: url,
          icon: 'portfolio',
          visible: true,
          order: order++
        });
      }
    });
  }

  // If still empty, provide clean default showcase links
  if (derived.length === 0) {
    derived.push(
      {
        id: 'link-portfolio',
        title: 'Portfolio & Case Studies',
        url: 'https://github.com',
        icon: 'portfolio',
        visible: true,
        order: 1
      },
      {
        id: 'link-github',
        title: 'GitHub Repositories & Code',
        url: 'https://github.com',
        icon: 'github',
        visible: true,
        order: 2
      },
      {
        id: 'link-linkedin',
        title: 'Connect on LinkedIn',
        url: 'https://linkedin.com',
        icon: 'linkedin',
        visible: true,
        order: 3
      }
    );
  }

  return derived;
}



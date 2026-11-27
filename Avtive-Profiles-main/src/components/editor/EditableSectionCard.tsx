'use client';

import React, { useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  FileText,
  Phone,
  Link2,
  Code,
  Sparkles,
  FolderGit2,
  Briefcase,
  GraduationCap,
  Award,
  Quote,
  Globe,
  Tag,
  FileUp,
  Star,
  HeartHandshake,
  Trophy,
  BookOpen,
  Lightbulb,
  BookMarked,
  FileSpreadsheet,
  Network,
  Compass,
  Building2,
  Users,
  CreditCard,
  Layers,
} from 'lucide-react';
import { ProfileData, DynamicSection } from '@/types/profile';
import { ThemeConfig } from '@/components/ui/themeStyles';
import { useLongPressDrag } from '@/hooks/useLongPressDrag';
import { normalizeSectionKey } from '@/lib/sections';
import { getAbout } from '@/lib/profileGetters';
import { AboutSection } from '@/components/profile-sections/AboutSection';
import { ProfileContactSection } from '@/components/profile-sections/ProfileContactSection';
import { SocialLinksSection } from '@/components/profile-sections/SocialLinksSection';
import { SkillsSection, ServicesSection } from '@/components/profile-sections/SkillsServicesSection';
import { PortfolioSection } from '@/components/profile-sections/PortfolioSection';
import { ExperienceSection } from '@/components/profile-sections/ExperienceSection';
import { EducationSection } from '@/components/profile-sections/EducationSection';
import { CertificationsSection } from '@/components/profile-sections/CertificationsSection';
import { RecommendationsSection } from '@/components/profile-sections/RecommendationsSection';
import { LanguagesSection } from '@/components/profile-sections/LanguagesSection';
import { CustomFieldsSection } from '@/components/profile-sections/CustomFieldsSection';
import { FeaturedSection } from '@/components/profile-sections/FeaturedSection';
import { VolunteerSection } from '@/components/profile-sections/VolunteerSection';
import { HonorsAwardsSection } from '@/components/profile-sections/HonorsAwardsSection';
import { PublicationsSection } from '@/components/profile-sections/PublicationsSection';
import { PatentsSection } from '@/components/profile-sections/PatentsSection';
import { CoursesSection } from '@/components/profile-sections/CoursesSection';
import { TestScoresSection } from '@/components/profile-sections/TestScoresSection';
import { OrganizationsSection } from '@/components/profile-sections/OrganizationsSection';
import { InterestsSection } from '@/components/profile-sections/InterestsSection';
import { TeamSection } from '@/components/profile-sections/TeamSection';
import { CompanyCard } from '@/components/profile-sections/CompanyCard';
import { NFCCardPreview } from '@/components/card/NFCCardPreview';
import { ResumeSectionCard } from '@/components/editor/ResumeSectionCard';

interface SummarizedItem {
  id: string;
  index: number;
  title: string;
  subtitle?: string;
  visible: boolean;
}

interface SectionRenderArgs {
  profile: ProfileData;
  theme: ThemeConfig;
  onUpdateField: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partial: Partial<ProfileData>, clearFields?: string[]) => Promise<ProfileData>;
}

interface SectionMetaConfig {
  label: string;
  singular: string;
  icon: React.ElementType;
  fieldKey?: keyof ProfileData;
  aliasFieldKey?: keyof ProfileData;
  isList?: boolean;
  createEmptyItem?: () => any;
  summarizeItem?: (item: any, index: number) => SummarizedItem;
  renderForm?: (args: SectionRenderArgs) => React.ReactNode;
}

function makeItemSummarizer(
  pickTitle: (item: any, idx: number) => string,
  pickSubtitle?: (item: any) => string | undefined
) {
  return (item: any, index: number): SummarizedItem => {
    if (typeof item === 'string') {
      return {
        id: `str-${index}-${item}`,
        index,
        title: item,
        visible: true,
      };
    }
    return {
      id: item?.id || `item-${index}`,
      index,
      title: pickTitle(item, index) || `Item ${index + 1}`,
      subtitle: pickSubtitle ? pickSubtitle(item) : undefined,
      visible: item?.visible !== false,
    };
  };
}

export const SECTION_CONFIG: Record<string, SectionMetaConfig> = {
  personalDetails: {
    label: 'About',
    singular: 'About',
    icon: FileText,
    fieldKey: 'about',
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <AboutSection
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  contactInfo: {
    label: 'Contact',
    singular: 'Contact',
    icon: Phone,
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <ProfileContactSection
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  socialLinks: {
    label: 'Social Links',
    singular: 'Social Link',
    icon: Link2,
    fieldKey: 'socials',
    aliasFieldKey: 'socialLinks',
    isList: true,
    createEmptyItem: () => ({
      platform: 'linkedin',
      url: '',
      label: 'LinkedIn',
      visible: true,
    }),
    summarizeItem: makeItemSummarizer(
      (i) => i.label || i.title || i.platform || 'Social Link',
      (i) => i.url
    ),
    renderForm: ({ profile, onUpdateField, onSavePartial }) => (
      <SocialLinksSection
        profile={profile}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  skills: {
    label: 'Skills',
    singular: 'Skills',
    icon: Code,
    fieldKey: 'skills',
    isList: true,
    createEmptyItem: () => ({
      id: `skill-${Date.now()}`,
      name: 'New Skill',
      category: 'Technical Skills',
      level: 'Intermediate',
      pinned: false,
    }),
    summarizeItem: makeItemSummarizer(
      (i) => (typeof i === 'string' ? i : i.name),
      (i) => (typeof i === 'string' ? undefined : [i.category, i.level].filter(Boolean).join(' • '))
    ),
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <SkillsSection
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  services: {
    label: 'Services',
    singular: 'Services',
    icon: Sparkles,
    fieldKey: 'services',
    isList: true,
    createEmptyItem: () => ({
      id: `srv-${Date.now()}`,
      title: 'New Service',
      description: '',
    }),
    summarizeItem: makeItemSummarizer(
      (i) => i.title,
      (i) => i.badge || i.description
    ),
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <ServicesSection
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  projects: {
    label: 'Projects',
    singular: 'Projects',
    icon: FolderGit2,
    fieldKey: 'projects',
    isList: true,
    createEmptyItem: () => ({
      id: `proj-${Date.now()}`,
      title: 'Untitled Project',
      description: '',
    }),
    summarizeItem: makeItemSummarizer(
      (i) => i.title,
      (i) => i.tagline || i.category || i.year
    ),
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <PortfolioSection
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  experience: {
    label: 'Experience',
    singular: 'Experience',
    icon: Briefcase,
    fieldKey: 'experiences',
    aliasFieldKey: 'experience',
    isList: true,
    createEmptyItem: () => ({
      id: `exp-${Date.now()}`,
      role: 'New Role',
      company: '',
      current: true,
    }),
    summarizeItem: makeItemSummarizer(
      (i) => i.role || i.company || 'Experience',
      (i) => [i.company, i.period || i.startDate].filter(Boolean).join(' • ')
    ),
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <ExperienceSection
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  education: {
    label: 'Education',
    singular: 'Education',
    icon: GraduationCap,
    fieldKey: 'education',
    isList: true,
    createEmptyItem: () => ({
      id: `edu-${Date.now()}`,
      degree: 'Degree or Program',
      institution: '',
    }),
    summarizeItem: makeItemSummarizer(
      (i) => i.degree || i.institution || 'Education',
      (i) => [i.institution || i.school, i.year || i.period].filter(Boolean).join(' • ')
    ),
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <EducationSection
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  certifications: {
    label: 'Certifications',
    singular: 'Certifications',
    icon: Award,
    fieldKey: 'certifications',
    isList: true,
    createEmptyItem: () => ({
      id: `cert-${Date.now()}`,
      name: 'New Certification',
      issuer: '',
      issued: '',
    }),
    summarizeItem: makeItemSummarizer(
      (i) => i.name,
      (i) => [i.issuer, i.issued].filter(Boolean).join(' • ')
    ),
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <CertificationsSection
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  recommendations: {
    label: 'Recommendations',
    singular: 'Recommendations',
    icon: Quote,
    fieldKey: 'recommendations',
    aliasFieldKey: 'testimonials',
    isList: true,
    createEmptyItem: () => ({
      id: `rec-${Date.now()}`,
      author: 'Recommender Name',
      role: '',
      content: '',
      quote: '',
    }),
    summarizeItem: makeItemSummarizer(
      (i) => i.author || i.name || 'Recommendation',
      (i) => i.role || i.company || i.relationship
    ),
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <RecommendationsSection
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  languages: {
    label: 'Languages',
    singular: 'Languages',
    icon: Globe,
    fieldKey: 'languages',
    isList: true,
    createEmptyItem: () => ({
      id: `lang-${Date.now()}`,
      name: 'New Language',
      proficiency: 'Professional',
    }),
    summarizeItem: makeItemSummarizer(
      (i) => i.name,
      (i) => i.proficiency
    ),
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <LanguagesSection
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  customFields: {
    label: 'Custom Fields',
    singular: 'Custom Fields',
    icon: Tag,
    fieldKey: 'customFields',
    isList: true,
    createEmptyItem: () => ({
      id: `cf-${Date.now()}`,
      label: 'New Field',
      value: '',
      type: 'text',
      visible: true,
    }),
    summarizeItem: makeItemSummarizer(
      (i) => i.label || i.title || 'Custom Field',
      (i) => i.value
    ),
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <CustomFieldsSection
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  resume: {
    label: 'CV / Resume',
    singular: 'CV / Resume',
    icon: FileUp,
    fieldKey: 'resumeUrl',
  },
  featured: {
    label: 'Featured',
    singular: 'Featured',
    icon: Star,
    fieldKey: 'featured',
    isList: true,
    createEmptyItem: () => ({
      id: `feat-${Date.now()}`,
      type: 'link',
      title: 'Featured Item',
      url: '',
      visible: true,
    }),
    summarizeItem: makeItemSummarizer((i) => i.title, (i) => i.url),
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <FeaturedSection
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  volunteer: {
    label: 'Volunteer',
    singular: 'Volunteer',
    icon: HeartHandshake,
    fieldKey: 'volunteer',
    aliasFieldKey: 'volunteerExperiences',
    isList: true,
    createEmptyItem: () => ({
      id: `vol-${Date.now()}`,
      role: 'Volunteer Role',
      organization: '',
      visible: true,
    }),
    summarizeItem: makeItemSummarizer((i) => i.role, (i) => i.organization),
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <VolunteerSection
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  honorsAwards: {
    label: 'Honors & Awards',
    singular: 'Honors & Awards',
    icon: Trophy,
    fieldKey: 'honorsAwards',
    aliasFieldKey: 'honors',
    isList: true,
    createEmptyItem: () => ({
      id: `award-${Date.now()}`,
      title: 'New Award',
      issuer: '',
      visible: true,
    }),
    summarizeItem: makeItemSummarizer((i) => i.title, (i) => i.issuer),
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <HonorsAwardsSection
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  publications: {
    label: 'Publications',
    singular: 'Publications',
    icon: BookOpen,
    fieldKey: 'publications',
    isList: true,
    createEmptyItem: () => ({
      id: `pub-${Date.now()}`,
      title: 'New Publication',
      publisher: '',
      visible: true,
    }),
    summarizeItem: makeItemSummarizer((i) => i.title, (i) => i.publisher),
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <PublicationsSection
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  patents: {
    label: 'Patents',
    singular: 'Patents',
    icon: Lightbulb,
    fieldKey: 'patents',
    isList: true,
    createEmptyItem: () => ({
      id: `pat-${Date.now()}`,
      title: 'New Patent',
      number: '',
      visible: true,
    }),
    summarizeItem: makeItemSummarizer((i) => i.title, (i) => i.number || i.patentOffice),
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <PatentsSection
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  courses: {
    label: 'Courses',
    singular: 'Courses',
    icon: BookMarked,
    fieldKey: 'courses',
    isList: true,
    createEmptyItem: () => ({
      id: `course-${Date.now()}`,
      name: 'New Course',
      visible: true,
    }),
    summarizeItem: makeItemSummarizer((i) => i.name, (i) => i.number || i.associatedWith),
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <CoursesSection
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  testScores: {
    label: 'Test Scores',
    singular: 'Test Scores',
    icon: FileSpreadsheet,
    fieldKey: 'testScores',
    isList: true,
    createEmptyItem: () => ({
      id: `score-${Date.now()}`,
      name: 'New Test Score',
      score: '',
      visible: true,
    }),
    summarizeItem: makeItemSummarizer((i) => i.name, (i) => i.score),
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <TestScoresSection
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  organizations: {
    label: 'Organizations',
    singular: 'Organizations',
    icon: Network,
    fieldKey: 'organizations',
    isList: true,
    createEmptyItem: () => ({
      id: `org-${Date.now()}`,
      name: 'New Organization',
      position: '',
      visible: true,
    }),
    summarizeItem: makeItemSummarizer((i) => i.name, (i) => i.position),
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <OrganizationsSection
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  interests: {
    label: 'Interests',
    singular: 'Interests',
    icon: Compass,
    fieldKey: 'interests',
    isList: true,
    createEmptyItem: () => ({
      id: `int-${Date.now()}`,
      type: 'topic',
      name: 'New Interest',
      visible: true,
    }),
    summarizeItem: makeItemSummarizer((i) => i.name, (i) => i.type),
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <InterestsSection
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  companyInfo: {
    label: 'Company',
    singular: 'Company',
    icon: Building2,
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <CompanyCard
        companyInfo={profile.companyInfo}
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  teamMembers: {
    label: 'Team',
    singular: 'Team',
    icon: Users,
    fieldKey: 'teamMembers',
    isList: true,
    createEmptyItem: () => ({
      id: `tm-${Date.now()}`,
      name: 'Team Member',
      role: '',
      profileId: '',
    }),
    summarizeItem: makeItemSummarizer((i) => i.name, (i) => i.role || i.department),
    renderForm: ({ profile, theme, onUpdateField, onSavePartial }) => (
      <TeamSection
        profile={profile}
        theme={theme}
        canEdit={true}
        isEditing={true}
        onUpdateField={onUpdateField}
        onSavePartial={onSavePartial}
      />
    ),
  },
  virtualCard: {
    label: 'Virtual Card',
    singular: 'Virtual Card',
    icon: CreditCard,
    renderForm: ({ profile, theme }) => (
      <div className="p-3">
        <NFCCardPreview profile={profile} theme={theme} isDark={false} />
      </div>
    ),
  },
};

function getListItemsForSection(profile: ProfileData, meta: SectionMetaConfig): any[] {
  if (!meta.fieldKey) return [];
  const primary = (profile as any)[meta.fieldKey];
  if (Array.isArray(primary) && primary.length > 0) return primary;
  if (meta.aliasFieldKey) {
    const alias = (profile as any)[meta.aliasFieldKey];
    if (Array.isArray(alias)) return alias;
  }
  return Array.isArray(primary) ? primary : [];
}

export interface EditableSectionCardProps {
  sectionKey: string;
  profile: ProfileData;
  theme: ThemeConfig;
  index: number;
  total: number;
  isVisible: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisibility: () => void;
  onUpdateField: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partial: Partial<ProfileData>, clearFields?: string[]) => Promise<ProfileData>;
  onDeleteDynamicSection?: (sectionKeyOrId: string) => void;
  onToggleContactFieldVisibility?: (field: 'phone' | 'email' | 'website' | 'location') => void;
  onShowToast?: (message: string) => void;
}

export function EditableSectionCard({
  sectionKey,
  profile,
  theme,
  index,
  total,
  isVisible,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
  onUpdateField,
  onSavePartial,
  onDeleteDynamicSection,
  onToggleContactFieldVisibility,
  onShowToast,
}: EditableSectionCardProps) {
  const canonical = normalizeSectionKey(sectionKey);
  const dynamicSection: DynamicSection | undefined = (profile.dynamicSections || []).find(
    (s) => s.key === sectionKey || s.id === sectionKey || s.key === canonical
  );
  const meta = SECTION_CONFIG[canonical];
  const dragControls = useDragControls();
  const { isPressing, isArmed, dragHandleProps } = useLongPressDrag({
    dragControls,
    delayMs: 180,
    moveThreshold: 6,
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [showInlineEditor, setShowInlineEditor] = useState(false);
  const [confirmRemoveSection, setConfirmRemoveSection] = useState(false);

  if (!meta && !dynamicSection) {
    return null;
  }

  const Icon = meta ? meta.icon : Layers;
  const title = dynamicSection ? dynamicSection.title || 'Custom Section' : meta!.label;
  const singularLabel = dynamicSection ? dynamicSection.title || 'Section' : meta!.singular;

  const listItems = meta?.isList ? getListItemsForSection(profile, meta) : [];
  const summarizedItems: SummarizedItem[] =
    meta?.isList && meta.summarizeItem
      ? listItems.map((item, idx) => meta.summarizeItem!(item, idx))
      : [];

  const handleToggleItemVisibility = (itemIndex: number) => {
    if (!meta?.fieldKey) return;
    const current = [...listItems];
    const target = current[itemIndex];
    if (typeof target === 'string') {
      current[itemIndex] = {
        id: `skill-${itemIndex}`,
        name: target,
        category: 'Technical Skills',
        level: 'Intermediate',
        visible: false,
      };
    } else if (target && typeof target === 'object') {
      current[itemIndex] = {
        ...target,
        visible: target.visible === false ? true : false,
      };
    }
    onUpdateField(meta.fieldKey, current);
  };

  const handleRemoveItem = (itemIndex: number) => {
    if (!meta?.fieldKey) return;
    const next = listItems.filter((_, idx) => idx !== itemIndex);
    onUpdateField(meta.fieldKey, next);
  };

  const handleAddToSection = () => {
    setIsExpanded(true);
    setShowInlineEditor(true);

    if (dynamicSection) {
      const existing = profile.dynamicSections || [];
      const nextDynamic = existing.map((sec) => {
        if (sec.id !== dynamicSection.id && sec.key !== dynamicSection.key) return sec;
        const nextFields = [
          ...(sec.customFields || []),
          { id: `dcf-${Date.now()}`, label: 'Detail', value: '', type: 'text' as const, visible: true },
        ];
        return { ...sec, customFields: nextFields };
      });
      onUpdateField('dynamicSections', nextDynamic);
      return;
    }

    if (meta?.isList && meta.fieldKey && meta.createEmptyItem) {
      const next = [...listItems, meta.createEmptyItem()];
      onUpdateField(meta.fieldKey, next);
    }
  };

  const handleConfirmSectionDelete = () => {
    if (dynamicSection) {
      onDeleteDynamicSection?.(dynamicSection.key || dynamicSection.id);
      setConfirmRemoveSection(false);
      return;
    }

    if (canonical === 'personalDetails') {
      onUpdateField('about', '');
      onUpdateField('fullBio', '');
      onUpdateField('tagline', '');
    } else if (canonical === 'contactInfo') {
      onUpdateField('email', '');
      onUpdateField('phone', '');
      onUpdateField('whatsapp', '');
      onUpdateField('website', '');
      onUpdateField('officeAddress', '');
    } else if (canonical === 'resume') {
      onUpdateField('resumeUrl', '');
      onUpdateField('resumeFileName', '');
    } else if (meta?.fieldKey) {
      onUpdateField(meta.fieldKey, []);
    }

    if (isVisible) {
      onToggleVisibility();
    }
    setConfirmRemoveSection(false);
    setShowInlineEditor(false);
    onShowToast?.(`${title} cleared & hidden`);
  };

  // Contact summary rows when contactInfo is collapsed/overviewed
  const contactChannels: Array<{
    id: string;
    label: string;
    value?: string;
    toggleField?: 'phone' | 'email' | 'website' | 'location';
    visible: boolean;
  }> =
    canonical === 'contactInfo'
      ? [
          {
            id: 'email',
            label: 'Email',
            value: profile.email,
            toggleField: 'email' as const,
            visible: profile.sharingSettings?.email !== false,
          },
          {
            id: 'phone',
            label: 'Phone',
            value: profile.phone,
            toggleField: 'phone' as const,
            visible: profile.sharingSettings?.phone !== false,
          },
          {
            id: 'whatsapp',
            label: 'WhatsApp',
            value: profile.whatsapp,
            toggleField: 'phone' as const,
            visible: profile.sharingSettings?.phone !== false,
          },
          {
            id: 'location',
            label: 'Location',
            value: [profile.location, profile.country].filter(Boolean).join(', '),
            toggleField: 'location' as const,
            visible: profile.sharingSettings?.location !== false,
          },
          {
            id: 'website',
            label: 'Website',
            value: profile.website,
            toggleField: 'website' as const,
            visible: profile.sharingSettings?.website !== false,
          },
        ].filter((c) => Boolean(c.value && c.value.trim()))
      : [];

  const countLabel = dynamicSection
    ? `${(dynamicSection.customFields || []).length} fields`
    : meta?.isList
    ? `${summarizedItems.length}`
    : canonical === 'personalDetails'
    ? getAbout(profile)
      ? 'Ready'
      : 'Empty'
    : canonical === 'contactInfo'
    ? `${contactChannels.length} channels`
    : canonical === 'resume'
    ? profile.resumeUrl
      ? 'PDF'
      : 'Empty'
    : '';

  return (
    <Reorder.Item
      value={sectionKey}
      dragListener={false}
      dragControls={dragControls}
      data-testid={`editable-section-card-${canonical}`}
      className={`rounded-2xl border transition-colors bg-white dark:bg-zinc-950 ${
        isArmed
          ? 'border-black dark:border-white shadow-lg ring-2 ring-black/15 dark:ring-white/15'
          : isVisible
          ? 'border-zinc-200 dark:border-zinc-800 shadow-2xs'
          : 'border-dashed border-zinc-300 dark:border-zinc-800 opacity-75'
      }`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            {...dragHandleProps}
            title="Drag to reorder section"
            aria-label={`Reorder ${title}`}
            className={`p-1.5 rounded-lg cursor-grab active:cursor-grabbing touch-none transition-colors shrink-0 ${
              isArmed || isPressing
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-zinc-900 dark:text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-950 dark:text-white truncate">
                  {title}
                </span>
                {countLabel && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 shrink-0">
                    {countLabel}
                  </span>
                )}
                {!isVisible && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                    Hidden
                  </span>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Header Actions: Move Up / Move Down / Visibility / Delete / Expand */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label={`Move ${title} up`}
            title="Move up"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-25 cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            aria-label={`Move ${title} down`}
            title="Move down"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-25 cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggleVisibility}
            aria-label={isVisible ? `Hide ${title}` : `Show ${title}`}
            title={isVisible ? 'Hide section' : 'Show section'}
            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
              isVisible
                ? 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                : 'text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setConfirmRemoveSection((prev) => !prev)}
            aria-label={`Remove ${title} section`}
            title="Remove section"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            aria-label={isExpanded ? `Collapse ${title}` : `Expand ${title}`}
            aria-expanded={isExpanded}
            title={isExpanded ? 'Collapse section' : 'Expand section'}
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Inline section remove confirmation */}
      {confirmRemoveSection && (
        <div className="mx-3 sm:mx-4 mb-3 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between gap-2 text-xs">
          <span className="text-zinc-700 dark:text-zinc-300 font-medium">
            {dynamicSection ? `Delete "${title}"?` : `Clear & hide ${title}?`}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmRemoveSection(false)}
              className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSectionDelete}
              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Expanded Body */}
      {isExpanded && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 space-y-3">
          {/* Special CV / Resume Card */}
          {canonical === 'resume' && (
            <ResumeSectionCard
              profile={profile}
              onUpdateField={onUpdateField}
              onShowToast={onShowToast}
            />
          )}

          {/* Custom Dynamic Section */}
          {dynamicSection && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <input
                  type="text"
                  value={dynamicSection.title || ''}
                  onChange={(e) => {
                    const next = (profile.dynamicSections || []).map((s) =>
                      s.id === dynamicSection.id ? { ...s, title: e.target.value } : s
                    );
                    onUpdateField('dynamicSections', next);
                  }}
                  placeholder="Section title"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-950 dark:text-white outline-none focus:border-black dark:focus:border-white"
                />
                <textarea
                  rows={2}
                  value={typeof dynamicSection.data === 'string' ? dynamicSection.data : ''}
                  onChange={(e) => {
                    const next = (profile.dynamicSections || []).map((s) =>
                      s.id === dynamicSection.id ? { ...s, data: e.target.value } : s
                    );
                    onUpdateField('dynamicSections', next);
                  }}
                  placeholder="Section description or summary"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-950 dark:text-white outline-none focus:border-black dark:focus:border-white resize-none"
                />
              </div>

              {(dynamicSection.customFields || []).map((field, fIdx) => (
                <div
                  key={field.id || fIdx}
                  className="flex items-center gap-2 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60"
                >
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => {
                      const next = (profile.dynamicSections || []).map((s) => {
                        if (s.id !== dynamicSection.id) return s;
                        const cfs = [...(s.customFields || [])];
                        cfs[fIdx] = { ...cfs[fIdx], label: e.target.value };
                        return { ...s, customFields: cfs };
                      });
                      onUpdateField('dynamicSections', next);
                    }}
                    placeholder="Label"
                    className="w-1/3 px-2 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => {
                      const next = (profile.dynamicSections || []).map((s) => {
                        if (s.id !== dynamicSection.id) return s;
                        const cfs = [...(s.customFields || [])];
                        cfs[fIdx] = { ...cfs[fIdx], value: e.target.value };
                        return { ...s, customFields: cfs };
                      });
                      onUpdateField('dynamicSections', next);
                    }}
                    placeholder="Value"
                    className="flex-1 px-2 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Remove field"
                    onClick={() => {
                      const next = (profile.dynamicSections || []).map((s) => {
                        if (s.id !== dynamicSection.id) return s;
                        return {
                          ...s,
                          customFields: (s.customFields || []).filter((_, i) => i !== fIdx),
                        };
                      });
                      onUpdateField('dynamicSections', next);
                    }}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* List Item Summary Rows (Edit / Show-Hide / Remove) */}
          {meta?.isList && summarizedItems.length > 0 && (
            <div className="space-y-1.5">
              {summarizedItems.map((item) => (
                <div
                  key={`${item.id}-${item.index}`}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-semibold truncate ${
                          item.visible
                            ? 'text-zinc-900 dark:text-white'
                            : 'text-zinc-400 dark:text-zinc-500 line-through'
                        }`}
                      >
                        {item.title}
                      </span>
                      {!item.visible && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                          Hidden
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        {item.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowInlineEditor(true)}
                      aria-label={`Edit ${item.title}`}
                      title="Edit"
                      className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleItemVisibility(item.index)}
                      aria-label={item.visible ? `Hide ${item.title}` : `Show ${item.title}`}
                      title={item.visible ? 'Hide item' : 'Show item'}
                      className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                    >
                      {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.index)}
                      aria-label={`Remove ${item.title}`}
                      title="Remove item"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Contact Summary Rows */}
          {canonical === 'contactInfo' && contactChannels.length > 0 && !showInlineEditor && (
            <div className="space-y-1.5">
              {contactChannels.map((ch) => (
                <div
                  key={ch.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
                      {ch.label}
                    </span>
                    <span className="text-xs font-medium text-zinc-900 dark:text-white truncate block">
                      {ch.value}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowInlineEditor(true)}
                      aria-label={`Edit ${ch.label}`}
                      className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {ch.toggleField && onToggleContactFieldVisibility && (
                      <button
                        type="button"
                        onClick={() => onToggleContactFieldVisibility(ch.toggleField!)}
                        aria-label={ch.visible ? `Hide ${ch.label}` : `Show ${ch.label}`}
                        className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        {ch.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* About Summary Row */}
          {canonical === 'personalDetails' && !showInlineEditor && (
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2">
                  {getAbout(profile) || 'No bio added yet.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInlineEditor(true)}
                aria-label="Edit About"
                className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-semibold text-zinc-900 dark:text-white cursor-pointer shrink-0 flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </button>
            </div>
          )}

          {/* Reused Existing Section Editor Form (no duplicated forms) */}
          {meta?.renderForm && (showInlineEditor || (!meta.isList && canonical !== 'personalDetails' && canonical !== 'contactInfo')) && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
              <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Edit {title}
                </span>
                {(meta.isList || canonical === 'personalDetails' || canonical === 'contactInfo') && (
                  <button
                    type="button"
                    onClick={() => setShowInlineEditor(false)}
                    className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
                  >
                    Collapse form
                  </button>
                )}
              </div>
              {meta.renderForm({ profile, theme, onUpdateField, onSavePartial })}
            </div>
          )}

          {/* Consistent Bottom Card Action: + Add to <Section Name> */}
          {canonical !== 'resume' && canonical !== 'virtualCard' && (
            <button
              type="button"
              onClick={handleAddToSection}
              data-testid={`add-to-${canonical}`}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to {singularLabel}</span>
            </button>
          )}
        </div>
      )}
    </Reorder.Item>
  );
}

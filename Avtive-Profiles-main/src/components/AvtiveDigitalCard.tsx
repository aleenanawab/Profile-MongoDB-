'use client';

import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MessageSquare, 
  UserPlus, 
  CreditCard, 
  Building2, 
  Save, 
  X, 
  Loader2, 
  Check, 
  AlertCircle,
  Tag,
  LayoutGrid
} from 'lucide-react';
import { 
  ProfileData, 
  ProjectItem, 
  ServiceItem, 
  TeamMemberItem, 
  NavigationOrigin, 
  ProfileTheme,
  normalizeProfileType
} from '../types/profile';
import { HeroSection } from './HeroSection';
import { AboutSection } from './AboutSection';
import { SkillsServicesSection } from './SkillsServicesSection';
import { ExperienceSection } from './ExperienceSection';
import { PortfolioSection } from './PortfolioSection';
import { CertificationsSection } from './CertificationsSection';
import { LanguagesSection } from './LanguagesSection';
import { RecommendationsSection } from './RecommendationsSection';
import { ProfileContactSection } from './ProfileContactSection';
import { CompanyCard } from './CompanyCard';
import { TeamSection } from './TeamSection';
import { NFCCardPreview } from './NFCCardPreview';
import { EducationSection } from './EducationSection';
import { SocialLinksSection } from './SocialLinksSection';
import { CustomFieldsSection } from './CustomFieldsSection';
import { getThemeConfig, PROFILE_THEMES, ThemeConfig } from './themeStyles';

export { getThemeConfig };

export function getProfileThemeClasses(theme: ProfileTheme = 'elegant') {
  const config = getThemeConfig(theme);
  return {
    container: config.container,
    badge: `${config.badgeBg} ${config.badgeText}`,
    accent: config.accentText
  };
}

interface AvtiveDigitalCardProps {
  profile: ProfileData;
  navigationOrigin?: NavigationOrigin;
  canEdit?: boolean;
  isEditing?: boolean;
  isConnected?: boolean;
  onOpenEdit?: () => void;
  onSaveEdits?: (updatedProfile: ProfileData) => Promise<void>;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onCancelEdit?: () => void;
  onThemePreview?: (theme: ProfileTheme) => void;
  onSaveContact: () => void;
  onOpenShare: () => void;
  onOpenConnect: () => void;
  onOpenQRModal: () => void;
  onOpenResumeModal: () => void;
  onSelectProject: (project: ProjectItem) => void;
  onSelectTeamMember?: (member: TeamMemberItem) => void;
  onViewCompany?: (companyId?: string) => void;
  onNavigateBack?: () => void;
  onInquireService?: (service: ServiceItem) => void;
  onSendMessage?: (data: { name: string; email: string; message: string }) => void;
  onOpenMyCard?: () => void;
  isDark: boolean;
  viewMode?: 'standard' | 'web';
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
  onDraftChange?: (draft: ProfileData) => void;
  onToggleSections?: () => void;
  onSectionsMouseEnter?: () => void;
  onSectionsMouseLeave?: () => void;
  isSidebarOpen?: boolean;
  onToggleSectionsDrawer?: () => void;
  isSectionsDrawerOpen?: boolean;
  onToggleMobileSections?: () => void;
  isMobileSectionsOpen?: boolean;
  onToggleDesktopSections?: () => void;
  isDesktopSectionsOpen?: boolean;
}

export function AvtiveDigitalCard({
  profile,
  navigationOrigin = 'direct',
  canEdit = false,
  isEditing = false,
  isConnected = false,
  onDraftChange,
  onSelectSection,
  onToggleSections,
  onSectionsMouseEnter,
  onSectionsMouseLeave,
  isSidebarOpen = false,
  onOpenEdit,
  onSaveEdits,
  onSavePartial,
  onCancelEdit,
  onThemePreview,
  onSaveContact,
  onOpenShare,
  onOpenConnect,
  onOpenQRModal,
  onOpenResumeModal,
  onSelectProject,
  onSelectTeamMember,
  onViewCompany,
  onNavigateBack,
  onInquireService,
  onSendMessage,
  onOpenMyCard,
  isDark,
  viewMode = 'standard',
  onToggleSectionsDrawer,
  isSectionsDrawerOpen = false,
  onToggleMobileSections,
  isMobileSectionsOpen = false,
  onToggleDesktopSections,
  isDesktopSectionsOpen = false
}: AvtiveDigitalCardProps) {
  const [draftProfile, setDraftProfile] = useState<ProfileData>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync draft with external profile when not actively editing
  useEffect(() => {
    if (!isEditing) {
      setDraftProfile(profile);
      setErrorMessage(null);
    }
  }, [profile, isEditing]);

  const activeProfile = isEditing ? draftProfile : profile;
  const activeThemeKey = activeProfile.theme || 'elegant';
  const theme = getThemeConfig(activeThemeKey);

  const isCompany = normalizeProfileType(activeProfile.type) === 'team';
  const companyName = activeProfile.company || activeProfile.companyInfo?.name || 'Avtive';

  const handleFieldUpdate = (field: keyof ProfileData, value: any) => {
    setDraftProfile((prev) => {
      const next = {
        ...prev,
        [field]: value
      };
      if (onDraftChange) {
        onDraftChange(next);
      }
      return next;
    });
    if (errorMessage) setErrorMessage(null);
  };

  const handleSavePartial = async (partialData: Partial<ProfileData>): Promise<ProfileData> => {
    setDraftProfile((prev) => {
      const next = { ...prev, ...partialData };
      if (onDraftChange) onDraftChange(next);
      return next;
    });
    if (onSavePartial) {
      return await onSavePartial(partialData);
    }
    const next = { ...draftProfile, ...partialData };
    if (onSaveEdits) {
      await onSaveEdits(next);
    }
    return next;
  };

  const handleThemeChange = (selectedTheme: ProfileTheme) => {
    handleFieldUpdate('theme', selectedTheme);
    if (onThemePreview) {
      onThemePreview(selectedTheme);
    }
  };

  const handleSave = async () => {
    if (!draftProfile.name || !draftProfile.name.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      if (onSaveEdits) {
        await onSaveEdits(draftProfile);
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setErrorMessage(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraftProfile(profile);
    setErrorMessage(null);
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  return (
    <div className="relative w-full text-left">
      {/* Main Profile Container Card with dynamic theme styling */}
      <div 
        data-theme={activeThemeKey}
        className="w-full overflow-hidden transition-colors duration-200"
      >
        
        {/* Error banner if save fails */}
        {isEditing && errorMessage && (
          <div className="px-4 sm:px-6 pt-3 pb-1">
            <div className="p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 1. HERO SECTION (Includes Direct Contact section immediately below CTA)   */}
        {/* ========================================================================= */}
        <div id="section-profile" className="scroll-mt-16">
          <div id="section-hero">
            <HeroSection
              profile={activeProfile}
              navigationOrigin={navigationOrigin}
              canEdit={canEdit}
              isEditing={isEditing}
              isConnected={isConnected}
              onUpdateField={handleFieldUpdate}
              onSavePartial={handleSavePartial}
              onOpenEdit={onOpenEdit}
              onOpenShare={onOpenShare}
              onOpenConnect={onOpenConnect}
              onOpenVirtualCard={() => {
                const el = document.getElementById('virtual-card-section') || document.getElementById('section-virtual-card');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              onNavigateToCompany={onViewCompany}
              onNavigateBack={onNavigateBack}
              theme={theme}
              onSelectSection={onSelectSection}
              onToggleSections={onToggleSections}
              onSectionsMouseEnter={onSectionsMouseEnter}
              onSectionsMouseLeave={onSectionsMouseLeave}
              isSidebarOpen={isSidebarOpen || isSectionsDrawerOpen}
              onToggleSectionsDrawer={onToggleSectionsDrawer || onToggleSections}
              isSectionsDrawerOpen={isSectionsDrawerOpen || isSidebarOpen}
              onToggleMobileSections={onToggleMobileSections}
              isMobileSectionsOpen={isMobileSectionsOpen}
              onToggleDesktopSections={onToggleDesktopSections}
              isDesktopSectionsOpen={isDesktopSectionsOpen}
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DYNAMIC PROFILE SECTIONS RENDERED ACCORDING TO sectionOrder & sectionVisibility */}
        {/* ========================================================================= */}
        {(() => {
          const defaultCardSectionOrder = [
            ...(isCompany ? ['teamMembers'] : ['company']),
            'about',
            'contact',
            'custom-fields',
            'skills',
            'services',
            'projects',
            'experience',
            'education',
            'certifications',
            'languages',
            'recommendations',
            'socialLinks',
            'virtual-card'
          ];

          // Dynamic sections registered by the user
          const dynamicSectionKeys = (activeProfile.dynamicSections || []).map(s => s.key || s.id);

          const allKnownSections = [...defaultCardSectionOrder, ...dynamicSectionKeys];

          const userOrder = (activeProfile.sectionOrder || []).filter((s) => s !== 'hero' && s !== 'volunteer');
          const effectiveOrder: string[] = [];
          
          for (const s of userOrder) {
            const normalized = (s === 'services' || s === 'skills') 
              ? 'skills' 
              : (s === 'socials' 
              ? 'socialLinks' 
              : ((s === 'company' || s === 'team' || s === 'companyInfo') && isCompany ? 'teamMembers' : s));
            if (!effectiveOrder.includes(normalized) && defaultCardSectionOrder.includes(normalized)) {
              effectiveOrder.push(normalized);
            }
          }
          
          for (const s of allKnownSections) {
            const normalized = (s === 'services' || s === 'skills') 
              ? 'skills' 
              : (s === 'socials' 
              ? 'socialLinks' 
              : ((s === 'company' || s === 'team' || s === 'companyInfo') && isCompany ? 'teamMembers' : s));
            if (!effectiveOrder.includes(normalized) && defaultCardSectionOrder.includes(normalized)) {
              effectiveOrder.push(normalized);
            }
          }

          const sharing = activeProfile.sharingSettings || {};
          const visibility = activeProfile.sectionVisibility || {};

          const isSectionVisible = (key: string): boolean => {
            if (key === 'volunteer') return false;
            if (isEditing) return true;
            // 1. Direct sectionVisibility dictionary check if explicitly defined
            if (typeof visibility[key] === 'boolean') {
              return visibility[key];
            }
            // Check individual custom fields
            if (key.startsWith('custom-field-')) {
              const fieldId = key.replace('custom-field-', '');
              const cf = (activeProfile.customFields || []).find(f => f.id === fieldId || `custom-field-${f.id}` === key);
              return cf ? cf.visible !== false : true;
            }
            // 2. Fallback to sharingSettings for legacy profiles
            switch (key) {
              case 'company':
              case 'teamMembers':
              case 'team': return sharing.companySection !== false;
              case 'about': return sharing.bio !== false;
              case 'contact': return true;
              case 'custom-fields': return true;
              case 'services':
              case 'skills': return sharing.services !== false || sharing.skills !== false;
              case 'experience': return sharing.experience !== false;
              case 'education': return sharing.education !== false;
              case 'projects': return sharing.projects !== false;
              case 'certifications': return sharing.certifications !== false;
              case 'languages': return sharing.languages !== false;
              case 'recommendations': return sharing.recommendations !== false;
              case 'socialLinks':
              case 'socials': return sharing.socialLinks !== false;
              case 'virtual-card': return sharing.nfcCard !== false;
              default: return true;
            }
          };

          const renderSectionContent = (sectionKey: string) => {
            switch (sectionKey) {
              case 'company':
                if (isCompany) return null;
                if (!isSectionVisible('company')) return null;
                return (
                  <CompanyCard
                    key="company"
                    companyInfo={activeProfile.companyInfo}
                    profile={activeProfile}
                    onViewCompany={onViewCompany ? () => onViewCompany(activeProfile.companyId || 'avtive-company') : undefined}
                    theme={theme}
                    canEdit={canEdit}
                    isEditing={isEditing}
                    onUpdateField={handleFieldUpdate}
                    onSavePartial={handleSavePartial}
                    onSelectSection={onSelectSection}
                  />
                );

              case 'teamMembers':
              case 'team':
                if (!isCompany) return null;
                if (!isSectionVisible('teamMembers') && !isSectionVisible('team') && !isSectionVisible('company')) return null;
                return (
                  <TeamSection
                    key="team"
                    profile={activeProfile}
                    onSelectTeamMember={onSelectTeamMember}
                    theme={theme}
                    canEdit={canEdit}
                    isEditing={isEditing}
                    onUpdateField={handleFieldUpdate}
                    onSavePartial={handleSavePartial}
                    onSelectSection={onSelectSection}
                  />
                );

              case 'about':
                if (!isSectionVisible('about')) return null;
                return (
                  <AboutSection 
                    key="about"
                    profile={activeProfile} 
                    isEditing={isEditing}
                    canEdit={canEdit}
                    onSelectSection={onSelectSection}
                    onUpdateField={handleFieldUpdate}
                    onSavePartial={handleSavePartial}
                    theme={theme}
                  />
                );

              case 'contact':
                if (!isSectionVisible('contact')) return null;
                return (
                  <ProfileContactSection
                    key="contact"
                    profile={activeProfile}
                    isEditing={isEditing}
                    canEdit={canEdit}
                    onSelectSection={onSelectSection}
                    onUpdateField={handleFieldUpdate}
                    onSavePartial={handleSavePartial}
                    theme={theme}
                  />
                );

              case 'custom-fields':
                if (!isSectionVisible('custom-fields')) return null;
                return (
                  <CustomFieldsSection
                    key="custom-fields"
                    profile={activeProfile}
                    isEditing={isEditing}
                    canEdit={canEdit}
                    onSelectSection={onSelectSection}
                    onUpdateField={handleFieldUpdate}
                    onSavePartial={handleSavePartial}
                    theme={theme}
                  />
                );

              case 'services':
              case 'skills':
                if (!isSectionVisible('services') && !isSectionVisible('skills')) return null;
                return (
                  <SkillsServicesSection
                    key="skills"
                    profile={activeProfile}
                    isEditing={isEditing}
                    canEdit={canEdit}
                    onSelectSection={onSelectSection}
                    onUpdateField={handleFieldUpdate}
                    onSavePartial={handleSavePartial}
                    onInquireService={onInquireService}
                    theme={theme}
                  />
                );

              case 'experience':
                if (isCompany || !isSectionVisible('experience')) return null;
                return (
                  <ExperienceSection 
                    key="experience" 
                    profile={activeProfile} 
                    theme={theme}
                    canEdit={canEdit}
                    isEditing={isEditing}
                    onUpdateField={handleFieldUpdate}
                    onSavePartial={handleSavePartial}
                    onSelectSection={onSelectSection}
                  />
                );

              case 'education':
                if (isCompany || !isSectionVisible('education')) return null;
                return (
                  <EducationSection 
                    key="education" 
                    profile={activeProfile} 
                    theme={theme}
                    canEdit={canEdit}
                    isEditing={isEditing}
                    onUpdateField={handleFieldUpdate}
                    onSavePartial={handleSavePartial}
                    onSelectSection={onSelectSection}
                  />
                );

              case 'projects':
                if (!isSectionVisible('projects')) return null;
                return (
                  <PortfolioSection
                    key="projects"
                    profile={activeProfile}
                    onSelectProject={onSelectProject}
                    theme={theme}
                    canEdit={canEdit}
                    isEditing={isEditing}
                    onUpdateField={handleFieldUpdate}
                    onSavePartial={handleSavePartial}
                    onSelectSection={onSelectSection}
                  />
                );

              case 'certifications':
                if (isCompany || !isSectionVisible('certifications')) return null;
                return (
                  <CertificationsSection 
                    key="certifications" 
                    profile={activeProfile} 
                    theme={theme}
                    canEdit={canEdit}
                    isEditing={isEditing}
                    onUpdateField={handleFieldUpdate}
                    onSavePartial={handleSavePartial}
                    onSelectSection={onSelectSection}
                  />
                );

              case 'languages':
                if (isCompany || !isSectionVisible('languages')) return null;
                return (
                  <LanguagesSection 
                    key="languages" 
                    profile={activeProfile} 
                    theme={theme}
                    canEdit={canEdit}
                    isEditing={isEditing}
                    onUpdateField={handleFieldUpdate}
                    onSavePartial={handleSavePartial}
                    onSelectSection={onSelectSection}
                  />
                );

              case 'recommendations':
                if (isCompany || !isSectionVisible('recommendations')) return null;
                return (
                  <RecommendationsSection 
                    key="recommendations" 
                    profile={activeProfile} 
                    theme={theme}
                    canEdit={canEdit}
                    isEditing={isEditing}
                    onUpdateField={handleFieldUpdate}
                    onSavePartial={handleSavePartial}
                    onSelectSection={onSelectSection}
                  />
                );

              case 'socialLinks':
              case 'socials':
                if (!isSectionVisible('socialLinks') && !isSectionVisible('socials')) return null;
                return (
                  <SocialLinksSection 
                    key="socials" 
                    profile={activeProfile} 
                    canEdit={canEdit}
                    isEditing={isEditing}
                    onUpdateField={handleFieldUpdate}
                    onSavePartial={handleSavePartial}
                    onSelectSection={onSelectSection}
                  />
                );

              case 'virtual-card':
                if (!isSectionVisible('virtual-card')) return null;
                return (
                  <div key="virtual-card" id="virtual-card-section" className={`px-4 sm:px-6 md:px-8 py-5 ${theme.cardBg} border-t ${theme.divider} transition-colors`}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className={`text-sm font-bold tracking-tight ${theme.textPrimary}`}>
                        Virtual Card Preview
                      </h2>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText} font-bold font-mono`}>
                        Digital Identity
                      </span>
                    </div>

                    <NFCCardPreview
                      profile={activeProfile}
                      onViewCompany={onViewCompany}
                      onDownloadCard={onSaveContact}
                      onOpenShare={onOpenShare}
                      isDark={isDark}
                      theme={theme}
                    />
                  </div>
                );

              default: {
                if (sectionKey.startsWith('custom-field-')) {
                  const fieldId = sectionKey.replace('custom-field-', '');
                  const customField = (activeProfile.customFields || []).find((f) => f.id === fieldId || `custom-field-${f.id}` === sectionKey);
                  if (customField) {
                    if (!isSectionVisible(sectionKey) || customField.visible === false) return null;
                    const val = customField.value || (customField as any).content || '';
                    const title = customField.label || (customField as any).title || 'Custom Field';
                    const isLink = customField.type === 'link' || val.startsWith('http://') || val.startsWith('https://');
                    const isEmail = customField.type === 'email' || (val.includes('@') && !val.includes(' '));
                    const isPhone = customField.type === 'phone';

                    return (
                      <div 
                        key={sectionKey} 
                        onClick={() => canEdit && onSelectSection?.('customFields', customField.id)}
                        className={`relative group/cf px-4 sm:px-6 md:px-8 py-5 ${theme.cardBg} border-t ${theme.divider} transition-colors space-y-2.5 ${
                          canEdit && onSelectSection ? 'cursor-pointer hover:bg-accent/5' : ''
                        }`}
                      >
                        {canEdit && onSelectSection && (
                          <div className="absolute top-4 right-6 opacity-0 group-hover/cf:opacity-100 transition-opacity">
                            <span className="bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5" />
                              Edit Field
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <h2 className={`text-sm font-bold tracking-tight ${theme.textPrimary} flex items-center gap-1.5`}>
                            <Tag className="w-3.5 h-3.5 text-purple-500" />
                            <span>{title}</span>
                          </h2>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText} font-mono font-semibold`}>
                            Custom Field
                          </span>
                        </div>
                        <div className={`text-xs sm:text-sm ${theme.textSecondary} whitespace-pre-line leading-relaxed`}>
                          {isLink ? (
                            <a
                              href={val.startsWith('http://') || val.startsWith('https://') ? val : `https://${val}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                if (canEdit && onSelectSection) {
                                  e.preventDefault();
                                  onSelectSection('customFields', customField.id);
                                }
                              }}
                              className={`inline-flex items-center gap-1 font-semibold hover:underline break-all ${theme.accentText}`}
                            >
                              <span>{val}</span>
                            </a>
                          ) : isEmail ? (
                            <a
                              href={`mailto:${val.replace(/^mailto:/, '')}`}
                              onClick={(e) => {
                                if (canEdit && onSelectSection) {
                                  e.preventDefault();
                                  onSelectSection('customFields', customField.id);
                                }
                              }}
                              className={`inline-flex items-center gap-1 font-semibold hover:underline break-all ${theme.accentText}`}
                            >
                              <span>{val}</span>
                            </a>
                          ) : isPhone ? (
                            <a
                              href={`tel:${val.replace(/[^0-9+]/g, '')}`}
                              onClick={(e) => {
                                if (canEdit && onSelectSection) {
                                  e.preventDefault();
                                  onSelectSection('customFields', customField.id);
                                }
                              }}
                              className={`inline-flex items-center gap-1 font-semibold hover:underline ${theme.accentText}`}
                            >
                              <span>{val}</span>
                            </a>
                          ) : (
                            val
                          )}
                        </div>
                      </div>
                    );
                  }
                }

                const dynamicSection = (activeProfile.dynamicSections || []).find((s) => s.key === sectionKey || s.id === sectionKey);
                if (dynamicSection) {
                  if (!isSectionVisible(sectionKey) || dynamicSection.visible === false) return null;
                  return (
                    <div key={dynamicSection.id || dynamicSection.key} className={`px-4 sm:px-6 md:px-8 py-5 ${theme.cardBg} border-t ${theme.divider} transition-colors`}>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-sm font-bold tracking-tight ${theme.textPrimary}`}>
                          {dynamicSection.title}
                        </h2>
                      </div>
                      {dynamicSection.data && (
                        <p className={`text-sm ${theme.textSecondary} mb-3`}>{dynamicSection.data}</p>
                      )}
                      {dynamicSection.customFields && dynamicSection.customFields.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {dynamicSection.customFields.map((field) => (
                            <div key={field.id} className={`p-3 rounded-lg border ${theme.divider} ${theme.subCardBg}`}>
                              <div className={`text-xs font-medium ${theme.textSecondary}`}>{field.label}</div>
                              <div className={`text-sm font-semibold ${theme.textPrimary}`}>{field.value}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }
            }
          };

          const renderSection = (sectionKey: string) => {
            const content = renderSectionContent(sectionKey);
            if (!content) return null;

            const extraAliases: Record<string, string> = {
              about: 'personalDetails',
              personalDetails: 'about',
              contact: 'contactInfo',
              contactInfo: 'contact',
              skills: 'services',
              services: 'skills',
              projects: 'portfolio',
              portfolio: 'projects',
              socialLinks: 'socials',
              socials: 'socialLinks',
              certifications: 'certificates',
              certificates: 'certifications',
              'custom-fields': 'customFields',
              customFields: 'custom-fields'
            };
            const alias = extraAliases[sectionKey];

            return (
              <div
                key={sectionKey}
                id={`section-${sectionKey}`}
                data-section={sectionKey}
                className="scroll-mt-16 relative"
              >
                {alias && <div id={`section-${alias}`} className="absolute -top-16" />}
                {content}
              </div>
            );
          };

          if (viewMode === 'web') {
            const leftKeys = ['company', 'about', 'contact', 'custom-fields', 'virtual-card'];
            const leftSections = effectiveOrder.filter((k) => leftKeys.includes(k));
            const rightSections = effectiveOrder.filter((k) => !leftKeys.includes(k));

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 border-t border-slate-200/80 dark:border-zinc-800/80 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80 dark:divide-zinc-800/80">
                <div className="lg:col-span-5 flex flex-col">
                  {leftSections.map(renderSection)}
                </div>
                <div className="lg:col-span-7 flex flex-col">
                  {rightSections.map(renderSection)}
                </div>
              </div>
            );
          }

          return effectiveOrder.map(renderSection);
        })()}

        {/* ========================================================================= */}
        {/* 13. FOOTER: ONLY "Powered by Avtive"                                     */}
        {/* ========================================================================= */}
        <div className={`py-5 px-6 text-center ${theme.cardBg} border-t ${theme.divider} transition-colors`}>
          <div className={`flex items-center justify-center gap-1 text-xs ${theme.textSecondary}`}>
            <span>Powered by</span>
            <a
              href="https://www.avtive.app"
              target="_blank"
              rel="noopener noreferrer"
              className={`font-bold ${theme.accentText} hover:underline transition-colors`}
            >
              Avtive
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { ArrowRight, Building2, Pencil } from 'lucide-react';
import { CompanyInfo, ProfileData } from '@/types/profile';
import { ThemeConfig, getThemeConfig } from '@/components/ui/themeStyles';
import { FormLabel, FormInput, SectionSaveBar } from '@/components/ui/formControls';

interface CompanyCardProps {
  companyInfo?: CompanyInfo | null;
  profile?: ProfileData;
  onViewCompany?: () => void;
  theme?: ThemeConfig;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionId: string) => void;
}

export function CompanyCard({ 
  companyInfo, 
  profile,
  onViewCompany, 
  theme = getThemeConfig('editorial'),
  canEdit,
  isEditing = false,
  onUpdateField,
  onSavePartial,
  onSelectSection
}: CompanyCardProps) {
  const getInitialInfo = (): CompanyInfo => companyInfo || {
    id: profile?.id ? `comp-${profile.id}` : 'comp-info',
    name: profile?.company || '',
    tagline: '',
    logo: profile?.companyLogo || '/images/avtive-symbol.png',
    industry: '',
    location: profile?.location || '',
    website: profile?.website || '',
    employeeCount: '',
    profileId: ''
  };

  const [companyDraft, setCompanyDraft] = React.useState<CompanyInfo>(getInitialInfo());
  const [snapshot, setSnapshot] = React.useState<CompanyInfo>(getInitialInfo());
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  React.useEffect(() => {
    const next = getInitialInfo();
    setCompanyDraft(next);
    setSnapshot(next);
  }, [profile?.id, companyInfo, profile?.company]);

  const isDirty = JSON.stringify(companyDraft) !== JSON.stringify(snapshot);

  const handleSave = async () => {
    setSaveStatus('saving');
    setErrorMessage(undefined);
    try {
      const payload: Partial<ProfileData> = {
        companyInfo: companyDraft,
        company: companyDraft.name,
      };
      if (onSavePartial) {
        await onSavePartial(payload);
      }
      onUpdateField?.('companyInfo', companyDraft);
      onUpdateField?.('company', companyDraft.name);
      setSnapshot(companyDraft);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed to save company information');
    }
  };

  const handleCancel = () => {
    setCompanyDraft(snapshot);
    setSaveStatus('idle');
    setErrorMessage(undefined);
  };

  if (!isEditing && (!companyInfo || !companyInfo.name)) {
    if (!canEdit) return null;

    return (
      <section 
        onClick={() => canEdit && onSelectSection?.('company')}
        className={`px-4 sm:px-6 md:px-8 py-3.5 ${theme.cardBg} border-b ${theme.divider} transition-colors ${
          canEdit && onSelectSection ? 'cursor-pointer hover:bg-accent/5' : ''
        }`}
      >
        <div className={`p-3.5 sm:p-4 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} text-left`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl ${theme.badgeBg} flex items-center justify-center shrink-0 border ${theme.cardBorder} shadow-xs`}>
              <Building2 className={`w-6 h-6 ${theme.textMuted}`} />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${theme.textPrimary}`}>
                Company Profile
              </h3>
              <p className={`text-[11px] ${theme.textSecondary} mt-0.5 font-medium italic`}>
                No company profile linked yet. Click to configure.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      onClick={() => canEdit && !isEditing && onSelectSection?.('company')}
      className={`px-4 sm:px-6 md:px-8 py-3.5 ${theme.cardBg} border-b ${theme.divider} transition-colors ${
        canEdit && !isEditing && onSelectSection ? 'cursor-pointer hover:bg-accent/5' : ''
      }`}
    >
      {isEditing ? (
        /* Editable Company Details Card */
        <div className={`p-4 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} space-y-3.5 text-left`} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between pb-1 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2">
              <Building2 className={`w-4 h-4 ${theme.accentText}`} />
              <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${theme.textPrimary}`}>
                Company & Organization Details
              </h3>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText} font-semibold`}>
              Company Profile
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <FormLabel required>Company Name</FormLabel>
              <FormInput
                value={companyDraft.name || ''}
                onChange={(val) => setCompanyDraft((prev) => ({ ...prev, name: val }))}
                placeholder="e.g. Avtive Technologies Inc."
              />
            </div>
            <div>
              <FormLabel>Tagline / Motto</FormLabel>
              <FormInput
                value={companyDraft.tagline || ''}
                onChange={(val) => setCompanyDraft((prev) => ({ ...prev, tagline: val }))}
                placeholder="e.g. Next-Generation Identity Cloud"
              />
            </div>
            <div>
              <FormLabel>Industry</FormLabel>
              <FormInput
                value={companyDraft.industry || ''}
                onChange={(val) => setCompanyDraft((prev) => ({ ...prev, industry: val }))}
                placeholder="e.g. Software · Enterprise SaaS"
              />
            </div>
            <div>
              <FormLabel>Website URL</FormLabel>
              <FormInput
                type="url"
                value={companyDraft.website || ''}
                onChange={(val) => setCompanyDraft((prev) => ({ ...prev, website: val }))}
                placeholder="e.g. https://company.com"
              />
            </div>
            <div className="sm:col-span-2">
              <FormLabel>Headquarters / Location</FormLabel>
              <FormInput
                value={companyDraft.location || ''}
                onChange={(val) => setCompanyDraft((prev) => ({ ...prev, location: val }))}
                placeholder="e.g. San Francisco, California / Global Remote"
              />
            </div>
          </div>

          <SectionSaveBar
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={saveStatus === 'saving'}
            isSaved={saveStatus === 'saved'}
            isDirty={isDirty}
            errorMessage={errorMessage}
            saveLabel="Save Company Details"
            cancelLabel="Cancel"
            className="pt-1"
          />
        </div>
      ) : (
        /* View Company Details Card */
        <div
          onClick={(e) => {
            if (onViewCompany) {
              onViewCompany();
            }
          }}
          className={`cursor-pointer group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} ${theme.hoverBorder} transition-all shadow-xs hover:shadow-sm text-left`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className={`w-12 h-12 rounded-xl ${theme.cardBg} p-2 flex items-center justify-center shrink-0 border ${theme.cardBorder} shadow-2xs`}>
              <img
                src={companyInfo?.logo || '/images/avtive-symbol.png'}
                alt={companyInfo?.name || 'Company'}
                onError={(e) => { e.currentTarget.src = '/images/avtive-symbol.png'; }}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-bold ${theme.accentText} group-hover:underline transition-colors truncate`}>
                  {companyInfo?.name}
                </h3>
                {companyInfo?.industry && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} font-mono`}>
                    {companyInfo.industry}
                  </span>
                )}
              </div>
              <p className={`text-[11px] ${theme.textSecondary} truncate mt-0.5 font-medium`}>
                {companyInfo?.tagline || 'Company Profile'}
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-1 text-xs font-bold ${theme.textPrimary} shrink-0 ml-3`}>
            <span className="hidden sm:inline">View Company Profile</span>
            <ArrowRight className={`w-3.5 h-3.5 group-hover:translate-x-1 transition-transform ${theme.accentText}`} />
          </div>
        </div>
      )}
    </section>
  );
}

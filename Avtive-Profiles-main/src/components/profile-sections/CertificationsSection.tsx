'use client';

import React from 'react';
import { Award, Plus, X, ExternalLink } from 'lucide-react';
import { ProfileData, CertificationItem } from '@/types/profile';
import { ThemeConfig, getThemeConfig } from '@/components/ui/themeStyles';
import { FormLabel, FormInput, SectionSaveBar } from '@/components/ui/formControls';

interface CertificationsSectionProps {
  profile: ProfileData;
  theme?: ThemeConfig;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
}

export function CertificationsSection({ 
  profile, 
  theme = getThemeConfig(profile.theme || 'elegant'),
  canEdit = false,
  isEditing = false,
  onUpdateField,
  onSavePartial,
  onSelectSection
}: CertificationsSectionProps) {
  const [certsDraft, setCertsDraft] = React.useState<CertificationItem[]>(profile.certifications || []);
  const [snapshot, setSnapshot] = React.useState<CertificationItem[]>(profile.certifications || []);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  React.useEffect(() => {
    const next = profile.certifications || [];
    setCertsDraft(next);
    setSnapshot(next);
  }, [profile.id, profile.certifications]);

  const isDirty = JSON.stringify(certsDraft) !== JSON.stringify(snapshot);

  const handleSave = async () => {
    setSaveStatus('saving');
    setErrorMessage(undefined);
    try {
      const payload: Partial<ProfileData> = {
        certifications: certsDraft,
      };
      if (onSavePartial) {
        await onSavePartial(payload);
      }
      onUpdateField?.('certifications', certsDraft);
      setSnapshot(certsDraft);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed to save certifications');
    }
  };

  const handleCancel = () => {
    setCertsDraft(snapshot);
    setSaveStatus('idle');
    setErrorMessage(undefined);
  };

  const hasCerts = certsDraft.length > 0;

  if (!hasCerts && !canEdit && !isEditing) {
    return null;
  }

  const handleAddCert = () => {
    const newCert: CertificationItem = {
      id: `cert-${Date.now()}`,
      name: '',
      issuer: '',
      issued: new Date().getFullYear().toString(),
      expires: '',
      credentialId: '',
      url: ''
    };
    const next = [newCert, ...certsDraft];
    setCertsDraft(next);
    onUpdateField?.('certifications', next);
  };

  const handleUpdateItem = (id: string, updates: Partial<CertificationItem>) => {
    const next = certsDraft.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCertsDraft(next);
    onUpdateField?.('certifications', next);
  };

  const handleRemoveItem = (id: string) => {
    const next = certsDraft.filter((c) => c.id !== id);
    setCertsDraft(next);
    onUpdateField?.('certifications', next);
  };

  return (
    <section 
      onClick={() => canEdit && !isEditing && onSelectSection?.('certifications')}
      className={`px-4 sm:px-6 md:px-8 py-5 space-y-3.5 text-left ${theme.cardBg} border-b ${theme.divider} transition-colors ${
        canEdit && !isEditing && onSelectSection ? 'cursor-pointer hover:bg-accent/5' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-bold tracking-tight ${theme.textPrimary}`}>
          Certifications
        </h2>
        {isEditing ? (
          <button
            type="button"
            onClick={handleAddCert}
            className={`flex items-center gap-1 text-[11px] font-bold ${theme.accentText} hover:underline cursor-pointer`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Certification</span>
          </button>
        ) : (
          canEdit && onSelectSection && (
            <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium">
              Click to edit
            </span>
          )
        )}
      </div>

      {hasCerts ? (
        <div className="space-y-3">
          {certsDraft.map((cert) => (
            <div
              key={cert.id}
              className={`p-4 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} shadow-2xs relative`}
              onClick={(e) => e.stopPropagation()}
            >
              {isEditing ? (
                /* Editable Certification Card */
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <FormLabel required>Certification Title / Name</FormLabel>
                        <FormInput
                          value={cert.name || (cert as any).title || ''}
                          onChange={(val) => handleUpdateItem(cert.id, { name: val })}
                          placeholder="e.g. AWS Certified Solutions Architect"
                        />
                      </div>
                      <div>
                        <FormLabel required>Issuer / Organization</FormLabel>
                        <FormInput
                          value={cert.issuer || ''}
                          onChange={(val) => handleUpdateItem(cert.id, { issuer: val })}
                          placeholder="e.g. Amazon Web Services"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(cert.id)}
                      className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0 mt-6"
                      title="Remove certification"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <div>
                      <FormLabel>Issued Date</FormLabel>
                      <FormInput
                        value={cert.issued || ''}
                        onChange={(val) => handleUpdateItem(cert.id, { issued: val })}
                        placeholder="e.g. 2023"
                      />
                    </div>
                    <div>
                      <FormLabel>Expiration</FormLabel>
                      <FormInput
                        disabled={cert.noExpiry}
                        value={cert.noExpiry ? 'No Expiration' : (cert.expires || '')}
                        onChange={(val) => handleUpdateItem(cert.id, { expires: val })}
                        placeholder="e.g. 2026"
                      />
                    </div>
                    <div>
                      <FormLabel>Credential ID</FormLabel>
                      <FormInput
                        value={cert.credentialId || ''}
                        onChange={(val) => handleUpdateItem(cert.id, { credentialId: val })}
                        placeholder="e.g. AWS-12345"
                      />
                    </div>
                    <div>
                      <FormLabel>Credential URL</FormLabel>
                      <FormInput
                        type="url"
                        value={cert.url || ''}
                        onChange={(val) => handleUpdateItem(cert.id, { url: val })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="checkbox"
                      id={`cert-noexp-${cert.id}`}
                      checked={Boolean(cert.noExpiry)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        handleUpdateItem(cert.id, {
                          noExpiry: checked,
                          expires: checked ? 'No Expiration' : ''
                        });
                      }}
                      className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor={`cert-noexp-${cert.id}`} className="text-xs text-slate-700 dark:text-zinc-300 cursor-pointer">
                      This credential does not expire
                    </label>
                  </div>
                </div>
              ) : (
                /* View Certification Card */
                <div className="flex items-start gap-3.5">
                  <div className={`w-9 h-9 rounded-xl ${theme.badgeBg} ${theme.accentText} flex items-center justify-center shrink-0 border ${theme.cardBorder} shadow-2xs`}>
                    <Award className="w-4.5 h-4.5" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-xs sm:text-sm font-bold ${theme.textPrimary}`}>
                        {cert.name || (cert as any).title}
                      </h3>
                      {cert.url && (
                        <a
                          href={cert.url.startsWith('http://') || cert.url.startsWith('https://') ? cert.url : `https://${cert.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold hover:underline shrink-0 ${theme.accentText}`}
                          title="Verify credential"
                        >
                          <span>Verify</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <p className={`text-[11px] font-semibold ${theme.accentText}`}>
                      {cert.issuer}
                    </p>

                    <div className={`flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] ${theme.textMuted} font-mono`}>
                      {cert.issued && <span>Issued {cert.issued}</span>}
                      {cert.noExpiry ? (
                        <span>• No Expiration</span>
                      ) : (
                        cert.expires && <span>• Expires {cert.expires}</span>
                      )}
                      {cert.credentialId && (
                        <span>• ID: <span className={`font-bold ${theme.textPrimary}`}>{cert.credentialId}</span></span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isEditing && (
            <button
              type="button"
              onClick={handleAddCert}
              className={`w-full py-2 border border-dashed border-cyan-500/30 rounded-xl text-xs font-semibold ${theme.accentText} hover:bg-cyan-500/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Certificate</span>
            </button>
          )}
        </div>
      ) : (
        isEditing ? (
          <div className={`p-5 rounded-2xl ${theme.cardBg} border border-dashed border-cyan-500/30 text-center space-y-2.5`}>
            <p className={`text-xs ${theme.textMuted}`}>
              No certifications added yet.
            </p>
            <button
              type="button"
              onClick={handleAddCert}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${theme.btnPrimary} text-xs font-bold shadow-xs hover:opacity-90 cursor-pointer`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Certificate</span>
            </button>
          </div>
        ) : (
          <div className={`p-4 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} text-center`}>
            <p className={`text-xs ${theme.textMuted}`}>
              No certifications added yet.
            </p>
          </div>
        )
      )}

      {isEditing && (
        <SectionSaveBar
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={saveStatus === 'saving'}
          isSaved={saveStatus === 'saved'}
          isDirty={isDirty}
          errorMessage={errorMessage}
          saveLabel="Save Certifications"
          cancelLabel="Cancel"
          className="pt-1"
        />
      )}
    </section>
  );
}

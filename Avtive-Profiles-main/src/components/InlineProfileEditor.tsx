'use client';

import React, { useState } from 'react';
import { 
  Save, 
  X, 
  Loader2, 
  AlertCircle, 
  User, 
  Briefcase, 
  Building2, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Mail, 
  Globe, 
  Plus, 
  Trash2, 
  SkipForward,
  Sparkles,
  Check
} from 'lucide-react';
import { ProfileData, ProfileTheme, SocialLink } from '@/types/profile';
import { ImageDropzone } from './ImageDropzone';
import { LinkedInIcon, TwitterXIcon, GithubIcon, InstagramIcon, BehanceIcon } from './BrandIcons';
import { getThemeConfig } from './themeStyles';

interface InlineProfileEditorProps {
  profile: ProfileData;
  onSave: (updatedProfile: ProfileData) => Promise<void>;
  onCancel: () => void;
  onThemePreview?: (theme: ProfileTheme) => void;
}

export function InlineProfileEditor({
  profile,
  onSave,
  onCancel,
  onThemePreview
}: InlineProfileEditorProps) {
  const [formData, setFormData] = useState<ProfileData>({
    ...profile,
    theme: profile.theme || 'elegant',
    socials: profile.socials ? [...profile.socials] : []
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (field: keyof ProfileData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleThemeSelect = (theme: ProfileTheme) => {
    handleFieldChange('theme', theme);
    if (onThemePreview) {
      onThemePreview(theme);
    }
  };

  // Social link management
  const handleUpdateSocial = (index: number, field: keyof SocialLink, value: string) => {
    const updated = [...(formData.socials || [])];
    updated[index] = { ...updated[index], [field]: value };
    handleFieldChange('socials', updated);
  };

  const handleRemoveSocial = (index: number) => {
    const updated = (formData.socials || []).filter((_, i) => i !== index);
    handleFieldChange('socials', updated);
  };

  const handleAddSocial = () => {
    const updated = [
      ...(formData.socials || []),
      { platform: 'website' as const, url: '', label: 'Website', handle: '' }
    ];
    handleFieldChange('socials', updated);
  };

  // Validation & Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Required fields validation
    const errors: Record<string, string> = {};
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Full Name is required.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setErrorMessage('Please fix the required fields before saving.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (err: any) {
      console.error('Save profile error:', err);
      setErrorMessage(err.message || 'Failed to save profile changes. Please try again.');
      setIsSaving(false);
    }
  };

  const theme = getThemeConfig(formData.theme || 'elegant');

  return (
    <form onSubmit={handleSubmit} className="w-full text-left space-y-6 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* STICKY TOP CONTROLS: "Editing Profile" + Save + Discard Buttons           */}
      {/* ========================================================================= */}
      <div className={`sticky top-16 z-30 -mx-4 px-4 py-3 ${theme.headerBg} backdrop-blur-md border-y ${theme.divider} shadow-sm flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.accentText} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 bg-current ${theme.accentText}`}></span>
          </span>
          <span className={`text-xs font-bold uppercase tracking-wider ${theme.textPrimary} font-mono`}>
            Editing Profile (Inline)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Cancel / Discard */}
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${theme.btnSecondary} text-xs font-bold transition-all active:scale-95 disabled:opacity-50`}
          >
            <X className="w-3.5 h-3.5" />
            <span>Discard</span>
          </button>

          {/* Save Changes */}
          <button
            type="submit"
            disabled={isSaving}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl ${theme.btnPrimary} text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error message banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MEDIA UPLOADERS: Cover & Avatar (Requirement 4)                       */}
      {/* ========================================================================= */}
      <div className={`p-5 rounded-3xl ${theme.cardBg} border ${theme.cardBorder} shadow-sm space-y-4`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider ${theme.textPrimary} font-mono`}>
          Media & Branding (Drag & Drop or Click)
        </h3>

        <div className="space-y-4">
          <ImageDropzone
            label="Cover Banner Image"
            value={formData.coverImage || ''}
            onChange={(url) => handleFieldChange('coverImage', url)}
            aspect="banner"
          />

          <ImageDropzone
            label="Profile Avatar Photo"
            value={formData.avatar || ''}
            onChange={(url) => handleFieldChange('avatar', url)}
            aspect="square"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CORE IDENTITY (Required)                                               */}
      {/* ========================================================================= */}
      <div className={`p-5 rounded-3xl ${theme.cardBg} border ${theme.cardBorder} shadow-sm space-y-4`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider ${theme.textPrimary} font-mono`}>
          Core Identity Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className={`block text-xs font-bold ${theme.textPrimary}`}>
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="e.g. Syed Mesum Raza Shah"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-1 focus:ring-current transition-colors ${
                  validationErrors.name
                    ? 'border-rose-500'
                    : theme.cardBorder
                }`}
              />
            </div>
            {validationErrors.name && (
              <p className="text-[11px] text-rose-500 font-medium">{validationErrors.name}</p>
            )}
          </div>

          {/* Designation */}
          <div className="space-y-1.5">
            <label className={`block text-xs font-bold ${theme.textPrimary}`}>
              Designation / Professional Role
            </label>
            <div className="relative">
              <Briefcase className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
              <input
                type="text"
                value={formData.designation || ''}
                onChange={(e) => handleFieldChange('designation', e.target.value)}
                placeholder="e.g. Creative Director & Strategy"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${theme.cardBorder} text-xs font-semibold ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-1 focus:ring-current transition-colors`}
              />
            </div>
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <label className={`block text-xs font-bold ${theme.textPrimary}`}>
              Company / Organization
            </label>
            <div className="relative">
              <Building2 className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
              <input
                type="text"
                value={formData.company || ''}
                onChange={(e) => handleFieldChange('company', e.target.value)}
                placeholder="e.g. Avtive"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${theme.cardBorder} text-xs font-semibold ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-1 focus:ring-current transition-colors`}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className={`block text-xs font-bold ${theme.textPrimary}`}>
              Location / Office
            </label>
            <div className="relative">
              <MapPin className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                placeholder="e.g. Islamabad, Pakistan"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${theme.cardBorder} text-xs font-semibold ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-1 focus:ring-current transition-colors`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BIO & STORY (Optional with Skip for now) (Requirement 5)               */}
      {/* ========================================================================= */}
      <div className={`p-5 rounded-3xl ${theme.cardBg} border ${theme.cardBorder} shadow-sm space-y-4`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${theme.textPrimary} font-mono`}>
            Bio & Summary (Optional)
          </h3>
          <button
            type="button"
            onClick={() => {
              handleFieldChange('shortBio', '');
              handleFieldChange('fullBio', '');
            }}
            className={`flex items-center gap-1 text-[11px] font-bold ${theme.textMuted} hover:text-rose-500 transition-colors`}
          >
            <SkipForward className="w-3 h-3" />
            <span>Skip / Clear Bio</span>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className={`block text-xs font-bold ${theme.textPrimary} mb-1`}>
              Short Headline / Elevator Bio
            </label>
            <textarea
              rows={2}
              value={formData.shortBio || ''}
              onChange={(e) => handleFieldChange('shortBio', e.target.value)}
              placeholder="A brief 1-2 sentence introduction..."
              className={`w-full p-3 rounded-xl border ${theme.cardBorder} text-xs font-normal ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-1 focus:ring-current transition-colors resize-none`}
            />
          </div>

          <div>
            <label className={`block text-xs font-bold ${theme.textPrimary} mb-1`}>
              Full Professional Story
            </label>
            <textarea
              rows={4}
              value={formData.fullBio || ''}
              onChange={(e) => handleFieldChange('fullBio', e.target.value)}
              placeholder="Detailed background, design philosophy, or accomplishments..."
              className={`w-full p-3 rounded-xl border ${theme.cardBorder} text-xs font-normal ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-1 focus:ring-current transition-colors`}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. CONTACT CHANNELS (Optional with Skip for now) (Requirement 5)          */}
      {/* ========================================================================= */}
      <div className={`p-5 rounded-3xl ${theme.cardBg} border ${theme.cardBorder} shadow-sm space-y-4`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${theme.textPrimary} font-mono`}>
            Contact Channels (Optional)
          </h3>
          <button
            type="button"
            onClick={() => {
              handleFieldChange('phone', '');
              handleFieldChange('whatsapp', '');
              handleFieldChange('email', '');
              handleFieldChange('website', '');
            }}
            className={`flex items-center gap-1 text-[11px] font-bold ${theme.textMuted} hover:text-rose-500 transition-colors`}
          >
            <SkipForward className="w-3 h-3" />
            <span>Skip All Contacts</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Phone */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold ${theme.textPrimary}`}>Mobile Phone</label>
              {formData.phone && (
                <button
                  type="button"
                  onClick={() => handleFieldChange('phone', '')}
                  className="text-[10px] text-rose-500 font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="relative">
              <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.accentText}`} />
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="+92 300 0000000"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${theme.cardBorder} text-xs font-medium ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-1 focus:ring-current`}
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold ${theme.textPrimary}`}>WhatsApp Number</label>
              {formData.whatsapp && (
                <button
                  type="button"
                  onClick={() => handleFieldChange('whatsapp', '')}
                  className="text-[10px] text-rose-500 font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="relative">
              <MessageSquare className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.accentText}`} />
              <input
                type="text"
                value={formData.whatsapp || ''}
                onChange={(e) => handleFieldChange('whatsapp', e.target.value)}
                placeholder="+92 312 0000000"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${theme.cardBorder} text-xs font-medium ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-1 focus:ring-current`}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold ${theme.textPrimary}`}>Email Address</label>
              {formData.email && (
                <button
                  type="button"
                  onClick={() => handleFieldChange('email', '')}
                  className="text-[10px] text-rose-500 font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="relative">
              <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.accentText}`} />
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="name@avtive.app"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${theme.cardBorder} text-xs font-medium ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-1 focus:ring-current`}
              />
            </div>
          </div>

          {/* Website */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold ${theme.textPrimary}`}>Website / Portfolio</label>
              {formData.website && (
                <button
                  type="button"
                  onClick={() => handleFieldChange('website', '')}
                  className="text-[10px] text-rose-500 font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="relative">
              <Globe className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.accentText}`} />
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => handleFieldChange('website', e.target.value)}
                placeholder="https://www.avtive.app"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${theme.cardBorder} text-xs font-medium ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-1 focus:ring-current`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. SOCIAL & PROFESSIONAL LINKS (Optional with Skip for now)               */}
      {/* ========================================================================= */}
      <div className={`p-5 rounded-3xl ${theme.cardBg} border ${theme.cardBorder} shadow-sm space-y-4`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${theme.textPrimary} font-mono`}>
            Social Links (Optional)
          </h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleFieldChange('socials', [])}
              className={`flex items-center gap-1 text-[11px] font-bold ${theme.textMuted} hover:text-rose-500 transition-colors`}
            >
              <SkipForward className="w-3 h-3" />
              <span>Skip Socials</span>
            </button>
            <button
              type="button"
              onClick={handleAddSocial}
              className={`flex items-center gap-1 text-xs font-bold ${theme.accentText} hover:underline`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Link</span>
            </button>
          </div>
        </div>

        {(!formData.socials || formData.socials.length === 0) ? (
          <p className={`text-xs ${theme.textMuted} italic`}>No social links added yet. Click &quot;Add Link&quot; or proceed with saving.</p>
        ) : (
          <div className="space-y-2.5">
            {formData.socials.map((link, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 p-2.5 rounded-2xl ${theme.cardBg} border ${theme.cardBorder}`}
              >
                <select
                  value={link.platform}
                  onChange={(e) => handleUpdateSocial(idx, 'platform', e.target.value)}
                  className={`px-2 py-1.5 rounded-xl border ${theme.cardBorder} text-xs font-bold ${theme.cardBg} ${theme.textPrimary} capitalize focus:outline-none`}
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="behance">Behance</option>
                  <option value="instagram">Instagram</option>
                  <option value="twitter">Twitter / X</option>
                  <option value="github">GitHub</option>
                  <option value="website">Website</option>
                  <option value="email">Email</option>
                </select>

                <input
                  type="text"
                  value={link.label || ''}
                  onChange={(e) => handleUpdateSocial(idx, 'label', e.target.value)}
                  placeholder="Label (e.g. LinkedIn)"
                  className={`w-28 px-3 py-1.5 rounded-xl border ${theme.cardBorder} text-xs font-semibold ${theme.cardBg} ${theme.textPrimary} focus:outline-none`}
                />

                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => handleUpdateSocial(idx, 'url', e.target.value)}
                  placeholder="https://..."
                  className={`flex-1 min-w-0 px-3 py-1.5 rounded-xl border ${theme.cardBorder} text-xs font-medium ${theme.cardBg} ${theme.textPrimary} focus:outline-none`}
                />

                <button
                  type="button"
                  onClick={() => handleRemoveSocial(idx)}
                  className={`p-1.5 rounded-lg ${theme.textMuted} hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors`}
                  title="Remove link"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM ACTIONS                                                            */}
      {/* ========================================================================= */}
      <div className="pt-2 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className={`px-5 py-2.5 rounded-xl ${theme.btnSecondary} text-xs font-bold transition-all active:scale-95`}
        >
          Discard / Cancel
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl ${theme.btnPrimary} text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Profile...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

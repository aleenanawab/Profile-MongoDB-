'use client';

import React from 'react';
import { Mail, Phone, MessageSquare, MapPin, Globe, Pencil, Building2, Calendar } from 'lucide-react';
import { ProfileData } from '@/types/profile';
import { ThemeConfig, getThemeConfig } from '@/components/ui/themeStyles';
import { FormLabel, FormInput, SectionSaveBar } from '@/components/ui/formControls';
import { SearchableCombobox } from '@/components/forms/SearchableCombobox';
import { COUNTRIES } from '@/data/countriesDataset';
import { isFieldShared } from '@/lib/sections';

interface ProfileContactSectionProps {
  profile: ProfileData;
  isEditing?: boolean;
  canEdit?: boolean;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  theme?: ThemeConfig;
}

export function ProfileContactSection({
  profile,
  isEditing = false,
  canEdit = false,
  onSelectSection,
  onUpdateField,
  onSavePartial,
  theme = getThemeConfig(profile.theme || 'editorial')
}: ProfileContactSectionProps) {
  const sharing = profile.sharingSettings || {};

  const [contactDraft, setContactDraft] = React.useState({
    email: profile.email || '',
    phone: profile.phone || '',
    phoneType: profile.phoneType || 'Mobile',
    whatsapp: profile.whatsapp || '',
    location: profile.location || '',
    country: profile.country || '',
    officeAddress: profile.officeAddress || '',
    website: profile.website || '',
    websites: Array.isArray(profile.websites) ? profile.websites : (profile.website ? [{ url: profile.website, label: 'Personal Website' }] : []),
    birthday: profile.birthday || '',
    googleMapsUrl: profile.googleMapsUrl || '',
  });
  const [snapshot, setSnapshot] = React.useState(contactDraft);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  React.useEffect(() => {
    const nextDraft = {
      email: profile.email || '',
      phone: profile.phone || '',
      phoneType: profile.phoneType || 'Mobile',
      whatsapp: profile.whatsapp || '',
      location: profile.location || '',
      country: profile.country || '',
      officeAddress: profile.officeAddress || '',
      website: profile.website || '',
      websites: Array.isArray(profile.websites) ? profile.websites : (profile.website ? [{ url: profile.website, label: 'Personal Website' }] : []),
      birthday: profile.birthday || '',
      googleMapsUrl: profile.googleMapsUrl || '',
    };
    setContactDraft(nextDraft);
    setSnapshot(nextDraft);
  }, [
    profile.id,
    profile.email,
    profile.phone,
    profile.phoneType,
    profile.whatsapp,
    profile.location,
    profile.country,
    profile.officeAddress,
    profile.website,
    profile.websites,
    profile.birthday,
    profile.googleMapsUrl,
  ]);

  const isDirty = (
    contactDraft.email !== snapshot.email ||
    contactDraft.phone !== snapshot.phone ||
    contactDraft.phoneType !== snapshot.phoneType ||
    contactDraft.whatsapp !== snapshot.whatsapp ||
    contactDraft.location !== snapshot.location ||
    contactDraft.country !== snapshot.country ||
    contactDraft.officeAddress !== snapshot.officeAddress ||
    contactDraft.website !== snapshot.website ||
    JSON.stringify(contactDraft.websites) !== JSON.stringify(snapshot.websites) ||
    contactDraft.birthday !== snapshot.birthday ||
    contactDraft.googleMapsUrl !== snapshot.googleMapsUrl
  );

  const handleSaveContact = async () => {
    setSaveStatus('saving');
    setErrorMessage(undefined);
    try {
      const payload: Partial<ProfileData> = {
        email: contactDraft.email,
        phone: contactDraft.phone,
        phoneType: contactDraft.phoneType,
        whatsapp: contactDraft.whatsapp,
        location: contactDraft.location,
        country: contactDraft.country,
        officeAddress: contactDraft.officeAddress,
        website: contactDraft.website,
        websites: contactDraft.websites,
        birthday: contactDraft.birthday,
        googleMapsUrl: contactDraft.googleMapsUrl,
      };
      if (onSavePartial) {
        await onSavePartial(payload);
      }
      Object.entries(payload).forEach(([k, v]) => onUpdateField?.(k as any, v));
      setSnapshot(contactDraft);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed to save contact information');
    }
  };

  const handleCancelContact = () => {
    setContactDraft(snapshot);
    setSaveStatus('idle');
    setErrorMessage(undefined);
  };

  if (!isEditing && sharing.contactInfo === false) {
    return null;
  }

  const hasContactInfo = Boolean(
    (profile.email && sharing.email !== false) ||
    (profile.phone && sharing.phone !== false) ||
    (profile.whatsapp && sharing.phone !== false) ||
    profile.location ||
    profile.country ||
    profile.officeAddress ||
    profile.website
  );

  if (!isEditing && !hasContactInfo && !canEdit) {
    return null;
  }

  return (
    <section className={`relative group/contact px-4 sm:px-6 md:px-8 py-5 space-y-3.5 text-left border-b ${theme.divider} ${theme.cardBg} transition-colors ${
      canEdit && !isEditing && onSelectSection ? 'hover:bg-accent/5' : ''
    }`}>
      {/* Interactive edit badge */}
      {canEdit && !isEditing && onSelectSection && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectSection('contact', 'email');
          }}
          className="absolute top-4 right-6 opacity-0 group-hover/contact:opacity-100 transition-opacity bg-primary text-primary-foreground text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 hover:scale-105 z-10 cursor-pointer"
          title="Edit Contact in Sliding Editor"
        >
          <Pencil className="w-3 h-3" />
          <span>Edit Contact</span>
        </button>
      )}

      <div 
        className={`flex items-center justify-between ${canEdit && !isEditing && onSelectSection ? 'cursor-pointer' : ''}`}
        onClick={() => canEdit && !isEditing && onSelectSection?.('contact', 'email')}
      >
        <h2 className={`text-sm font-bold tracking-tight ${theme.textPrimary}`}>
          Contact
        </h2>
        {canEdit && !isEditing && onSelectSection && (
          <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium">
            Click to edit
          </span>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3 pt-1" onClick={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <FormLabel>Email Address</FormLabel>
              <FormInput
                type="email"
                value={contactDraft.email}
                onChange={(val) => setContactDraft((prev) => ({ ...prev, email: val }))}
                placeholder="email@example.com"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <FormLabel>Phone Number</FormLabel>
                <FormInput
                  type="tel"
                  value={contactDraft.phone}
                  onChange={(val) => setContactDraft((prev) => ({ ...prev, phone: val }))}
                  placeholder="+92 300 1234567"
                />
              </div>
              <div>
                <FormLabel>Type</FormLabel>
                <select
                  value={contactDraft.phoneType}
                  onChange={(e) => setContactDraft((prev) => ({ ...prev, phoneType: e.target.value }))}
                  className="w-full min-h-[44px] h-11 px-2.5 text-xs font-normal rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
                >
                  <option value="Mobile">Mobile</option>
                  <option value="Work">Work</option>
                  <option value="Home">Home</option>
                </select>
              </div>
            </div>

            <div>
              <FormLabel>WhatsApp Number</FormLabel>
              <FormInput
                type="tel"
                value={contactDraft.whatsapp}
                onChange={(val) => setContactDraft((prev) => ({ ...prev, whatsapp: val }))}
                placeholder="+92 312 5175041"
              />
            </div>

            <div>
              <FormLabel>Location / City</FormLabel>
              <FormInput
                value={contactDraft.location}
                onChange={(val) => setContactDraft((prev) => ({ ...prev, location: val }))}
                placeholder="e.g. Islamabad, Pakistan"
              />
            </div>

            <div>
              <FormLabel>Country</FormLabel>
              <SearchableCombobox
                options={COUNTRIES}
                value={contactDraft.country}
                onChange={(val) => setContactDraft((prev) => ({ ...prev, country: val as string }))}
                placeholder="Select Country..."
              />
            </div>

            <div>
              <FormLabel>Office Address</FormLabel>
              <FormInput
                value={contactDraft.officeAddress}
                onChange={(val) => setContactDraft((prev) => ({ ...prev, officeAddress: val }))}
                placeholder="Suite 400, Tech Park, City"
              />
            </div>

            <div>
              <FormLabel>Google Maps URL</FormLabel>
              <FormInput
                type="url"
                value={contactDraft.googleMapsUrl}
                onChange={(val) => setContactDraft((prev) => ({ ...prev, googleMapsUrl: val }))}
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div>
              <FormLabel>Birthday</FormLabel>
              <FormInput
                value={contactDraft.birthday}
                onChange={(val) => setContactDraft((prev) => ({ ...prev, birthday: val }))}
                placeholder="e.g. Jan 15"
              />
            </div>
          </div>

          {/* Websites List Editor */}
          <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <FormLabel>Websites & Portfolios</FormLabel>
              <button
                type="button"
                onClick={() =>
                  setContactDraft((prev) => ({
                    ...prev,
                    websites: [...(prev.websites || []), { url: '', label: 'Personal' }],
                  }))
                }
                className="text-xs text-primary font-semibold hover:underline cursor-pointer"
              >
                + Add Website
              </button>
            </div>
            {(contactDraft.websites || []).map((ws, wIdx) => (
              <div key={wIdx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={ws.label || ''}
                  onChange={(e) => {
                    const next = [...(contactDraft.websites || [])];
                    next[wIdx] = { ...next[wIdx], label: e.target.value };
                    setContactDraft((prev) => ({ ...prev, websites: next }));
                  }}
                  placeholder="Label (e.g. Blog, Company)"
                  className="w-1/3 min-h-[38px] px-2.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
                <input
                  type="url"
                  value={ws.url || ''}
                  onChange={(e) => {
                    const next = [...(contactDraft.websites || [])];
                    next[wIdx] = { ...next[wIdx], url: e.target.value };
                    setContactDraft((prev) => ({
                      ...prev,
                      websites: next,
                      website: next[0]?.url || prev.website,
                    }));
                  }}
                  placeholder="https://..."
                  className="flex-1 min-h-[38px] px-2.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = (contactDraft.websites || []).filter((_, i) => i !== wIdx);
                    setContactDraft((prev) => ({ ...prev, websites: next }));
                  }}
                  className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <SectionSaveBar
            onSave={handleSaveContact}
            onCancel={handleCancelContact}
            isSaving={saveStatus === 'saving'}
            isSaved={saveStatus === 'saved'}
            isDirty={isDirty}
            errorMessage={errorMessage}
            saveLabel="Save Contact Info"
            cancelLabel="Cancel"
            className="pt-1"
          />
        </div>
      ) : hasContactInfo ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {profile.email && isFieldShared(profile, 'email') && (
            <a
              href={`mailto:${profile.email}`}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${theme.cardBorder} ${theme.subCardBg} hover:opacity-80 transition-opacity`}
            >
              <div className="w-7 h-7 rounded-lg bg-slate-500/10 flex items-center justify-center shrink-0">
                <Mail className={`w-3.5 h-3.5 ${theme.accentText}`} />
              </div>
              <div className="min-w-0 flex-1">
                <span className={`block text-[10px] font-bold uppercase font-mono ${theme.textMuted}`}>
                  Email
                </span>
                <span className={`block text-xs font-semibold ${theme.textPrimary} truncate`}>
                  {profile.email}
                </span>
              </div>
            </a>
          )}

          {profile.phone && isFieldShared(profile, 'phone') && (
            <a
              href={`tel:${profile.phone.replace(/[^0-9+]/g, '')}`}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${theme.cardBorder} ${theme.subCardBg} hover:opacity-80 transition-opacity`}
            >
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Phone className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <span className={`block text-[10px] font-bold uppercase font-mono ${theme.textMuted}`}>
                  Phone {profile.phoneType ? `(${profile.phoneType})` : ''}
                </span>
                <span className={`block text-xs font-semibold ${theme.textPrimary} truncate`}>
                  {profile.phone}
                </span>
              </div>
            </a>
          )}

          {profile.whatsapp && isFieldShared(profile, 'whatsapp') && (
            <a
              href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(profile.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${theme.cardBorder} ${theme.subCardBg} hover:opacity-80 transition-opacity`}
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <span className={`block text-[10px] font-bold uppercase font-mono ${theme.textMuted}`}>
                  WhatsApp
                </span>
                <span className={`block text-xs font-semibold ${theme.textPrimary} truncate`}>
                  {profile.whatsapp}
                </span>
              </div>
            </a>
          )}

          {(profile.location || profile.country) && (
            <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${theme.cardBorder} ${theme.subCardBg}`}>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <span className={`block text-[10px] font-bold uppercase font-mono ${theme.textMuted}`}>
                  Location
                </span>
                {profile.googleMapsUrl ? (
                  <a
                    href={profile.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block text-xs font-semibold ${theme.textPrimary} hover:underline truncate`}
                  >
                    {[profile.location, profile.country].filter(Boolean).join(', ')}
                  </a>
                ) : (
                  <span className={`block text-xs font-semibold ${theme.textPrimary} truncate`}>
                    {[profile.location, profile.country].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </div>
          )}

          {profile.officeAddress && (
            <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${theme.cardBorder} ${theme.subCardBg}`}>
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <div className="min-w-0 flex-1">
                <span className={`block text-[10px] font-bold uppercase font-mono ${theme.textMuted}`}>
                  Office Address
                </span>
                <span className={`block text-xs font-semibold ${theme.textPrimary} truncate`}>
                  {profile.officeAddress}
                </span>
              </div>
            </div>
          )}

          {/* Multiple Websites or single website */}
          {Array.isArray(profile.websites) && profile.websites.length > 0 ? (
            profile.websites.map((ws, i) => (
              <a
                key={i}
                href={ws.url.startsWith('http') ? ws.url : `https://${ws.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${theme.cardBorder} ${theme.subCardBg} hover:opacity-80 transition-opacity`}
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`block text-[10px] font-bold uppercase font-mono ${theme.textMuted}`}>
                    {ws.label || 'Website'}
                  </span>
                  <span className={`block text-xs font-semibold ${theme.textPrimary} truncate`}>
                    {ws.url.replace(/^https?:\/\//, '')}
                  </span>
                </div>
              </a>
            ))
          ) : profile.website ? (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${theme.cardBorder} ${theme.subCardBg} hover:opacity-80 transition-opacity`}
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <div className="min-w-0 flex-1">
                <span className={`block text-[10px] font-bold uppercase font-mono ${theme.textMuted}`}>
                  Website
                </span>
                <span className={`block text-xs font-semibold ${theme.textPrimary} truncate`}>
                  {profile.website.replace(/^https?:\/\//, '')}
                </span>
              </div>
            </a>
          ) : null}

          {profile.birthday && (canEdit || profile.sharingSettings?.birthday === true) && (
            <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${theme.cardBorder} ${theme.subCardBg}`}>
              <div className="w-7 h-7 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5 text-pink-500" />
              </div>
              <div className="min-w-0 flex-1">
                <span className={`block text-[10px] font-bold uppercase font-mono ${theme.textMuted}`}>
                  Birthday
                </span>
                <span className={`block text-xs font-semibold ${theme.textPrimary} truncate`}>
                  {profile.birthday}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={`p-4 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} text-center`}>
          <p className={`text-xs ${theme.textMuted}`}>
            No contact information provided yet.
          </p>
        </div>
      )}
    </section>
  );
}

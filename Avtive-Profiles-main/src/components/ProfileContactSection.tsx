'use client';

import React from 'react';
import { Mail, Phone, MessageSquare, MapPin, Globe, Pencil, Building2, Calendar } from 'lucide-react';
import { ProfileData } from '../types/profile';
import { ThemeConfig, getThemeConfig } from './themeStyles';
import { FormLabel, FormInput, SectionSaveBar } from './ui/formControls';
import { SearchableCombobox } from './forms/SearchableCombobox';
import { COUNTRIES } from '@/data/countriesDataset';

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
    whatsapp: profile.whatsapp || '',
    location: profile.location || '',
    country: profile.country || '',
    officeAddress: profile.officeAddress || '',
    website: profile.website || '',
    bookingUrl: profile.bookingUrl || '',
  });
  const [snapshot, setSnapshot] = React.useState(contactDraft);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  React.useEffect(() => {
    const nextDraft = {
      email: profile.email || '',
      phone: profile.phone || '',
      whatsapp: profile.whatsapp || '',
      location: profile.location || '',
      country: profile.country || '',
      officeAddress: profile.officeAddress || '',
      website: profile.website || '',
      bookingUrl: profile.bookingUrl || '',
    };
    setContactDraft(nextDraft);
    setSnapshot(nextDraft);
  }, [
    profile.id,
    profile.email,
    profile.phone,
    profile.whatsapp,
    profile.location,
    profile.country,
    profile.officeAddress,
    profile.website,
    profile.bookingUrl,
  ]);

  const isDirty = (
    contactDraft.email !== snapshot.email ||
    contactDraft.phone !== snapshot.phone ||
    contactDraft.whatsapp !== snapshot.whatsapp ||
    contactDraft.location !== snapshot.location ||
    contactDraft.country !== snapshot.country ||
    contactDraft.officeAddress !== snapshot.officeAddress ||
    contactDraft.website !== snapshot.website ||
    contactDraft.bookingUrl !== snapshot.bookingUrl
  );

  const handleSaveContact = async () => {
    setSaveStatus('saving');
    setErrorMessage(undefined);
    try {
      const payload: Partial<ProfileData> = {
        email: contactDraft.email,
        phone: contactDraft.phone,
        whatsapp: contactDraft.whatsapp,
        location: contactDraft.location,
        country: contactDraft.country,
        officeAddress: contactDraft.officeAddress,
        website: contactDraft.website,
        bookingUrl: contactDraft.bookingUrl,
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
    profile.website ||
    profile.bookingUrl
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

            <div>
              <FormLabel>Phone Number</FormLabel>
              <FormInput
                type="tel"
                value={contactDraft.phone}
                onChange={(val) => setContactDraft((prev) => ({ ...prev, phone: val }))}
                placeholder="+92 300 1234567"
              />
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
              <FormLabel>Website URL</FormLabel>
              <FormInput
                type="url"
                value={contactDraft.website}
                onChange={(val) => setContactDraft((prev) => ({ ...prev, website: val }))}
                placeholder="https://www.avtive.app"
              />
            </div>

            <div>
              <FormLabel>Booking URL</FormLabel>
              <FormInput
                type="url"
                value={contactDraft.bookingUrl}
                onChange={(val) => setContactDraft((prev) => ({ ...prev, bookingUrl: val }))}
                placeholder="https://calendly.com/your-calendar"
              />
            </div>
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
          {profile.email && sharing.email !== false && (
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

          {profile.phone && sharing.phone !== false && (
            <a
              href={`tel:${profile.phone.replace(/[^0-9+]/g, '')}`}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${theme.cardBorder} ${theme.subCardBg} hover:opacity-80 transition-opacity`}
            >
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Phone className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <span className={`block text-[10px] font-bold uppercase font-mono ${theme.textMuted}`}>
                  Phone
                </span>
                <span className={`block text-xs font-semibold ${theme.textPrimary} truncate`}>
                  {profile.phone}
                </span>
              </div>
            </a>
          )}

          {profile.whatsapp && sharing.phone !== false && (
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
                <span className={`block text-xs font-semibold ${theme.textPrimary} truncate`}>
                  {[profile.location, profile.country].filter(Boolean).join(', ')}
                </span>
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

          {profile.website && (
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
          )}

          {profile.bookingUrl && (
            <a
              href={profile.bookingUrl.startsWith('http') ? profile.bookingUrl : `https://${profile.bookingUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${theme.cardBorder} ${theme.subCardBg} hover:opacity-80 transition-opacity`}
            >
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5 text-violet-500" />
              </div>
              <div className="min-w-0 flex-1">
                <span className={`block text-[10px] font-bold uppercase font-mono ${theme.textMuted}`}>
                  Book Appointment
                </span>
                <span className={`block text-xs font-semibold ${theme.textPrimary} truncate`}>
                  {profile.bookingUrl.replace(/^https?:\/\//, '')}
                </span>
              </div>
            </a>
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

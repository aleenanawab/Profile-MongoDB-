'use client';

import React from 'react';
import {
  ExternalLink,
  Mail,
  Phone,
  FileText,
  Calendar,
  Hash,
  Globe,
  Sparkles,
  Pencil,
  Plus,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { ProfileData, CustomFieldItem } from '@/types/profile';
import { ThemeConfig, getThemeConfig } from '@/components/ui/themeStyles';
import { FormLabel, FormInput, SectionSaveBar } from '@/components/ui/formControls';
import { VisibilityEyeButton } from '@/components/ui/VisibilityEyeButton';

interface CustomFieldsSectionProps {
  profile: ProfileData;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
  theme?: ThemeConfig;
}

export function CustomFieldsSection({
  profile,
  canEdit = false,
  isEditing = false,
  onUpdateField,
  onSavePartial,
  onSelectSection,
  theme = getThemeConfig(profile.theme || 'editorial')
}: CustomFieldsSectionProps) {
  const [fieldsDraft, setFieldsDraft] = React.useState<CustomFieldItem[]>(profile.customFields || []);
  const [snapshot, setSnapshot] = React.useState<CustomFieldItem[]>(profile.customFields || []);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  const isDirty = JSON.stringify(fieldsDraft) !== JSON.stringify(snapshot);

  const lastProfileIdRef = React.useRef(profile.id);
  React.useEffect(() => {
    const isProfileSwitch = profile.id !== lastProfileIdRef.current;
    if (isProfileSwitch) {
      lastProfileIdRef.current = profile.id;
      const next = profile.customFields || [];
      setFieldsDraft(next);
      setSnapshot(next);
      return;
    }

    if (!isDirty) {
      const incoming = profile.customFields || [];
      if (JSON.stringify(incoming) !== JSON.stringify(snapshot)) {
        setFieldsDraft(incoming);
        setSnapshot(incoming);
      }
    }
  }, [profile.id, profile.customFields, isDirty, snapshot]);

  const handleSave = async () => {
    setSaveStatus('saving');
    setErrorMessage(undefined);
    try {
      const payload: Partial<ProfileData> = {
        customFields: fieldsDraft,
      };
      if (onSavePartial) {
        await onSavePartial(payload);
      }
      onUpdateField?.('customFields', fieldsDraft);
      setSnapshot(fieldsDraft);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed to save custom fields');
    }
  };

  const handleCancel = () => {
    setFieldsDraft(snapshot);
    setSaveStatus('idle');
    setErrorMessage(undefined);
  };

  const visibleFields = fieldsDraft.filter((f) => isEditing || canEdit || (f.visible !== false && (f as any).isPublic !== false));

  const handleToggleFieldVisibility = async (fieldId: string) => {
    const next = fieldsDraft.map((f) => {
      if (f.id !== fieldId) return f;
      const nextVis = f.visible === false ? true : false;
      return { ...f, visible: nextVis, isPublic: nextVis };
    });
    setFieldsDraft(next);
    setSnapshot(next);
    onUpdateField?.('customFields', next);
    if (onSavePartial) {
      try {
        await onSavePartial({ customFields: next });
      } catch (err) {
        console.error('Failed to persist custom field visibility:', err);
      }
    }
  };

  if (visibleFields.length === 0 && !canEdit && !isEditing) {
    return null;
  }

  const renderFieldIcon = (field: CustomFieldItem) => {
    switch (field.type) {
      case 'link':
        return <Globe className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'phone':
        return <Phone className="w-4 h-4" />;
      case 'date':
        return <Calendar className="w-4 h-4" />;
      case 'number':
        return <Hash className="w-4 h-4" />;
      case 'markdown':
      case 'text':
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const renderFieldValue = (field: CustomFieldItem) => {
    const val = field.value || (field as any).content || '';
    if (!val) {
      return <span className={`text-xs ${theme.textMuted} italic`}>Not specified</span>;
    }

    if (field.type === 'link' || (val.startsWith('http://') || val.startsWith('https://'))) {
      const href = val.startsWith('http') ? val : `https://${val}`;
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 text-xs font-semibold hover:underline break-all ${theme.accentText}`}
        >
          <span>{val}</span>
          <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
        </a>
      );
    }

    if (field.type === 'email' || (val.includes('@') && !val.includes(' '))) {
      return (
        <a
          href={`mailto:${val.replace(/^mailto:/, '')}`}
          className={`inline-flex items-center gap-1 text-xs font-semibold hover:underline break-all ${theme.accentText}`}
        >
          <span>{val}</span>
        </a>
      );
    }

    if (field.type === 'phone') {
      return (
        <a
          href={`tel:${val.replace(/[^0-9+]/g, '')}`}
          className={`inline-flex items-center gap-1 text-xs font-semibold hover:underline ${theme.accentText}`}
        >
          <span>{val}</span>
        </a>
      );
    }

    return (
      <span className={`text-xs font-medium ${theme.textPrimary} break-words whitespace-pre-line leading-relaxed`}>
        {val}
      </span>
    );
  };

  const updateFields = (next: CustomFieldItem[]) => {
    setFieldsDraft(next);
    onUpdateField?.('customFields', next);
  };

  const handleAddField = () => {
    const newField: CustomFieldItem = {
      id: `cf-${Date.now()}`,
      label: '',
      value: '',
      type: 'text',
      visible: true,
    };
    const next = [...fieldsDraft, newField];
    updateFields(next);
  };

  const handleRemoveField = (id: string) => {
    const next = fieldsDraft.filter((f) => f.id !== id);
    updateFields(next);
  };

  const handleUpdateFieldItem = (id: string, updates: Partial<CustomFieldItem>) => {
    const next = fieldsDraft.map((f) => (f.id === id ? { ...f, ...updates } : f));
    updateFields(next);
  };

  return (
    <div className={`px-4 @md:px-6 @2xl:px-8 py-5 ${theme.cardBg} border-b ${theme.divider} transition-colors`}>
      <div className={`p-4 @md:p-5 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} transition-colors space-y-3.5 shadow-2xs`}>
      <div
        onClick={() => !isEditing && canEdit && onSelectSection?.('customFields')}
        className={`flex items-center justify-between pb-1 border-b border-black/5 dark:border-white/5 ${canEdit && !isEditing ? 'cursor-pointer group/cfheader' : ''
          }`}
        title={canEdit && !isEditing ? 'Click to edit Custom Fields in Studio' : undefined}
      >
        <div className="flex items-center gap-2">
          <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${theme.textMuted} flex items-center gap-1.5`}>
            <Sparkles className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200" />
            <span>Custom Fields</span>
          </h3>
          {canEdit && !isEditing && (
            <span className="opacity-0 group/cfheader:opacity-100 transition-opacity text-[10px] font-mono font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
              <Pencil className="w-2.5 h-2.5" />
              Edit All
            </span>
          )}
        </div>
        {isEditing ? (
          <button
            type="button"
            onClick={handleAddField}
            className="min-h-[44px] text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Field</span>
          </button>
        ) : (
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText} font-semibold`}>
            {visibleFields.length} {visibleFields.length === 1 ? 'Field' : 'Fields'}
          </span>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3 pt-1" onClick={(e) => e.stopPropagation()}>
          {fieldsDraft.map((field) => (
            <div
              key={field.id}
              className={`p-3.5 rounded-xl border border-black/10 dark:border-white/10 ${theme.subCardBg} space-y-2.5`}
            >
              <div className="flex flex-col @md:flex-row items-stretch @md:items-center gap-2">
                <div className="flex-1">
                  <FormInput
                    value={field.label || (field as any).title || ''}
                    onChange={(val) => handleUpdateFieldItem(field.id, { label: val, title: val } as any)}
                    placeholder="Field Label (e.g. Portfolio, Discord, Office Hours)"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={field.type || 'text'}
                    onChange={(e) => handleUpdateFieldItem(field.id, { type: e.target.value as any })}
                    className={`h-11 min-h-[44px] text-xs px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 ${theme.textPrimary} bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 cursor-pointer flex-1 @md:flex-none`}
                  >
                    <option value="text">Text</option>
                    <option value="link">Link</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="markdown">Markdown</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVis = field.visible === false ? true : false;
                      handleUpdateFieldItem(field.id, { visible: nextVis, isPublic: nextVis } as any);
                    }}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-700/50 transition-colors shrink-0 cursor-pointer"
                    title={field.visible !== false ? 'Field is visible on public profile' : 'Field is hidden from public profile'}
                    aria-label="Toggle field visibility"
                  >
                    {field.visible !== false ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveField(field.id)}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-rose-500 hover:text-rose-600 rounded-xl hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                    title="Remove field"
                    aria-label="Remove field"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <FormInput
                  value={field.value || (field as any).content || ''}
                  onChange={(val) => handleUpdateFieldItem(field.id, { value: val, content: val } as any)}
                  placeholder="Field Value (e.g. https://... or custom details)"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddField}
            className="w-full min-h-[44px] py-2.5 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Another Custom Field</span>
          </button>

          <SectionSaveBar
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={saveStatus === 'saving'}
            isSaved={saveStatus === 'saved'}
            isDirty={isDirty}
            errorMessage={errorMessage}
            saveLabel="Save Custom Fields"
            cancelLabel="Cancel"
            className="pt-1"
          />
        </div>
      ) : visibleFields.length > 0 ? (
        <div className="grid grid-cols-1 @md:grid-cols-2 gap-2.5 pt-1">
          {visibleFields.map((field) => {
            const val = field.value || (field as any).content || '';
            const isMultiLine = field.type === 'markdown' || val.includes('\n') || val.length > 55;
            const title = field.label || (field as any).title || 'Custom Field';
            const isFieldVisible = field.visible !== false && (field as any).isPublic !== false;

            return (
              <div
                key={field.id}
                onClick={() => canEdit && onSelectSection?.('customFields', field.id)}
                className={`min-w-0 p-3 rounded-xl border ${
                  !isFieldVisible
                    ? 'border-dashed border-amber-500/45 bg-amber-500/[0.04] opacity-70'
                    : 'border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]'
                } flex items-start gap-2.5 transition-all hover:border-black/10 dark:hover:border-white/20 ${
                  isMultiLine ? '@md:col-span-2' : ''
                } ${
                  canEdit ? 'cursor-pointer group/cfitem hover:ring-2 hover:ring-zinc-900/20 dark:hover:ring-white/25 hover:bg-zinc-100/70 dark:hover:bg-white/[0.04]' : ''
                }`}
                title={canEdit ? `Click to edit "${title}" in Studio` : undefined}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${theme.badgeBg} ${theme.accentText}`}
                >
                  {renderFieldIcon(field)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`block text-[10px] font-bold uppercase tracking-wider ${theme.textMuted} truncate`}>
                      {title}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {canEdit && (
                        <VisibilityEyeButton
                          visible={isFieldVisible}
                          label={title}
                          onToggle={() => handleToggleFieldVisibility(field.id)}
                        />
                      )}
                      {canEdit && (
                        <span className="opacity-0 group/cfitem:opacity-100 transition-opacity text-[9px] font-mono text-zinc-600 dark:text-zinc-400 font-bold flex items-center gap-0.5">
                          <Pencil className="w-2.5 h-2.5" />
                          Edit
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-1">
                    {renderFieldValue(field)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className={`text-xs ${theme.textSecondary} italic py-1`}>
          No custom fields added yet.
        </p>
      )}
      </div>
    </div>
  );
}

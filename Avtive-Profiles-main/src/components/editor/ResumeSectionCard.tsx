'use client';

import React, { useRef, useState } from 'react';
import { FileText, Upload, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { ProfileData } from '@/types/profile';
import { FormInput, FormLabel } from '@/components/ui/formControls';

interface ResumeSectionCardProps {
  profile: ProfileData;
  onUpdateField: (field: keyof ProfileData, value: unknown) => void;
  onShowToast?: (msg: string) => void;
}

export function ResumeSectionCard({
  profile,
  onUpdateField,
  onShowToast
}: ResumeSectionCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasResume = Boolean(profile.resumeUrl || profile.resumeFileName);

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (e.target) e.target.value = '';

    setError(null);
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('PDF must be 10MB or smaller.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'documents');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Failed to upload CV / Resume PDF.');
      }

      onUpdateField('resumeUrl', data.url);
      onUpdateField('resumeFileName', file.name || data.filename || 'resume.pdf');
      onShowToast?.('CV / Resume uploaded');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload PDF.';
      setError(msg);
      onShowToast?.(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveResume = () => {
    onUpdateField('resumeUrl', '');
    onUpdateField('resumeFileName', '');
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleUploadPdf}
      />

      {hasResume && (
        <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-zinc-900 dark:text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-950 dark:text-white truncate">
                {profile.resumeFileName || 'Attached CV / Resume'}
              </p>
              {profile.resumeUrl && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {profile.resumeUrl}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {profile.resumeUrl && (
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[34px] px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 inline-flex items-center gap-1"
                title="Open CV URL"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open</span>
              </a>
            )}
            <button
              type="button"
              onClick={handleRemoveResume}
              className="min-h-[34px] px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 inline-flex items-center gap-1 cursor-pointer"
              title="Remove attached CV"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <FormLabel>Display File Name</FormLabel>
          <FormInput
            value={profile.resumeFileName || ''}
            onChange={(val) => onUpdateField('resumeFileName', val)}
            placeholder="e.g. Aleena-Nawab-CV.pdf"
          />
        </div>
        <div>
          <FormLabel>CV / Resume URL</FormLabel>
          <FormInput
            value={profile.resumeUrl || ''}
            onChange={(val) => onUpdateField('resumeUrl', val)}
            placeholder="https://.../resume.pdf"
          />
        </div>
      </div>

      <button
        type="button"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-white bg-zinc-50 dark:bg-zinc-900/60 text-xs font-semibold text-zinc-900 dark:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Uploading PDF...</span>
          </>
        ) : (
          <>
            <Upload className="w-3.5 h-3.5" />
            <span>{hasResume ? 'Replace CV / Resume PDF' : 'Upload CV / Resume PDF'}</span>
          </>
        )}
      </button>

      {error && (
        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">{error}</p>
      )}
    </div>
  );
}

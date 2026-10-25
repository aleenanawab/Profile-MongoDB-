'use client';

import React from 'react';
import { Save, X, Loader2, Check, AlertCircle } from 'lucide-react';

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}

export function FormLabel({ children, required = false, hint, className = '', ...props }: FormLabelProps) {
  return (
    <label
      className={`block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1 transition-colors ${className}`}
      {...props}
    >
      <span className="flex items-center justify-between gap-1">
        <span>
          {children}
          {required && <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>}
        </span>
        {hint && <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">{hint}</span>}
      </span>
    </label>
  );
}

export interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  hasError?: boolean;
  onChange?: (value: string) => void;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className = '', hasError = false, onChange, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full min-h-[44px] h-11 px-3.5 text-base sm:text-sm font-normal rounded-xl border ${
          hasError
            ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-200 dark:border-zinc-700/80 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-cyan-500/20'
        } bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${className}`}
        onChange={(e) => {
          if (!onChange) return;
          onChange(e.target.value);
        }}
        {...props}
      />
    );
  }
);
FormInput.displayName = 'FormInput';

export interface FormTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  hasError?: boolean;
  onChange?: (value: string) => void;
}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className = '', hasError = false, rows = 3, onChange, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={`w-full min-h-[44px] p-3.5 text-base sm:text-sm font-normal rounded-xl border ${
          hasError
            ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-200 dark:border-zinc-700/80 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-cyan-500/20'
        } bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition-all resize-y disabled:opacity-50 ${className}`}
        onChange={(e) => {
          if (!onChange) return;
          onChange(e.target.value);
        }}
        {...props}
      />
    );
  }
);
FormTextarea.displayName = 'FormTextarea';

export interface SectionSaveBarProps {
  onSave: () => void | Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
  isDirty?: boolean;
  saveStatus?: 'idle' | 'saving' | 'success' | 'saved' | 'error';
  errorMessage?: string | null;
  saveLabel?: string;
  cancelLabel?: string;
  className?: string;
  showCancel?: boolean;
}

export function SectionSaveBar({
  onSave,
  onCancel,
  isSaving = false,
  isSaved = false,
  isDirty = true,
  saveStatus = 'idle',
  errorMessage = null,
  saveLabel = 'Save Changes',
  cancelLabel = 'Cancel',
  className = '',
  showCancel = true
}: SectionSaveBarProps) {
  const isSuccess = isSaved || saveStatus === 'success' || saveStatus === 'saved';

  return (
    <div className={`pt-3 space-y-2 ${className}`}>
      {errorMessage && (
        <div className="p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2.5">
        {showCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="min-h-[44px] px-4 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-[0.98] flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
            title="Discard changes in this section"
          >
            <X className="w-4 h-4" />
            <span>{cancelLabel}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className={`min-h-[44px] px-5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer ${
            isSuccess
              ? 'bg-emerald-600 text-white'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white disabled:bg-slate-200 dark:disabled:bg-zinc-800 disabled:text-slate-400 dark:disabled:text-zinc-600 disabled:cursor-not-allowed disabled:active:scale-100'
          }`}
          title="Save changes in this section"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : isSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{saveLabel}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

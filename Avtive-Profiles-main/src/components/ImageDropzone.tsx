'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Loader2, AlertCircle, Check } from 'lucide-react';

interface ImageDropzoneProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
  aspect?: 'square' | 'banner';
  className?: string;
  bucket?: string;
}

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/bmp'
];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function ImageDropzone({
  value,
  onChange,
  label,
  aspect = 'square',
  className = '',
  bucket
}: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(value);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const isAllowed = ALLOWED_TYPES.includes(file.type) || file.type.startsWith('image/');
    if (!isAllowed) {
      return 'Invalid file type. Please select an image (JPG, PNG, WebP, GIF, SVG, AVIF).';
    }
    if (file.size > MAX_SIZE_BYTES) {
      return 'File exceeds 10MB limit. Please choose a smaller image.';
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      return;
    }

    setErrorMessage(null);
    setUploadSuccess(false);

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    // Upload to API
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const targetBucket = bucket || (label.toLowerCase().includes('avatar') ? 'avatars' : 'profiles');
      formData.append('bucket', targetBucket);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      onChange(data.url);
      setPreviewUrl(data.url);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2500);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8] font-mono">
        {label}
      </label>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative overflow-hidden cursor-pointer transition-all duration-200 border-2 border-dashed ${
          isDragging
            ? 'border-slate-800 dark:border-white bg-slate-100 dark:bg-white/10 scale-[1.01]'
            : 'border-slate-300 dark:border-white/20 hover:border-slate-600 dark:hover:border-white/40 bg-slate-50 dark:bg-neutral-900'
        } ${
          aspect === 'square'
            ? 'w-24 h-24 sm:w-28 sm:h-28 rounded-2xl'
            : 'w-full h-32 sm:h-36 rounded-2xl'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Existing / Preview Image */}
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-[#94A3B8]">
            <ImageIcon className="w-6 h-6 mb-1 text-[#94A3B8]" />
            <span className="text-[10px] font-medium">Click or Drop Image</span>
          </div>
        )}

        {/* Overlay on hover or drag */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-white text-center">
          {isUploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          ) : uploadSuccess ? (
            <Check className="w-6 h-6 text-emerald-400" />
          ) : (
            <>
              <UploadCloud className="w-5 h-5 mb-1" />
              <span className="text-[11px] font-bold">Replace</span>
              <span className="text-[9px] text-white/80">JPG, PNG, WebP ≤ 5MB</span>
            </>
          )}
        </div>

        {/* Loading Spinner during upload */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-1 text-xs text-rose-500 font-medium pt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

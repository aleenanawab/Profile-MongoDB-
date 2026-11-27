'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Video,
  Link2,
  Play,
  Pause,
  Square,
  Trash2,
  RotateCcw,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  Volume2,
  Sparkles,
  Eye,
  EyeOff,
  X,
  Radio,
  Pencil
} from 'lucide-react';
import {
  ProfileData,
  ProfileIntroductionMedia,
  ProfileIntroductionMediaType,
  ExternalMediaProvider
} from '@/types/profile';
import { ThemeConfig } from '@/components/ui/themeStyles';
import { VisibilityEyeButton } from '@/components/ui/VisibilityEyeButton';

interface ProfileIntroductionMediaProps {
  profile: ProfileData;
  isEditing?: boolean;
  canEdit?: boolean;
  theme?: ThemeConfig;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onOpenEdit?: () => void;
}

// ── Provider URL Parsers & Embed Generators ──────────────────────────────────
export function parseExternalVideoUrl(rawUrl: string): {
  provider: ExternalMediaProvider;
  id: string | null;
  embedUrl: string | null;
  thumbnailUrl: string | null;
} {
  const url = rawUrl.trim();

  // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, youtube.com/embed/ID
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const id = ytMatch[1];
    return {
      provider: 'youtube',
      id,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`
    };
  }

  // Vimeo: vimeo.com/ID or player.vimeo.com/video/ID
  const vimeoMatch = url.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const id = vimeoMatch[1];
    return {
      provider: 'vimeo',
      id,
      embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1`,
      thumbnailUrl: null
    };
  }

  // Instagram: instagram.com/reel/ID or instagram.com/p/ID
  const igMatch = url.match(/instagram\.com\/(?:reel|p)\/([a-zA-Z0-9_-]+)/i);
  if (igMatch && igMatch[1]) {
    const id = igMatch[1];
    return {
      provider: 'instagram',
      id,
      embedUrl: `https://www.instagram.com/reel/${id}/embed`,
      thumbnailUrl: null
    };
  }

  // Loom: loom.com/share/ID
  const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/i);
  if (loomMatch && loomMatch[1]) {
    const id = loomMatch[1];
    return {
      provider: 'other',
      id,
      embedUrl: `https://www.loom.com/embed/${id}?autoplay=1`,
      thumbnailUrl: null
    };
  }

  // Other HTTPS generic video link
  if (url.startsWith('https://')) {
    return {
      provider: 'other',
      id: null,
      embedUrl: url,
      thumbnailUrl: null
    };
  }

  return {
    provider: 'other',
    id: null,
    embedUrl: null,
    thumbnailUrl: null
  };
}

export function ProfileIntroductionMediaSection({
  profile,
  isEditing = false,
  canEdit = false,
  theme,
  onUpdateField,
  onSavePartial,
  onOpenEdit
}: ProfileIntroductionMediaProps) {
  const media = profile.introductionMedia || null;
  const isVisible = profile.sharingSettings?.introductionMedia !== false;

  // Local state for edit modal / expanded creator
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileIntroductionMediaType>('voice');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Short video state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // External link state
  const [externalUrlInput, setExternalUrlInput] = useState('');
  const [externalTitleInput, setExternalTitleInput] = useState('');

  // Playback state in viewer
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Lazy playback state for external video embed
  const [isPlayingExternal, setIsPlayingExternal] = useState(false);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [audioUrl, videoPreviewUrl]);

  // Voice recording handlers
  const startVoiceRecording = async () => {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Determine supported audio MIME
      const preferredMimes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4'
      ];
      const supportedMime =
        typeof MediaRecorder.isTypeSupported === 'function'
          ? preferredMimes.find((m) => MediaRecorder.isTypeSupported(m))
          : undefined;

      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);
      const effectiveMime = recorder.mimeType || supportedMime || 'audio/webm';
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const cleanType = effectiveMime.split(';')[0].trim() || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: cleanType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        // Stop audio tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= 60) { // Max 60 seconds limit
            stopVoiceRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      setErrorMessage(err?.message || 'Could not access microphone. Please grant permission.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const resetVoiceRecording = () => {
    stopVoiceRecording();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSeconds(0);
    setErrorMessage(null);
  };

  // Video file selection
  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Video size exceeds 25MB limit. Please choose a shorter clip.');
      return;
    }

    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setErrorMessage(null);
  };

  // Save Voice Introduction
  const handleSaveVoiceIntro = async () => {
    if (!audioBlob) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Upload audio blob to Cloudinary via /api/upload (strip codec parameters like ;codecs=opus)
      const baseAudioMime = (audioBlob.type || 'audio/webm').split(';')[0].trim().toLowerCase() || 'audio/webm';
      const audioExt = baseAudioMime.includes('ogg')
        ? 'ogg'
        : baseAudioMime.includes('mp4') || baseAudioMime.includes('m4a')
        ? 'm4a'
        : 'webm';
      const audioFile = new File([audioBlob], `voice_intro_${Date.now()}.${audioExt}`, {
        type: baseAudioMime
      });

      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('bucket', 'media');
      formData.append('target', 'profiles');
      formData.append('field', 'introductionMedia');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      const permanentUrl = data.url;
      const publicId = data.publicId;

      const mediaData: ProfileIntroductionMedia = {
        type: 'voice',
        url: permanentUrl,
        publicId,
        duration: recordingSeconds || 15,
        title: 'Voice Introduction',
        createdAt: new Date().toISOString()
      };

      onUpdateField?.('introductionMedia', mediaData);
      if (onSavePartial) {
        await onSavePartial({ introductionMedia: mediaData });
      }

      setIsEditorOpen(false);
      resetVoiceRecording();
    } catch (err: any) {
      console.error('Save voice intro failed:', err);
      setErrorMessage(err?.message || 'Failed to save voice introduction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Video Introduction
  const handleSaveVideoIntro = async () => {
    if (!videoFile) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('target', 'profiles');
      formData.append('field', 'introductionMedia');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      const permanentUrl = data.url;
      const publicId = data.publicId;

      const mediaData: ProfileIntroductionMedia = {
        type: 'video',
        url: permanentUrl,
        publicId,
        title: 'Video Introduction',
        createdAt: new Date().toISOString()
      };

      onUpdateField?.('introductionMedia', mediaData);
      if (onSavePartial) {
        await onSavePartial({ introductionMedia: mediaData });
      }

      setIsEditorOpen(false);
      setVideoFile(null);
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(null);
    } catch (err: any) {
      console.error('Save video intro failed:', err);
      setErrorMessage(err?.message || 'Failed to save video introduction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save External Link
  const handleSaveExternalLink = async () => {
    if (!externalUrlInput.trim()) {
      setErrorMessage('Please enter a valid video link.');
      return;
    }

    const parsed = parseExternalVideoUrl(externalUrlInput);
    if (!parsed.embedUrl) {
      setErrorMessage('Please provide a supported HTTPS video link (YouTube, Vimeo, Instagram, Loom).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const mediaData: ProfileIntroductionMedia = {
        type: 'external',
        url: externalUrlInput.trim(),
        provider: parsed.provider,
        embedUrl: parsed.embedUrl,
        thumbnailUrl: parsed.thumbnailUrl || undefined,
        title: externalTitleInput.trim() || `${parsed.provider.charAt(0).toUpperCase() + parsed.provider.slice(1)} Introduction`,
        createdAt: new Date().toISOString()
      };

      onUpdateField?.('introductionMedia', mediaData);
      if (onSavePartial) {
        await onSavePartial({ introductionMedia: mediaData });
      }

      setIsEditorOpen(false);
      setExternalUrlInput('');
      setExternalTitleInput('');
    } catch (err: any) {
      console.error('Save external link failed:', err);
      setErrorMessage(err?.message || 'Failed to save media link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove Introduction Media
  const handleRemoveMedia = async () => {
    setIsSubmitting(true);
    try {
      onUpdateField?.('introductionMedia', null);
      if (onSavePartial) {
        await onSavePartial({ introductionMedia: null });
      }
      setIsEditorOpen(false);
    } catch (err: any) {
      console.error('Remove media failed:', err);
      setErrorMessage(err?.message || 'Failed to remove introduction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Visibility
  const handleToggleVisibility = async () => {
    const currentSharing = profile.sharingSettings || {};
    const newVisibility = !isVisible;
    const newSharing = {
      ...currentSharing,
      introductionMedia: newVisibility
    };

    onUpdateField?.('sharingSettings', newSharing);
    if (onSavePartial) {
      try {
        await onSavePartial({ sharingSettings: newSharing });
      } catch (e) {
        console.error('Toggle visibility save failed:', e);
      }
    }
  };

  // Audio Playback Handlers
  const togglePlayAudio = () => {
    if (!audioElementRef.current) return;
    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  // If visitor mode and either no media or hidden, return null; if owner preview and no media, return null
  if (!isEditing && !media) {
    return null;
  }
  if (!isEditing && !canEdit && !isVisible) {
    return null;
  }

  return (
    <div className="w-full my-3">
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* VIEW / PLAYBACK DISPLAY                                                 */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {media && (
        <div className={`relative rounded-2xl border transition-all overflow-hidden ${!isVisible
          ? 'border-dashed border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20'
          : theme
            ? `${theme.subCardBg} ${theme.subCardBorder}`
            : 'border-slate-200/90 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.04]'
          }`}>
          {/* Header Strip with Type Indicator & Edit Controls */}
          <div className={`px-3.5 py-2 flex items-center justify-between border-b ${theme?.divider || 'border-slate-200/60 dark:border-white/5'} text-xs`}>
            <div className={`flex items-center gap-1.5 font-semibold ${theme?.textPrimary || 'text-slate-700 dark:text-slate-200'}`}>
              {media.type === 'voice' && (
                <>
                  <Mic className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />
                  <span>Voice Introduction</span>
                </>
              )}
              {media.type === 'video' && (
                <>
                  <Video className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />
                  <span>Video Introduction</span>
                </>
              )}
              {media.type === 'external' && (
                <>
                  <Link2 className="w-3.5 h-3.5 text-rose-500" />
                  <span className="capitalize">{media.provider || 'Video'} Introduction</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {canEdit && !isEditing && (
                <VisibilityEyeButton
                  visible={isVisible}
                  label="Voice or Video Intro"
                  onToggle={handleToggleVisibility}
                />
              )}
              {isEditing && !isVisible && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                  <EyeOff className="w-2.5 h-2.5" />
                  Hidden
                </span>
              )}

              {canEdit && (
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(true)}
                  className={`text-xs font-semibold px-2 py-1 rounded-lg ${theme?.textSecondary || 'text-slate-500'} hover:opacity-80 transition-colors flex items-center gap-1 cursor-pointer`}
                  title="Edit or replace introduction"
                >
                  <Pencil className="w-3 h-3" />
                  <span className="text-[11px]">Edit</span>
                </button>
              )}
            </div>
          </div>

          {/* Media Content */}
          <div className="p-3">
            {/* 1. Voice Introduction Playback */}
            {media.type === 'voice' && (
              <div className="flex items-center gap-3">
                <audio
                  ref={audioElementRef}
                  src={media.url}
                  preload="metadata"
                  onTimeUpdate={(e) => setAudioCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)}
                  onEnded={() => setIsPlayingAudio(false)}
                />

                <button
                  type="button"
                  onClick={togglePlayAudio}
                  className="w-10 h-10 rounded-full bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black flex items-center justify-center shrink-0 shadow-xs transition-all active:scale-95 cursor-pointer"
                  title={isPlayingAudio ? "Pause" : "Play Voice Introduction"}
                >
                  {isPlayingAudio ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                {/* Animated Audio Waveform Bars */}
                <div className={`flex-1 flex items-center gap-1 h-8 px-2 rounded-xl border overflow-hidden ${theme ? `${theme.subCardBg} ${theme.subCardBorder}` : 'bg-white/60 dark:bg-black/30 border-zinc-200 dark:border-zinc-800'
                  }`}>
                  {[24, 45, 78, 60, 90, 40, 70, 85, 30, 55, 95, 65, 35, 75, 50, 80, 45, 65, 90, 30, 50, 85, 60, 40].map((h, idx) => (
                    <span
                      key={idx}
                      className={`flex-1 rounded-full transition-all duration-200 ${isPlayingAudio
                        ? 'bg-zinc-900 dark:bg-white animate-pulse'
                        : 'bg-zinc-300 dark:bg-zinc-700'
                        }`}
                      style={{
                        height: isPlayingAudio ? `${Math.max(15, (h * (idx % 2 === 0 ? 1 : 0.7)))}%` : `${h * 0.4}%`,
                        animationDelay: `${idx * 40}ms`
                      }}
                    />
                  ))}
                </div>

                {/* Time Display */}
                <div className={`text-[11px] font-mono ${theme?.textSecondary || 'text-slate-500 dark:text-slate-400'} font-semibold shrink-0`}>
                  {Math.floor(audioCurrentTime)}s / {Math.floor(audioDuration || media.duration || 0)}s
                </div>
              </div>
            )}

            {/* 2. Direct Video Playback */}
            {media.type === 'video' && (
              <div className="relative rounded-xl overflow-hidden bg-black max-w-md mx-auto aspect-video shadow-md">
                <video
                  src={media.url}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* 3. External Embedded Player (YouTube / Vimeo / Instagram / Loom) */}
            {media.type === 'external' && (
              <div className="relative rounded-xl overflow-hidden bg-black max-w-lg mx-auto aspect-video shadow-md">
                {isPlayingExternal && media.embedUrl ? (
                  <iframe
                    src={media.embedUrl}
                    title={media.title || "Introduction Video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  // Lazy Load Facade: zero external tracking scripts until user clicks Play!
                  <div
                    onClick={() => setIsPlayingExternal(true)}
                    className="w-full h-full relative cursor-pointer group flex items-center justify-center overflow-hidden"
                  >
                    {media.thumbnailUrl ? (
                      <img
                        src={media.thumbnailUrl}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
                        <Sparkles className="w-8 h-8 text-white mb-2 opacity-80" />
                        <p className="text-xs font-semibold text-white drop-shadow-md">
                          {media.title || 'Click to Play Introduction Video'}
                        </p>
                      </div>
                    )}

                    {/* Dark gradient vignette */}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />

                    {/* Play Button Overlay */}
                    <div className="w-14 h-14 rounded-full bg-rose-600/90 group-hover:bg-rose-500 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-all z-10">
                      <Play className="w-6 h-6 fill-current ml-1" />
                    </div>

                    {/* Provider Tag */}
                    <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                      {media.provider || 'Video'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* EMPTY STATE / ADD INTRODUCTION BUTTON (when editing)                  */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {isEditing && !media && (
        <button
          type="button"
          onClick={() => setIsEditorOpen(true)}
          className="w-full py-2.5 px-3 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-white hover:bg-zinc-100/70 dark:hover:bg-white/[0.04] transition-all text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2 cursor-pointer group"
        >
          <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Mic className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />
          </div>
          <span>Add Profile Introduction (Voice, Video, or YouTube Link)</span>
        </button>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* CREATOR / EDITOR MODAL OR DRAWER                                       */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#111111] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-zinc-900 dark:text-white" />
                  <span>Profile Introduction Media</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Introduce yourself with voice, short video, or an embedded link.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetVoiceRecording();
                  setIsEditorOpen(false);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mx-5 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Tab Selection */}
            <div className="px-5 pt-4">
              <div className="flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 border border-slate-200/60 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('voice');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeTab === 'voice'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                >
                  <Mic className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />
                  <span>Voice Intro</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('video');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeTab === 'video'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950'
                    }`}
                >
                  <Video className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />
                  <span>Upload Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('external');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeTab === 'external'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                >
                  <Link2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>External Link</span>
                </button>
              </div>
            </div>

            {/* Tab Panes */}
            <div className="p-5">
              {/* ── 1. Voice Recording Tab ───────────────────────────────── */}
              {activeTab === 'voice' && (
                <div className="space-y-4">
                  <div className="border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-center bg-slate-50/50 dark:bg-white/[0.02]">
                    {!audioBlob ? (
                      <div>
                        {isRecording ? (
                          <div className="space-y-3">
                            <div className="w-16 h-16 mx-auto rounded-full bg-rose-500 text-white flex items-center justify-center animate-pulse shadow-lg shadow-rose-500/30">
                              <Radio className="w-8 h-8" />
                            </div>
                            <div>
                              <div className="text-xl font-mono font-bold text-rose-500">
                                00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 01:00
                              </div>
                              <p className="text-xs text-slate-500 mt-1">Recording your voice... Speak clearly into your mic.</p>
                            </div>
                            <button
                              type="button"
                              onClick={stopVoiceRecording}
                              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 mx-auto"
                            >
                              <Square className="w-4 h-4 fill-current" />
                              <span>Stop Recording</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="w-16 h-16 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white flex items-center justify-center">
                              <Mic className="w-8 h-8" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                                Record a brief 30–60s voice introduction
                              </p>
                              <p className="text-[11px] text-zinc-500 mt-0.5">
                                Say hi, introduce your background, or share what you&apos;re passionate about.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={startVoiceRecording}
                              className="px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 mx-auto"
                            >
                              <Mic className="w-4 h-4" />
                              <span>Start Recording</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Preview Recorded Audio */
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                          <Check className="w-4 h-4" />
                          <span>Voice recording captured ({recordingSeconds}s)</span>
                        </p>
                        {audioUrl && (
                          <audio
                            src={audioUrl}
                            controls
                            className="w-full max-w-xs mx-auto"
                          />
                        )}
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={resetVoiceRecording}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Record Again</span>
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleSaveVoiceIntro}
                            className="px-4 py-1.5 rounded-xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Save Voice Intro</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── 2. Short Video Upload Tab ────────────────────────────── */}
              {activeTab === 'video' && (
                <div className="space-y-4">
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={handleVideoFileSelect}
                  />

                  {!videoFile ? (
                    <div
                      onClick={() => videoInputRef.current?.click()}
                      className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-white rounded-2xl p-6 text-center cursor-pointer transition-colors bg-zinc-50 dark:bg-white/[0.02]"
                    >
                      <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white flex items-center justify-center mb-2">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Click to select a short video (MP4, WebM, MOV)
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Max file size: 25MB. Recommended length: 15–60 seconds.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {videoPreviewUrl && (
                        <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-w-sm mx-auto shadow-md">
                          <video
                            src={videoPreviewUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="truncate max-w-[200px]">{videoFile.name}</span>
                        <span>{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setVideoFile(null);
                            if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
                            setVideoPreviewUrl(null);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                        >
                          Change File
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={handleSaveVideoIntro}
                          className="px-4 py-1.5 rounded-xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Uploading to Cloudinary...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Save Video Intro</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── 3. External Video Link Tab ───────────────────────────── */}
              {activeTab === 'external' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Video Link URL
                    </label>
                    <input
                      type="url"
                      value={externalUrlInput}
                      onChange={(e) => setExternalUrlInput(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... or vimeo.com/..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Supports YouTube, YouTube Shorts, Vimeo, Instagram Reels, and Loom.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Custom Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={externalTitleInput}
                      onChange={(e) => setExternalTitleInput(e.target.value)}
                      placeholder="e.g. My Creative Journey"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    />
                  </div>

                  {/* Realtime link preview */}
                  {externalUrlInput.trim() && (() => {
                    const parsed = parseExternalVideoUrl(externalUrlInput);
                    return parsed.embedUrl ? (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                          <Check className="w-3.5 h-3.5" />
                          <span className="capitalize">Valid {parsed.provider} video recognized!</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          Embed: {parsed.embedUrl}
                        </p>
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
                        Please enter a valid YouTube, Vimeo, or Instagram link.
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isSubmitting || !externalUrlInput.trim()}
                      onClick={handleSaveExternalLink}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Media Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Footer Controls: Visibility Toggle & Delete ──────────── */}
              <div className="mt-5 pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs">
                {/* Visibility Toggle */}
                <button
                  type="button"
                  onClick={handleToggleVisibility}
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer font-medium"
                >
                  {isVisible ? (
                    <>
                      <Eye className="w-4 h-4 text-emerald-500" />
                      <span>Visible to Visitors</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 text-amber-500" />
                      <span>Hidden from Visitors</span>
                    </>
                  )}
                </button>

                {/* Remove Media Button */}
                {media && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleRemoveMedia}
                    className="flex items-center gap-1 text-rose-500 hover:text-rose-600 font-semibold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Media</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

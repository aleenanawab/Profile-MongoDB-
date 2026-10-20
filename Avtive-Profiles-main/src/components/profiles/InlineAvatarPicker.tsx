'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Upload,
  Link2,
  Check,
  Sparkles,
  User,
  Code,
  Palette,
  Briefcase,
  Layers,
  X,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  Globe,
  Plus
} from 'lucide-react';

export interface InlineAvatarPickerProps {
  currentAvatar: string;
  onSelectAvatar: (newAvatarUrl: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onClose?: () => void;
  isUploading?: boolean;
  onUploadFile?: (file: File) => Promise<void> | void;
  className?: string;
}

// Crisp inline SVG data URIs for instant, offline-safe, high-res illustrated and icon presets
const createGradientSvgAvatar = (bgGradient: string, iconSvg: string, label: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        ${bgGradient}
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="60" fill="url(#grad)" />
    <g transform="translate(30, 30) scale(2.5)" stroke="#ffffff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">
      ${iconSvg}
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export interface AvatarItem {
  id: string;
  name: string;
  category: 'photos' | 'illustrated' | 'icons';
  url: string;
  badge?: string;
}

export const BUILTIN_AVATARS: AvatarItem[] = [
  // --- Curated Photo Avatars ---
  {
    id: 'photo-1',
    name: 'Aleena / Engineer',
    category: 'photos',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
    badge: 'Popular'
  },
  {
    id: 'photo-2',
    name: 'Alex / Tech Lead',
    category: 'photos',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop',
    badge: 'Pro'
  },
  {
    id: 'photo-3',
    name: 'Maya / Designer',
    category: 'photos',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'photo-4',
    name: 'David / Founder',
    category: 'photos',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'photo-5',
    name: 'Sarah / Product Lead',
    category: 'photos',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'photo-6',
    name: 'James / Consultant',
    category: 'photos',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'photo-7',
    name: 'Elena / Architect',
    category: 'photos',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'photo-8',
    name: 'Marcus / Creator',
    category: 'photos',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600&auto=format&fit=crop'
  },

  // --- 3D & Illustrated Personas ---
  {
    id: 'illust-1',
    name: '3D Developer Guy',
    category: 'illustrated',
    url: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=600&auto=format&fit=crop',
    badge: '3D'
  },
  {
    id: 'illust-2',
    name: '3D Creative Girl',
    category: 'illustrated',
    url: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?q=80&w=600&auto=format&fit=crop',
    badge: '3D'
  },
  {
    id: 'illust-3',
    name: '3D Studio Character',
    category: 'illustrated',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'illust-4',
    name: '3D Modern Persona',
    category: 'illustrated',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'illust-5',
    name: 'Prism Hologram',
    category: 'illustrated',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop',
    badge: 'Neon'
  },
  {
    id: 'illust-6',
    name: 'Cyberpunk 3D Character',
    category: 'illustrated',
    url: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=600&auto=format&fit=crop'
  },

  // --- Instant High-Res Icon & Gradient Badges ---
  {
    id: 'icon-code',
    name: 'Terminal Engineer',
    category: 'icons',
    url: createGradientSvgAvatar(
      '<stop offset="0%" stop-color="#059669"/><stop offset="100%" stop-color="#047857"/>',
      '<polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>',
      'Code'
    ),
    badge: 'SVG'
  },
  {
    id: 'icon-sparkles',
    name: 'AI & Innovation',
    category: 'icons',
    url: createGradientSvgAvatar(
      '<stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#a855f7"/>',
      '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"></path>',
      'Sparkles'
    ),
    badge: 'SVG'
  },
  {
    id: 'icon-palette',
    name: 'UI/UX Creator',
    category: 'icons',
    url: createGradientSvgAvatar(
      '<stop offset="0%" stop-color="#f43f5e"/><stop offset="100%" stop-color="#fb7185"/>',
      '<circle cx="13.5" cy="6.5" r=".5" fill="#fff"></circle><circle cx="17.5" cy="10.5" r=".5" fill="#fff"></circle><circle cx="8.5" cy="7.5" r=".5" fill="#fff"></circle><circle cx="6.5" cy="12.5" r=".5" fill="#fff"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>',
      'Design'
    ),
    badge: 'SVG'
  },
  {
    id: 'icon-briefcase',
    name: 'Executive & Business',
    category: 'icons',
    url: createGradientSvgAvatar(
      '<stop offset="0%" stop-color="#d97706"/><stop offset="100%" stop-color="#b45309"/>',
      '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>',
      'Briefcase'
    ),
    badge: 'SVG'
  },
  {
    id: 'icon-user',
    name: 'Minimalist Persona',
    category: 'icons',
    url: createGradientSvgAvatar(
      '<stop offset="0%" stop-color="#334155"/><stop offset="100%" stop-color="#0f172a"/>',
      '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
      'User'
    ),
    badge: 'SVG'
  },
  {
    id: 'icon-globe',
    name: 'Global Leader',
    category: 'icons',
    url: createGradientSvgAvatar(
      '<stop offset="0%" stop-color="#0284c7"/><stop offset="100%" stop-color="#0369a1"/>',
      '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>',
      'Globe'
    ),
    badge: 'SVG'
  }
];

export function InlineAvatarPicker({
  currentAvatar,
  onSelectAvatar,
  isOpen,
  onToggleOpen,
  onClose,
  isUploading = false,
  onUploadFile,
  className = ''
}: InlineAvatarPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'photos' | 'illustrated' | 'icons' | 'custom'>('all');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const filteredAvatars = activeTab === 'all'
    ? BUILTIN_AVATARS
    : BUILTIN_AVATARS.filter((a) => a.category === activeTab);

  const handleApplyCustomUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customUrlInput.trim();
    if (trimmed) {
      onSelectAvatar(trimmed);
      setCustomUrlInput('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(file);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.98 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#151821] border border-slate-200 dark:border-white/10 shadow-lg space-y-3.5">
              {/* Header Bar */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Choose Profile Photo
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-white/60">
                      Pick a built-in avatar, icon badge, or upload your own
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    title="Upload image from computer"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3" />
                    )}
                    <span>{isUploading ? 'Uploading...' : 'Upload Photo'}</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      title="Collapse avatar picker"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                {[
                  { id: 'all' as const, label: 'All Choices' },
                  { id: 'photos' as const, label: '📸 Portraits' },
                  { id: 'illustrated' as const, label: '🎨 3D Personas' },
                  { id: 'icons' as const, label: '⚡ Icon Badges' },
                  { id: 'custom' as const, label: '🔗 Custom URL' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:bg-slate-200/70 dark:hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab 1-4: Grid of Avatar Choices */}
              {activeTab !== 'custom' ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {/* Quick Upload Tile */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="group flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-slate-300 dark:border-white/20 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50/70 dark:bg-white/5 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer text-center"
                    title="Upload from device"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </div>
                    <span className="mt-1 text-[9px] font-bold text-slate-600 dark:text-white/70 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      Browse
                    </span>
                  </button>

                  {/* Built-in Choices */}
                  {filteredAvatars.map((item) => {
                    const isSelected = currentAvatar === item.url;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectAvatar(item.url)}
                        className={`group relative flex flex-col items-center p-1 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'border-transparent hover:border-slate-200 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                        title={item.name}
                      >
                        <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 shadow-2xs group-hover:scale-105 transition-transform">
                          <img
                            src={item.url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-indigo-600/40 backdrop-blur-[1px] flex items-center justify-center text-white">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        {item.badge && !isSelected && (
                          <span className="absolute -top-1 -right-1 text-[8px] font-bold px-1 rounded-sm bg-indigo-500 text-white shadow-xs">
                            {item.badge}
                          </span>
                        )}

                        <span className="mt-1 text-[9px] font-medium text-slate-600 dark:text-white/70 truncate w-full text-center group-hover:text-slate-900 dark:group-hover:text-white">
                          {item.name.split('/')[0].trim()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Tab 5: Custom Image Link & Drag Box */
                <div className="space-y-3 pt-1">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-4 rounded-xl border-2 border-dashed text-center transition-all cursor-pointer ${
                      isDragOver
                        ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30'
                        : 'border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-white/5 hover:border-slate-400 dark:hover:border-white/30'
                    }`}
                  >
                    <Upload className="w-6 h-6 mx-auto text-indigo-500 mb-1.5" />
                    <p className="text-xs font-bold text-slate-800 dark:text-white">
                      Drag & Drop photo here, or <span className="text-indigo-600 dark:text-indigo-400 underline">browse files</span>
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-white/50 mt-0.5">
                      Supports JPG, PNG, WEBP, SVG up to 10MB
                    </p>
                  </div>

                  <form onSubmit={handleApplyCustomUrl} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Link2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="url"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        className="figma-input w-full pl-8 pr-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!customUrlInput.trim()}
                      className="px-3 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shadow-xs shrink-0"
                    >
                      Apply URL
                    </button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { ProfileTheme } from '@/types/profile';

export interface ThemeConfig {
  id: ProfileTheme;
  name: string;
  tag: string;
  description: string;
  previewClass: string;
  pageBg: string;
  headerBg: string;
  container: string;
  cardBg: string;
  cardBorder: string;
  subCardBg: string;
  subCardBorder: string;
  hoverBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentText: string;
  badgeBg: string;
  badgeText: string;
  btnPrimary: string;
  btnSecondary: string;
  divider: string;
  fontFamily: string;
  pillTheme: string;
  coverFallback: string;
  accentRim: string;
}

export const PROFILE_THEMES: Record<ProfileTheme, ThemeConfig> = {
  default: {
    id: 'default',
    name: 'Clean Neutral',
    tag: 'Clean',
    description: 'Crisp neutral layout, sleek balanced monochrome, professional typography in one solid color with zero blue',
    previewClass: 'bg-white border-slate-700 text-slate-900',
    pageBg: 'bg-[#F8FAFC] dark:bg-[#09090B]',
    headerBg: 'bg-white/95 dark:bg-[#121216]/95 border-slate-200 dark:border-white/10',
    container: 'bg-white dark:bg-[#121216] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-xl',
    cardBg: 'bg-white dark:bg-[#121216]',
    cardBorder: 'border-slate-200 dark:border-white/10',
    subCardBg: 'bg-white dark:bg-[#121216]',
    subCardBorder: 'border-slate-200 dark:border-white/10',
    hoverBorder: 'hover:border-slate-400 dark:hover:border-slate-500',
    textPrimary: 'text-slate-900 dark:text-white',
    textSecondary: 'text-[#475569] dark:text-[#94A3B8]',
    textMuted: 'text-[#64748B] dark:text-[#64748B]',
    accentText: 'text-slate-900 dark:text-white',
    badgeBg: 'bg-slate-100 dark:bg-white/10',
    badgeText: 'text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/15',
    btnPrimary: 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black font-bold rounded-xl',
    btnSecondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-900 dark:text-white border border-slate-200 dark:border-white/15 rounded-xl',
    divider: 'border-slate-200 dark:border-white/10',
    fontFamily: 'font-sans',
    pillTheme: 'bg-slate-100 text-slate-700',
    coverFallback: 'bg-white dark:bg-[#121216]',
    accentRim: 'bg-gradient-to-r from-transparent via-slate-400 to-transparent'
  },
  dark: {
    id: 'dark',
    name: 'Dark Executive',
    tag: 'Dark',
    description: 'Deep obsidian contrast, crisp silver accents, sleek executive monochrome in one solid color',
    previewClass: 'bg-[#0F0F12] border-neutral-600 text-white',
    pageBg: 'bg-[#09090B] dark:bg-[#09090B]',
    headerBg: 'bg-[#0F0F12]/95 dark:bg-[#0F0F12]/95 border-white/10',
    container: 'bg-[#121216] dark:bg-[#121216] text-white border-white/10 shadow-2xl',
    cardBg: 'bg-[#121216] dark:bg-[#121216]',
    cardBorder: 'border-white/10',
    subCardBg: 'bg-[#121216] dark:bg-[#121216]',
    subCardBorder: 'border-white/10',
    hoverBorder: 'hover:border-white/30',
    textPrimary: 'text-white',
    textSecondary: 'text-neutral-300',
    textMuted: 'text-neutral-400',
    accentText: 'text-white dark:text-white',
    badgeBg: 'bg-white/10',
    badgeText: 'text-neutral-200 border border-white/20',
    btnPrimary: 'bg-white hover:bg-neutral-200 text-black font-bold shadow-md',
    btnSecondary: 'bg-white/10 hover:bg-white/15 text-white border border-white/20',
    divider: 'border-white/10',
    fontFamily: 'font-sans',
    pillTheme: 'bg-neutral-800 text-neutral-200',
    coverFallback: 'bg-[#121216] dark:bg-[#121216]',
    accentRim: 'bg-gradient-to-r from-transparent via-white/50 to-transparent'
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    tag: 'Minimal',
    description: 'Generous whitespace, stark monochrome typography, ultra-subtle borders in one solid color',
    previewClass: 'bg-neutral-50 border-neutral-800 text-neutral-900',
    pageBg: 'bg-[#F4F4F5] dark:bg-[#09090B]',
    headerBg: 'bg-white/95 dark:bg-[#09090B]/95 border-neutral-200 dark:border-neutral-800',
    container: 'bg-white dark:bg-[#111111] text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-800 shadow-sm',
    cardBg: 'bg-white dark:bg-[#111111]',
    cardBorder: 'border-neutral-200 dark:border-neutral-800',
    subCardBg: 'bg-white dark:bg-[#111111]',
    subCardBorder: 'border-neutral-200 dark:border-neutral-800',
    hoverBorder: 'hover:border-neutral-400 dark:hover:border-neutral-600',
    textPrimary: 'text-neutral-950 dark:text-neutral-50 font-normal tracking-tight',
    textSecondary: 'text-neutral-600 dark:text-neutral-400',
    textMuted: 'text-neutral-400 dark:text-neutral-500',
    accentText: 'text-neutral-950 dark:text-white',
    badgeBg: 'bg-neutral-100 dark:bg-neutral-800',
    badgeText: 'text-neutral-900 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700',
    btnPrimary: 'bg-neutral-950 hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black rounded-lg',
    btnSecondary: 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-lg',
    divider: 'border-neutral-200 dark:border-neutral-800',
    fontFamily: 'font-sans',
    pillTheme: 'bg-neutral-200 text-neutral-800',
    coverFallback: 'bg-white dark:bg-[#111111]',
    accentRim: 'bg-gradient-to-r from-transparent via-neutral-400 dark:via-neutral-600 to-transparent'
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    tag: 'Corporate',
    description: 'Structured corporate cards, cool slate hierarchy, deep business styling in one solid color with zero blue',
    previewClass: 'bg-slate-100 border-slate-700 text-slate-900',
    pageBg: 'bg-[#F1F5F9] dark:bg-[#0F1216]',
    headerBg: 'bg-white/95 dark:bg-[#0F1216]/95 border-slate-200 dark:border-slate-800',
    container: 'bg-white dark:bg-[#14171D] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-xl',
    cardBg: 'bg-white dark:bg-[#14171D]',
    cardBorder: 'border-slate-200 dark:border-slate-800',
    subCardBg: 'bg-white dark:bg-[#14171D]',
    subCardBorder: 'border-slate-200 dark:border-slate-800',
    hoverBorder: 'hover:border-slate-400 dark:hover:border-slate-600',
    textPrimary: 'text-slate-900 dark:text-white font-bold',
    textSecondary: 'text-slate-700 dark:text-slate-300',
    textMuted: 'text-slate-500 dark:text-slate-400',
    accentText: 'text-slate-900 dark:text-slate-100',
    badgeBg: 'bg-slate-200/80 dark:bg-slate-800',
    badgeText: 'text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold',
    btnPrimary: 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 font-bold rounded-xl',
    btnSecondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-xl',
    divider: 'border-slate-200 dark:border-slate-800',
    fontFamily: 'font-sans',
    pillTheme: 'bg-slate-200 text-slate-800',
    coverFallback: 'bg-white dark:bg-[#14171D]',
    accentRim: 'bg-gradient-to-r from-transparent via-slate-400 dark:via-slate-500 to-transparent'
  },
  elegant: {
    id: 'elegant',
    name: 'Elegant',
    tag: 'Luxury',
    description: 'Warm champagne & amber tones, refined typography, luxury feel in single unified palette with zero blue',
    previewClass: 'bg-[#FAF7F2] border-[#B88746] text-[#2C221E]',
    pageBg: 'bg-[#F7F2EB] dark:bg-[#120F0C]',
    headerBg: 'bg-[#FAF7F2]/95 dark:bg-[#181411]/95 border-[#E5DAC8] dark:border-[#2D231B]',
    container: 'bg-[#FAF7F2] dark:bg-[#181411] text-[#2B231D] dark:text-[#F5EFE6] border border-[#E8DFD3] dark:border-[#382E25] shadow-xl',
    cardBg: 'bg-[#FAF7F2] dark:bg-[#181411]',
    cardBorder: 'border-[#E5DAC8] dark:border-[#2D231B]',
    subCardBg: 'bg-[#FAF7F2] dark:bg-[#181411]',
    subCardBorder: 'border-[#E5DAC8] dark:border-[#2D231B]',
    hoverBorder: 'hover:border-[#B88746] dark:hover:border-[#E5B869]/60',
    textPrimary: 'text-[#2B231D] dark:text-[#F5EFE6] font-sans',
    textSecondary: 'text-[#6B5D52] dark:text-[#C5B7AB]',
    textMuted: 'text-[#8E7E72] dark:text-[#9A8B7F]',
    accentText: 'text-[#B88746] dark:text-[#E5B869]',
    badgeBg: 'bg-[#B88746]/10 dark:bg-[#E5B869]/15',
    badgeText: 'text-[#9A6A2C] dark:text-[#E5B869] border border-[#B88746]/30',
    btnPrimary: 'bg-[#B88746] hover:bg-[#A37336] dark:bg-[#C59A52] dark:hover:bg-[#B88746] text-white dark:text-[#18130E] shadow-md shadow-[#B88746]/25 rounded-xl',
    btnSecondary: 'bg-[#B88746]/10 hover:bg-[#B88746]/20 dark:bg-[#E5B869]/10 dark:hover:bg-[#E5B869]/20 text-[#9A6A2C] dark:text-[#E5B869] border border-[#B88746]/30 rounded-xl',
    divider: 'border-[#E5DAC8] dark:border-[#2D231B]',
    fontFamily: 'font-sans',
    pillTheme: 'bg-[#F4ECE1] text-[#9A6A2C]',
    coverFallback: 'bg-[#FAF7F2] dark:bg-[#181411]',
    accentRim: 'bg-gradient-to-r from-transparent via-[#B88746] to-transparent'
  },
  modern: {
    id: 'modern',
    name: 'Modern / Creative',
    tag: 'Creative',
    description: 'Expressive gradient accents, modern cards, emerald and mint highlights in one solid color',
    previewClass: 'bg-[#F8FAFC] border-emerald-500 text-emerald-950',
    pageBg: 'bg-[#F0FDF4] dark:bg-[#04120E]',
    headerBg: 'bg-white/95 dark:bg-[#071511]/95 border-emerald-500/20 dark:border-emerald-500/20',
    container: 'bg-white dark:bg-[#071511] text-slate-900 dark:text-white border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-2xl shadow-emerald-500/5',
    cardBg: 'bg-white dark:bg-[#071511]',
    cardBorder: 'border-emerald-500/20 dark:border-emerald-500/20',
    subCardBg: 'bg-white dark:bg-[#071511]',
    subCardBorder: 'border-emerald-500/20 dark:border-emerald-500/20',
    hoverBorder: 'hover:border-emerald-500/50',
    textPrimary: 'text-slate-900 dark:text-white font-extrabold tracking-tight',
    textSecondary: 'text-slate-600 dark:text-slate-300',
    textMuted: 'text-slate-400 dark:text-slate-500',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    badgeText: 'text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold',
    btnPrimary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 rounded-xl',
    btnSecondary: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 rounded-xl',
    divider: 'border-emerald-500/20 dark:border-emerald-500/20',
    fontFamily: 'font-sans',
    pillTheme: 'bg-emerald-100 text-emerald-800',
    coverFallback: 'bg-white dark:bg-[#071511]',
    accentRim: 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent'
  },
  editorial: {
    id: 'editorial',
    name: 'Editorial Minimal',
    tag: 'Editorial',
    description: 'Clean, classy, and professional with warm terracotta accents and plenty of whitespace',
    previewClass: 'bg-[#FAFAF9] dark:bg-[#1C1917] border-[#E5E5E5] dark:border-white/10 text-stone-900 dark:text-white',
    pageBg: 'bg-[#FAFAF9] dark:bg-[#1C1917]',
    headerBg: 'bg-[#FAFAF9]/95 dark:bg-[#1C1917]/95 border-[#E5E5E5] dark:border-white/10',
    container: 'bg-[#FFFFFF] dark:bg-[#292524] text-stone-900 dark:text-stone-100 border border-[#E5E5E5] dark:border-white/10 shadow-sm rounded-xl',
    cardBg: 'bg-[#FFFFFF] dark:bg-[#292524]',
    cardBorder: 'border-[#E5E5E5] dark:border-white/10',
    subCardBg: 'bg-[#FAFAF9] dark:bg-[#24201E]',
    subCardBorder: 'border-[#E5E5E5] dark:border-white/10',
    hoverBorder: 'hover:border-[#C2410C]/60 dark:hover:border-[#EA580C]/60',
    textPrimary: 'text-stone-900 dark:text-stone-100 font-sans',
    textSecondary: 'text-stone-600 dark:text-stone-400',
    textMuted: 'text-stone-400 dark:text-stone-500',
    accentText: 'text-[#C2410C] dark:text-[#EA580C]',
    badgeBg: 'bg-[#C2410C]/10 dark:bg-[#EA580C]/15',
    badgeText: 'text-[#C2410C] dark:text-[#EA580C] border border-[#C2410C]/25 dark:border-[#EA580C]/30 font-medium',
    btnPrimary: 'bg-[#C2410C] hover:bg-[#9A3412] dark:bg-[#EA580C] dark:hover:bg-[#C2410C] text-white font-medium rounded-lg shadow-xs',
    btnSecondary: 'bg-[#FAFAF9] hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 border border-[#E5E5E5] dark:border-stone-700 rounded-lg',
    divider: 'border-[#E5E5E5] dark:border-white/10',
    fontFamily: 'font-sans',
    pillTheme: 'bg-stone-100 dark:bg-stone-800 text-[#C2410C] dark:text-[#EA580C]',
    coverFallback: 'bg-[#FAFAF9] dark:bg-[#1C1917]',
    accentRim: 'bg-gradient-to-r from-transparent via-[#C2410C] to-transparent'
  },
  cyber: {
    id: 'cyber',
    name: 'Developer Terminal',
    tag: 'Developer',
    description: 'Clean modern developer identity with crisp emerald accents and high readability',
    previewClass: 'bg-[#F4F4F5] dark:bg-[#09090B] border-[#E4E4E7] dark:border-[#27272A] text-slate-900 dark:text-[#10B981]',
    pageBg: 'bg-[#F4F4F5] dark:bg-[#09090B]',
    headerBg: 'bg-white/95 dark:bg-[#09090B]/95 border-[#E4E4E7] dark:border-[#27272A]',
    container: 'bg-white dark:bg-[#18181B] text-slate-900 dark:text-zinc-100 border border-[#E4E4E7] dark:border-[#27272A] shadow-sm rounded-xl',
    cardBg: 'bg-white dark:bg-[#18181B]',
    cardBorder: 'border-[#E4E4E7] dark:border-[#27272A]',
    subCardBg: 'bg-[#F4F4F5] dark:bg-[#121215]',
    subCardBorder: 'border-[#E4E4E7] dark:border-[#27272A]',
    hoverBorder: 'hover:border-[#059669]/60 dark:hover:border-[#10B981]/70',
    textPrimary: 'text-slate-900 dark:text-zinc-100 font-sans',
    textSecondary: 'text-slate-600 dark:text-zinc-400',
    textMuted: 'text-slate-400 dark:text-zinc-500',
    accentText: 'text-[#059669] dark:text-[#10B981]',
    badgeBg: 'bg-[#059669]/10 dark:bg-[#10B981]/10',
    badgeText: 'text-[#059669] dark:text-[#10B981] border border-[#059669]/20 dark:border-[#10B981]/30 font-medium text-xs',
    btnPrimary: 'bg-[#059669] hover:bg-[#047857] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white dark:text-black font-semibold rounded-lg shadow-xs',
    btnSecondary: 'bg-[#F4F4F5] hover:bg-slate-200 dark:bg-[#27272A] dark:hover:bg-zinc-700 text-slate-900 dark:text-zinc-100 border border-[#E4E4E7] dark:border-[#3F3F46] rounded-lg',
    divider: 'border-[#E4E4E7] dark:border-[#27272A]',
    fontFamily: 'font-sans',
    pillTheme: 'bg-emerald-50 dark:bg-zinc-800 text-[#059669] dark:text-[#10B981]',
    coverFallback: 'bg-[#F4F4F5] dark:bg-[#18181B]',
    accentRim: 'bg-gradient-to-r from-transparent via-[#10B981] to-transparent'
  },
  luxe: {
    id: 'luxe',
    name: 'Luxe Velvet',
    tag: 'Executive',
    description: 'Rich, bold, and premium with deep burgundy backdrop and restrained rose accents',
    previewClass: 'bg-[#FAF5F0] dark:bg-[#0D0509] border-[#EADFD5] dark:border-[#4C1D38] text-rose-950 dark:text-[#FB7185]',
    pageBg: 'bg-[#FAF5F0] dark:bg-[#0D0509]',
    headerBg: 'bg-[#FAF5F0]/95 dark:bg-[#0D0509]/95 border-[#EADFD5] dark:border-[#4C1D38]',
    container: 'bg-white dark:bg-[#1A0C14] text-rose-950 dark:text-rose-50 border border-[#EADFD5] dark:border-[#4C1D38] shadow-sm rounded-2xl',
    cardBg: 'bg-white dark:bg-[#1A0C14]',
    cardBorder: 'border-[#EADFD5] dark:border-[#4C1D38]',
    subCardBg: 'bg-[#FAF5F0] dark:bg-[#14080F]',
    subCardBorder: 'border-[#EADFD5] dark:border-[#4C1D38]',
    hoverBorder: 'hover:border-[#BE123C]/60 dark:hover:border-[#FB7185]/70',
    textPrimary: 'text-rose-950 dark:text-rose-50 font-sans tracking-tight',
    textSecondary: 'text-rose-800/80 dark:text-rose-200/70',
    textMuted: 'text-rose-500/70 dark:text-rose-300/40',
    accentText: 'text-[#BE123C] dark:text-[#FB7185]',
    badgeBg: 'bg-[#BE123C]/10 dark:bg-[#E11D48]/15',
    badgeText: 'text-[#BE123C] dark:text-[#FB7185] border border-[#BE123C]/20 dark:border-[#E11D48]/30 font-medium rounded-full',
    btnPrimary: 'bg-[#BE123C] hover:bg-[#9F1239] dark:bg-gradient-to-r dark:from-[#E11D48] dark:to-[#FB7185] text-white font-semibold rounded-full shadow-xs',
    btnSecondary: 'bg-[#FAF5F0] hover:bg-rose-100 dark:bg-[#4C1D38]/50 dark:hover:bg-[#4C1D38]/80 text-rose-950 dark:text-rose-100 border border-[#EADFD5] dark:border-[#4C1D38] rounded-full',
    divider: 'border-[#EADFD5] dark:border-[#4C1D38]',
    fontFamily: 'font-sans',
    pillTheme: 'bg-rose-100 dark:bg-[#4C1D38] text-[#BE123C] dark:text-[#FB7185]',
    coverFallback: 'bg-[#FAF5F0] dark:bg-[#1A0C14]',
    accentRim: 'bg-gradient-to-r from-transparent via-[#BE123C] to-transparent'
  },
  gradient: {
    id: 'gradient',
    name: 'Vibrant Gradient',
    tag: 'Gradient',
    description: 'Modern fluid purple-to-indigo gradient with high-contrast glowing cards',
    previewClass: 'bg-gradient-to-br from-violet-600 to-indigo-900 border-violet-400 text-white',
    pageBg: 'bg-gradient-to-br from-violet-950 via-slate-900 to-indigo-950 text-white',
    headerBg: 'bg-violet-950/90 dark:bg-violet-950/90 border-white/10',
    container: 'bg-slate-900/90 dark:bg-slate-900/90 text-white border border-violet-500/30 shadow-2xl shadow-violet-500/10 rounded-2xl',
    cardBg: 'bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur-md',
    cardBorder: 'border-violet-500/30 dark:border-violet-500/30',
    subCardBg: 'bg-violet-950/40 dark:bg-violet-950/40',
    subCardBorder: 'border-violet-500/20 dark:border-violet-500/20',
    hoverBorder: 'hover:border-violet-400 dark:hover:border-violet-300',
    textPrimary: 'text-white font-sans',
    textSecondary: 'text-violet-200/80',
    textMuted: 'text-violet-300/60',
    accentText: 'text-violet-400',
    badgeBg: 'bg-violet-500/20',
    badgeText: 'text-violet-300 border border-violet-500/30',
    btnPrimary: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-md',
    btnSecondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl',
    divider: 'border-violet-500/20',
    fontFamily: 'font-sans',
    pillTheme: 'bg-violet-900/60 text-violet-200',
    coverFallback: 'bg-gradient-to-r from-violet-800 to-indigo-900',
    accentRim: 'bg-gradient-to-r from-transparent via-violet-400 to-transparent'
  },
  soft: {
    id: 'soft',
    name: 'Soft Pastel',
    tag: 'Soft',
    description: 'Light, friendly aesthetic with soft sky and lavender tones and rounded pill cards',
    previewClass: 'bg-[#F0F4F8] border-sky-300 text-sky-950',
    pageBg: 'bg-[#F0F4F8] dark:bg-[#0E1520]',
    headerBg: 'bg-[#F0F4F8]/95 dark:bg-[#0E1520]/95 border-sky-200 dark:border-sky-900/40',
    container: 'bg-white dark:bg-[#141E2D] text-slate-900 dark:text-slate-100 border border-sky-100 dark:border-sky-900/40 shadow-sm rounded-2xl',
    cardBg: 'bg-white dark:bg-[#141E2D]',
    cardBorder: 'border-sky-100 dark:border-sky-900/40',
    subCardBg: 'bg-sky-50/50 dark:bg-[#192435]',
    subCardBorder: 'border-sky-100 dark:border-sky-900/30',
    hoverBorder: 'hover:border-sky-400 dark:hover:border-sky-500',
    textPrimary: 'text-slate-900 dark:text-slate-100 font-sans',
    textSecondary: 'text-slate-600 dark:text-slate-400',
    textMuted: 'text-slate-400 dark:text-slate-500',
    accentText: 'text-sky-600 dark:text-sky-400',
    badgeBg: 'bg-sky-100 dark:bg-sky-950/70',
    badgeText: 'text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
    btnPrimary: 'bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl shadow-xs',
    btnSecondary: 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 dark:hover:bg-sky-900/60 text-sky-900 dark:text-sky-200 border border-sky-200 dark:border-sky-800 rounded-xl',
    divider: 'border-sky-100 dark:border-sky-900/40',
    fontFamily: 'font-sans',
    pillTheme: 'bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-200',
    coverFallback: 'bg-sky-100 dark:bg-[#141E2D]',
    accentRim: 'bg-gradient-to-r from-transparent via-sky-400 to-transparent'
  }
};

export function getThemeConfig(theme?: ProfileTheme | string): ThemeConfig {
  if (!theme || theme === 'default' || theme === 'editorial') {
    return PROFILE_THEMES.editorial;
  }
  if (theme === 'cyber' || (theme as any) === 'developer') {
    return PROFILE_THEMES.cyber;
  }
  if (theme === 'luxe') {
    return PROFILE_THEMES.luxe;
  }
  if (theme === 'gradient') {
    return PROFILE_THEMES.gradient;
  }
  if (theme === 'soft') {
    return PROFILE_THEMES.soft;
  }
  return PROFILE_THEMES[theme as ProfileTheme] || PROFILE_THEMES.editorial;
}



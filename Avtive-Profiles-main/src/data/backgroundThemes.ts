export interface BackgroundTheme {
  id: string;
  name: string;
  category: 'gradients' | 'dark' | 'light' | 'patterns' | 'textured' | 'creative';
  categoryLabel: string;
  description: string;
  isDark: boolean;
  previewClass: string;
  backgroundStyle: React.CSSProperties;
  accentColor: string;
}

export const BACKGROUND_THEME_CATEGORIES = [
  { id: 'all', label: 'All Themes' },
  { id: 'gradients', label: 'Gradients' },
  { id: 'dark', label: 'Dark Professional' },
  { id: 'light', label: 'Minimal Light' },
  { id: 'patterns', label: 'Abstract Patterns' },
  { id: 'textured', label: 'Soft Textured' },
  { id: 'creative', label: 'Modern Creative' },
] as const;

export const BACKGROUND_THEMES: BackgroundTheme[] = [
  // ── Elegant Gradients ───────────────────────────────────────────────────────
  {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    category: 'gradients',
    categoryLabel: 'Elegant Gradient',
    description: 'Ethereal northern lights gradient with soft emerald and deep indigo luminescence.',
    isDark: true,
    accentColor: '#10B981',
    previewClass: 'bg-gradient-to-tr from-slate-950 via-emerald-950 to-indigo-950',
    backgroundStyle: {
      backgroundColor: '#050B14',
      backgroundImage: `
        radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.25) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.3) 0px, transparent 50%),
        radial-gradient(at 50% 100%, rgba(6, 78, 59, 0.25) 0px, transparent 60%),
        linear-gradient(135deg, #030712 0%, #061426 50%, #030712 100%)
      `,
      backgroundAttachment: 'fixed'
    }
  },
  {
    id: 'sunset-amber',
    name: 'Sunset Horizon',
    category: 'gradients',
    categoryLabel: 'Elegant Gradient',
    description: 'Warm dusk twilight blending deep twilight navy with soft rose and golden amber.',
    isDark: true,
    accentColor: '#F59E0B',
    previewClass: 'bg-gradient-to-tr from-slate-950 via-purple-950 to-amber-950',
    backgroundStyle: {
      backgroundColor: '#0A0714',
      backgroundImage: `
        radial-gradient(at 90% 10%, rgba(245, 158, 11, 0.22) 0px, transparent 45%),
        radial-gradient(at 10% 90%, rgba(244, 63, 94, 0.2) 0px, transparent 50%),
        radial-gradient(at 50% 50%, rgba(124, 58, 237, 0.18) 0px, transparent 60%),
        linear-gradient(180deg, #07040F 0%, #120A21 50%, #07040F 100%)
      `,
      backgroundAttachment: 'fixed'
    }
  },
  {
    id: 'midnight-nebula',
    name: 'Midnight Nebula',
    category: 'gradients',
    categoryLabel: 'Elegant Gradient',
    description: 'Deep celestial sapphire with radial luminescence and soft violet aura.',
    isDark: true,
    accentColor: '#8B5CF6',
    previewClass: 'bg-gradient-to-tr from-black via-indigo-950 to-violet-950',
    backgroundStyle: {
      backgroundColor: '#030308',
      backgroundImage: `
        radial-gradient(at 20% 20%, rgba(139, 92, 246, 0.28) 0px, transparent 50%),
        radial-gradient(at 80% 80%, rgba(59, 130, 246, 0.25) 0px, transparent 50%),
        linear-gradient(135deg, #030308 0%, #090B1E 60%, #020205 100%)
      `,
      backgroundAttachment: 'fixed'
    }
  },
  {
    id: 'royal-amethyst',
    name: 'Royal Amethyst',
    category: 'gradients',
    categoryLabel: 'Elegant Gradient',
    description: 'Opulent velvet violet with wine-magenta undertones and soft dark shading.',
    isDark: true,
    accentColor: '#C084FC',
    previewClass: 'bg-gradient-to-tr from-slate-950 via-purple-950 to-fuchsia-950',
    backgroundStyle: {
      backgroundColor: '#080310',
      backgroundImage: `
        radial-gradient(at 50% 0%, rgba(192, 132, 252, 0.2) 0px, transparent 60%),
        radial-gradient(at 100% 100%, rgba(217, 70, 239, 0.15) 0px, transparent 50%),
        linear-gradient(180deg, #090214 0%, #16072C 50%, #090214 100%)
      `,
      backgroundAttachment: 'fixed'
    }
  },

  // ── Dark Professional ───────────────────────────────────────────────────────
  {
    id: 'obsidian-grid',
    name: 'Obsidian Mesh',
    category: 'dark',
    categoryLabel: 'Dark Professional',
    description: 'Deep obsidian black with an ultra-fine high-precision technical grid matrix.',
    isDark: true,
    accentColor: '#38BDF8',
    previewClass: 'bg-neutral-950 border border-neutral-800',
    backgroundStyle: {
      backgroundColor: '#09090B',
      backgroundImage: `
        linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
        radial-gradient(at 50% 0%, rgba(56, 189, 248, 0.12) 0px, transparent 60%)
      `,
      backgroundSize: '32px 32px, 32px 32px, 100% 100%',
      backgroundAttachment: 'fixed'
    }
  },
  {
    id: 'slate-architect',
    name: 'Slate Architect',
    category: 'dark',
    categoryLabel: 'Dark Professional',
    description: 'Executive graphite slate with subtle structured diagonal micro-stripes.',
    isDark: true,
    accentColor: '#94A3B8',
    previewClass: 'bg-slate-950 border border-slate-800',
    backgroundStyle: {
      backgroundColor: '#0B0F17',
      backgroundImage: `
        repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.02) 0, rgba(255, 255, 255, 0.02) 1px, transparent 0, transparent 18px),
        linear-gradient(180deg, #0A0E17 0%, #111827 50%, #0A0E17 100%)
      `,
      backgroundAttachment: 'fixed'
    }
  },
  {
    id: 'titanium-noir',
    name: 'Titanium Noir',
    category: 'dark',
    categoryLabel: 'Dark Professional',
    description: 'Burnished metallic titanium sheen with subtle vignette depth.',
    isDark: true,
    accentColor: '#CBD5E1',
    previewClass: 'bg-zinc-950 border border-zinc-800',
    backgroundStyle: {
      backgroundColor: '#09090C',
      backgroundImage: `
        radial-gradient(circle at 50% 30%, rgba(203, 213, 225, 0.08) 0%, transparent 70%),
        linear-gradient(135deg, #060608 0%, #121217 50%, #060608 100%)
      `,
      backgroundAttachment: 'fixed'
    }
  },

  // ── Minimal Light ───────────────────────────────────────────────────────────
  {
    id: 'alabaster-canvas',
    name: 'Alabaster Canvas',
    category: 'light',
    categoryLabel: 'Minimal Light',
    description: 'Crisp alabaster paper tone with micro-dot texture and soft warm pearl rim.',
    isDark: false,
    accentColor: '#0F172A',
    previewClass: 'bg-stone-50 border border-stone-200 text-stone-900',
    backgroundStyle: {
      backgroundColor: '#FAFAF9',
      backgroundImage: `
        radial-gradient(rgba(15, 23, 42, 0.06) 1px, transparent 1px),
        linear-gradient(180deg, #FFFFFF 0%, #F5F5F4 100%)
      `,
      backgroundSize: '20px 20px, 100% 100%',
      backgroundAttachment: 'fixed'
    }
  },
  {
    id: 'soft-linen',
    name: 'Soft Linen',
    category: 'light',
    categoryLabel: 'Minimal Light',
    description: 'Warm natural ecru weave with subtle cross-hatch texture for a tactile aesthetic.',
    isDark: false,
    accentColor: '#78716C',
    previewClass: 'bg-amber-50/50 border border-amber-200/60 text-stone-900',
    backgroundStyle: {
      backgroundColor: '#F8F7F4',
      backgroundImage: `
        linear-gradient(rgba(120, 113, 108, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(120, 113, 108, 0.03) 1px, transparent 1px),
        linear-gradient(180deg, #FBFBF9 0%, #F4F1EC 100%)
      `,
      backgroundSize: '16px 16px, 16px 16px, 100% 100%',
      backgroundAttachment: 'fixed'
    }
  },
  {
    id: 'frosted-pearl',
    name: 'Frosted Pearl',
    category: 'light',
    categoryLabel: 'Minimal Light',
    description: 'Clean modern glass aesthetic with delicate cyan-rose dispersion glow.',
    isDark: false,
    accentColor: '#0284C7',
    previewClass: 'bg-slate-100 border border-sky-200 text-slate-900',
    backgroundStyle: {
      backgroundColor: '#F0F4F8',
      backgroundImage: `
        radial-gradient(at 10% 10%, rgba(56, 189, 248, 0.12) 0px, transparent 50%),
        radial-gradient(at 90% 90%, rgba(244, 114, 182, 0.1) 0px, transparent 50%),
        linear-gradient(180deg, #F8FAFC 0%, #EBF3FA 100%)
      `,
      backgroundAttachment: 'fixed'
    }
  },

  // ── Abstract Patterns ───────────────────────────────────────────────────────
  {
    id: 'topographic-flow',
    name: 'Topographic Flow',
    category: 'patterns',
    categoryLabel: 'Abstract Pattern',
    description: 'Contour elevation lines with an organic architectural terrain flow.',
    isDark: true,
    accentColor: '#14B8A6',
    previewClass: 'bg-slate-950 border border-teal-900/40',
    backgroundStyle: {
      backgroundColor: '#070F14',
      backgroundImage: `
        radial-gradient(ellipse at 30% 20%, rgba(20, 184, 166, 0.15) 0%, transparent 60%),
        radial-gradient(ellipse at 70% 80%, rgba(14, 116, 144, 0.15) 0%, transparent 60%),
        repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 24px, rgba(20, 184, 166, 0.035) 25px, transparent 26px),
        linear-gradient(180deg, #050B0E 0%, #0A161E 100%)
      `,
      backgroundAttachment: 'fixed'
    }
  },
  {
    id: 'constellation-stars',
    name: 'Constellation',
    category: 'patterns',
    categoryLabel: 'Abstract Pattern',
    description: 'Star-chart dots and interconnected navigation vertices in deep cosmic night.',
    isDark: true,
    accentColor: '#38BDF8',
    previewClass: 'bg-black border border-sky-950',
    backgroundStyle: {
      backgroundColor: '#040711',
      backgroundImage: `
        radial-gradient(circle at 15% 25%, rgba(56, 189, 248, 0.2) 0%, transparent 40%),
        radial-gradient(circle at 85% 75%, rgba(168, 85, 247, 0.18) 0%, transparent 40%),
        radial-gradient(rgba(255, 255, 255, 0.12) 1.5px, transparent 1.5px),
        radial-gradient(rgba(56, 189, 248, 0.15) 1px, transparent 1px),
        linear-gradient(180deg, #03060E 0%, #080F23 100%)
      `,
      backgroundSize: '100% 100%, 100% 100%, 48px 48px, 24px 24px, 100% 100%',
      backgroundAttachment: 'fixed'
    }
  },
  {
    id: 'geometric-cubes',
    name: 'Isometric Vector',
    category: 'patterns',
    categoryLabel: 'Abstract Pattern',
    description: 'Isometric 3D geometric wireframe matrix with subtle depth perspective.',
    isDark: true,
    accentColor: '#6366F1',
    previewClass: 'bg-slate-950 border border-indigo-900/40',
    backgroundStyle: {
      backgroundColor: '#090B14',
      backgroundImage: `
        linear-gradient(60deg, rgba(99, 102, 241, 0.04) 1px, transparent 1px),
        linear-gradient(120deg, rgba(99, 102, 241, 0.04) 1px, transparent 1px),
        linear-gradient(0deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px),
        linear-gradient(180deg, #06070D 0%, #101426 100%)
      `,
      backgroundSize: '40px 69.28px, 40px 69.28px, 40px 69.28px, 100% 100%',
      backgroundAttachment: 'fixed'
    }
  },

  // ── Soft Textured ───────────────────────────────────────────────────────────
  {
    id: 'velvet-dusk',
    name: 'Velvet Dusk',
    category: 'textured',
    categoryLabel: 'Soft Textured',
    description: 'Deep tactile velvet texture with heavy shadow depth and subtle rosewood tint.',
    isDark: true,
    accentColor: '#FB7185',
    previewClass: 'bg-[#150A10] border border-rose-950',
    backgroundStyle: {
      backgroundColor: '#0F060B',
      backgroundImage: `
        radial-gradient(at 50% 10%, rgba(251, 113, 133, 0.14) 0px, transparent 50%),
        radial-gradient(at 90% 90%, rgba(136, 19, 55, 0.18) 0px, transparent 50%),
        linear-gradient(180deg, #0F060B 0%, #1D0B16 50%, #0F060B 100%)
      `,
      backgroundAttachment: 'fixed'
    }
  },
  {
    id: 'emerald-luxury',
    name: 'Emerald Silk',
    category: 'textured',
    categoryLabel: 'Soft Textured',
    description: 'Deep jewel-tone dark emerald with flowing silk light contours.',
    isDark: true,
    accentColor: '#34D399',
    previewClass: 'bg-[#04120D] border border-emerald-950',
    backgroundStyle: {
      backgroundColor: '#030E0A',
      backgroundImage: `
        radial-gradient(at 20% 0%, rgba(52, 211, 153, 0.18) 0px, transparent 50%),
        radial-gradient(at 80% 100%, rgba(5, 150, 105, 0.15) 0px, transparent 50%),
        linear-gradient(145deg, #020A07 0%, #08241A 50%, #020A07 100%)
      `,
      backgroundAttachment: 'fixed'
    }
  },

  // ── Modern Creative ─────────────────────────────────────────────────────────
  {
    id: 'cyber-synthwave',
    name: 'Cyber Horizon',
    category: 'creative',
    categoryLabel: 'Modern Creative',
    description: 'Futuristic electric grid with neon cyan and magenta horizon glow.',
    isDark: true,
    accentColor: '#06B6D4',
    previewClass: 'bg-slate-950 border border-cyan-800/40',
    backgroundStyle: {
      backgroundColor: '#06060F',
      backgroundImage: `
        linear-gradient(to right, rgba(6, 182, 212, 0.08) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(236, 72, 153, 0.06) 1px, transparent 1px),
        radial-gradient(at 50% 0%, rgba(6, 182, 212, 0.22) 0px, transparent 55%),
        radial-gradient(at 50% 100%, rgba(236, 72, 153, 0.18) 0px, transparent 55%),
        linear-gradient(180deg, #04040A 0%, #0C0C1E 100%)
      `,
      backgroundSize: '36px 36px, 36px 36px, 100% 100%, 100% 100%, 100% 100%',
      backgroundAttachment: 'fixed'
    }
  },
  {
    id: 'prismatic-hologram',
    name: 'Prismatic Glass',
    category: 'creative',
    categoryLabel: 'Modern Creative',
    description: 'Holographic chromatic light refractions across obsidian tinted crystal.',
    isDark: true,
    accentColor: '#A78BFA',
    previewClass: 'bg-black border border-violet-900/40',
    backgroundStyle: {
      backgroundColor: '#05050A',
      backgroundImage: `
        radial-gradient(at 0% 50%, rgba(236, 72, 153, 0.15) 0px, transparent 40%),
        radial-gradient(at 100% 50%, rgba(6, 182, 212, 0.15) 0px, transparent 40%),
        radial-gradient(at 50% 0%, rgba(168, 85, 247, 0.2) 0px, transparent 50%),
        radial-gradient(at 50% 100%, rgba(234, 179, 8, 0.12) 0px, transparent 50%),
        linear-gradient(180deg, #020205 0%, #090914 100%)
      `,
      backgroundAttachment: 'fixed'
    }
  }
];

export function getBackgroundTheme(id?: string | null): BackgroundTheme | null {
  if (!id) return null;
  return BACKGROUND_THEMES.find(t => t.id === id) || null;
}

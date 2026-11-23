export type BackgroundThemeCategory = 'all' | 'occasions' | 'festivals' | 'celebrations' | 'everyday';

export interface BackgroundTheme {
  id: string;
  name: string;
  category: BackgroundThemeCategory | string;
  categoryLabel: string;
  description: string;
  isDark: boolean;
  previewClass: string;
  backgroundStyle: React.CSSProperties;
  accentColor: string;
  iconName?: string;
}

export const BACKGROUND_THEME_CATEGORIES = [
  { id: 'all', label: 'All Themes', icon: 'LayoutGrid' },
  { id: 'occasions', label: 'Occasions', icon: 'CalendarDays' },
  { id: 'festivals', label: 'Festivals', icon: 'Flame' },
  { id: 'celebrations', label: 'Celebrations', icon: 'PartyPopper' },
  { id: 'everyday', label: 'Everyday', icon: 'Palette' },
] as const;

function encodeSvg(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg.trim())}")`;
}

export const BACKGROUND_THEMES: BackgroundTheme[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // ── OCCASIONS & FESTIVALS ──────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. Christmas
  {
    id: 'christmas-wonderland',
    name: 'Christmas',
    category: 'festivals',
    categoryLabel: 'Festivals',
    description: 'Christmas trees, delicate snowflakes, warm glowing star lights, and holiday pine ornaments.',
    isDark: true,
    accentColor: '#10B981',
    iconName: 'Snowflake',
    previewClass: 'bg-emerald-950 border border-emerald-800',
    backgroundStyle: {
      backgroundColor: '#031008',
      backgroundImage: `
        ${encodeSvg(`
          <svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <!-- Christmas Pine Tree 1 -->
            <polygon points="35,15 25,30 45,30" fill="rgba(16,185,129,0.3)"/>
            <polygon points="35,25 20,42 50,42" fill="rgba(16,185,129,0.35)"/>
            <polygon points="35,37 15,55 55,55" fill="rgba(16,185,129,0.4)"/>
            <rect x="33" y="55" width="4" height="6" fill="rgba(180,83,9,0.4)"/>
            <polygon points="35,11 36.5,14 40,14 37,16 38,19 35,17 32,19 33,16 30,14 33.5,14" fill="#FBBF24"/>
            <!-- Christmas Pine Tree 2 -->
            <polygon points="105,80 98,92 112,92" fill="rgba(16,185,129,0.25)"/>
            <polygon points="105,88 94,102 116,102" fill="rgba(16,185,129,0.3)"/>
            <polygon points="105,98 90,114 120,114" fill="rgba(16,185,129,0.35)"/>
            <rect x="103" y="114" width="4" height="5" fill="rgba(180,83,9,0.35)"/>
            <polygon points="105,77 106,79 109,79 107,81 108,83 105,82 102,83 103,81 101,79 104,79" fill="#FBBF24"/>
            <!-- 6-Point Snowflake 1 -->
            <g stroke="rgba(255,255,255,0.45)" stroke-width="1" stroke-linecap="round">
              <line x1="95" y1="20" x2="95" y2="36"/>
              <line x1="87" y1="28" x2="103" y2="28"/>
              <line x1="89" y1="22" x2="101" y2="34"/>
              <line x1="89" y1="34" x2="101" y2="22"/>
              <circle cx="95" cy="28" r="1.5" fill="rgba(255,255,255,0.6)"/>
            </g>
            <!-- Snowflake 2 -->
            <g stroke="rgba(255,255,255,0.35)" stroke-width="0.8" stroke-linecap="round">
              <line x1="25" y1="95" x2="25" y2="107"/>
              <line x1="19" y1="101" x2="31" y2="101"/>
              <line x1="21" y1="97" x2="29" y2="105"/>
              <line x1="21" y1="105" x2="29" y2="97"/>
            </g>
            <!-- Hanging Bauble Ornament -->
            <line x1="68" y1="0" x2="68" y2="18" stroke="rgba(245,158,11,0.5)" stroke-width="0.8"/>
            <circle cx="68" cy="23" r="5" fill="rgba(239,68,68,0.45)" stroke="rgba(245,158,11,0.6)" stroke-width="0.8"/>
            <!-- Golden Sparkle Lights -->
            <circle cx="125" cy="45" r="1.5" fill="#FDE047"/>
            <circle cx="60" cy="80" r="1.2" fill="#FDE047"/>
            <circle cx="10" cy="65" r="1.5" fill="rgba(255,255,255,0.5)"/>
            <circle cx="78" cy="125" r="1.5" fill="#FDE047"/>
          </svg>
        `)},
        radial-gradient(at 15% 15%, rgba(16, 185, 129, 0.22) 0px, transparent 55%),
        radial-gradient(at 85% 85%, rgba(245, 158, 11, 0.16) 0px, transparent 50%),
        radial-gradient(at 50% 50%, rgba(239, 68, 68, 0.12) 0px, transparent 60%),
        linear-gradient(180deg, #020A05 0%, #061F12 50%, #020B06 100%)
      `,
      backgroundSize: '140px 140px, 100% 100%, 100% 100%, 100% 100%, 100% 100%',
      backgroundAttachment: 'fixed'
    }
  },

  // 2. Halloween
  {
    id: 'halloween-night',
    name: 'Halloween',
    category: 'occasions',
    categoryLabel: 'Occasions',
    description: 'Carved pumpkins, silhouette bats, eerie glowing moonlight, and atmospheric mist.',
    isDark: true,
    accentColor: '#F97316',
    iconName: 'Moon',
    previewClass: 'bg-purple-950 border border-orange-800',
    backgroundStyle: {
      backgroundColor: '#06020C',
      backgroundImage: `
        ${encodeSvg(`
          <svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <!-- Flying Bat 1 -->
            <path d="M25,30 Q32,22 40,28 Q43,24 46,28 Q54,22 61,30 Q53,35 47,33 Q43,38 39,33 Q33,35 25,30 Z" fill="rgba(249,115,22,0.45)"/>
            <!-- Flying Bat 2 -->
            <path d="M95,85 Q100,79 106,83 Q108,80 110,83 Q116,79 121,85 Q115,88 111,87 Q108,91 105,87 Q100,88 95,85 Z" fill="rgba(168,85,247,0.45)"/>
            <!-- Carved Jack-O-Lantern Pumpkin Silhouette -->
            <g transform="translate(78, 18)">
              <ellipse cx="25" cy="22" rx="20" ry="16" fill="rgba(249,115,22,0.38)" stroke="rgba(249,115,22,0.65)" stroke-width="1"/>
              <path d="M23,6 Q25,2 29,4 L27,8 Z" fill="#65A30D"/>
              <polygon points="17,17 21,17 19,13" fill="#FEF08A"/>
              <polygon points="29,17 33,17 31,13" fill="#FEF08A"/>
              <path d="M16,24 Q20,30 25,30 Q30,30 34,24 Q30,27 25,26 Q20,27 16,24 Z" fill="#FEF08A"/>
            </g>
            <!-- Spooky Cobweb in corner -->
            <g stroke="rgba(255,255,255,0.18)" stroke-width="0.8">
              <line x1="0" y1="140" x2="35" y2="105"/>
              <line x1="0" y1="120" x2="35" y2="105"/>
              <line x1="20" y1="140" x2="35" y2="105"/>
              <path d="M10,135 Q18,128 25,135" fill="none"/>
              <path d="M18,125 Q25,120 30,126" fill="none"/>
            </g>
            <!-- Crescent moon glint -->
            <path d="M25,75 A10,10 0 0 0 35,65 A12,12 0 1 1 25,75 Z" fill="rgba(254,240,138,0.5)"/>
            <!-- Stars -->
            <circle cx="70" cy="90" r="1.2" fill="#FEF08A"/>
            <circle cx="15" cy="15" r="1" fill="rgba(255,255,255,0.4)"/>
            <circle cx="130" cy="115" r="1.2" fill="#F97316"/>
          </svg>
        `)},
        radial-gradient(at 80% 20%, rgba(249, 115, 22, 0.2) 0px, transparent 50%),
        radial-gradient(at 20% 80%, rgba(168, 85, 247, 0.22) 0px, transparent 50%),
        linear-gradient(180deg, #07020E 0%, #150624 50%, #06020C 100%)
      `,
      backgroundSize: '140px 140px, 100% 100%, 100% 100%, 100% 100%',
      backgroundAttachment: 'fixed'
    }
  },

  // 3. Eid Mubarak (Eid ul-Fitr)
  {
    id: 'eid-mubarak',
    name: 'Eid Mubarak',
    category: 'festivals',
    categoryLabel: 'Festivals',
    description: 'Luminous crescent moon, ornate hanging lanterns, and gold arabesque lattice.',
    isDark: true,
    accentColor: '#EAB308',
    iconName: 'Moon',
    previewClass: 'bg-emerald-950 border border-amber-600',
    backgroundStyle: {
      backgroundColor: '#02120B',
      backgroundImage: `
        ${encodeSvg(`
          <svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <!-- Ornate Hanging Fanous Lantern 1 -->
            <line x1="35" y1="0" x2="35" y2="20" stroke="rgba(234,179,8,0.6)" stroke-width="0.8"/>
            <polygon points="35,20 28,26 42,26" fill="rgba(234,179,8,0.5)"/>
            <rect x="29" y="26" width="12" height="16" rx="2" fill="rgba(234,179,8,0.25)" stroke="rgba(234,179,8,0.7)" stroke-width="0.8"/>
            <polygon points="35,47 28,42 42,42" fill="rgba(234,179,8,0.5)"/>
            <circle cx="35" cy="50" r="1.5" fill="#FBBF24"/>
            <ellipse cx="35" cy="34" rx="2" ry="3.5" fill="#FEF08A"/>
            <!-- Crescent Moon & Islamic 8-Point Star -->
            <g transform="translate(85, 30)">
              <path d="M22,5 A16,16 0 0 0 36,25 A18,18 0 1 1 22,5 Z" fill="rgba(234,179,8,0.55)"/>
              <g transform="translate(18, 14) scale(0.7)">
                <polygon points="10,0 12,7 19,3 15,9 20,15 13,14 10,20 7,14 0,15 5,9 1,3 8,7" fill="#FDE047"/>
              </g>
            </g>
            <!-- Hanging Lantern 2 (Smaller) -->
            <line x1="110" y1="80" x2="110" y2="95" stroke="rgba(234,179,8,0.5)" stroke-width="0.7"/>
            <polygon points="110,95 105,99 115,99" fill="rgba(234,179,8,0.4)"/>
            <rect x="106" y="99" width="8" height="11" rx="1.5" fill="rgba(234,179,8,0.2)" stroke="rgba(234,179,8,0.6)" stroke-width="0.7"/>
            <polygon points="110,114 105,110 115,110" fill="rgba(234,179,8,0.4)"/>
            <ellipse cx="110" cy="104.5" rx="1.2" ry="2.2" fill="#FEF08A"/>
            <!-- Arabesque Geometric Lattice Motif -->
            <g stroke="rgba(234,179,8,0.2)" stroke-width="0.7" fill="none">
              <polygon points="35,95 47,107 35,119 23,107"/>
              <circle cx="35" cy="107" r="5"/>
            </g>
            <!-- Twinkling Stars -->
            <circle cx="15" cy="75" r="1.2" fill="#FDE047"/>
            <circle cx="70" cy="15" r="1.2" fill="#FDE047"/>
            <circle cx="80" cy="110" r="1.2" fill="#FDE047"/>
          </svg>
        `)},
        radial-gradient(at 80% 25%, rgba(234, 179, 8, 0.24) 0px, transparent 55%),
        radial-gradient(at 20% 75%, rgba(16, 185, 129, 0.22) 0px, transparent 50%),
        linear-gradient(135deg, #010C07 0%, #05261A 50%, #010B07 100%)
      `,
      backgroundSize: '140px 140px, 100% 100%, 100% 100%, 100% 100%',
      backgroundAttachment: 'fixed'
    }
  },

  // 4. Eid ul-Adha
  {
    id: 'eid-al-adha',
    name: 'Eid ul-Adha',
    category: 'festivals',
    categoryLabel: 'Festivals',
    description: 'Royal sapphire tones with gold Islamic star mandalas, crescent, and festive illumination.',
    isDark: true,
    accentColor: '#38BDF8',
    iconName: 'Moon',
    previewClass: 'bg-indigo-950 border border-amber-600',
    backgroundStyle: {
      backgroundColor: '#030818',
      backgroundImage: `
        ${encodeSvg(`
          <svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 130 130">
            <!-- 8-Point Geometric Rosette Mandala -->
            <g transform="translate(65,65) scale(1.4)" stroke="rgba(234,179,8,0.25)" stroke-width="0.8" fill="rgba(234,179,8,0.06)">
              <rect x="-12" y="-12" width="24" height="24"/>
              <rect x="-12" y="-12" width="24" height="24" transform="rotate(45)"/>
              <circle cx="0" cy="0" r="8"/>
              <circle cx="0" cy="0" r="14" stroke-dasharray="2,2"/>
            </g>
            <!-- Hanging Crescent -->
            <path d="M20,15 A12,12 0 0 0 30,30 A14,14 0 1 1 20,15 Z" fill="rgba(234,179,8,0.4)"/>
            <!-- Subtle Gold Stars -->
            <circle cx="110" cy="20" r="1.5" fill="#FDE047"/>
            <circle cx="20" cy="110" r="1.5" fill="#FDE047"/>
            <circle cx="115" cy="115" r="1.2" fill="#38BDF8"/>
          </svg>
        `)},
        radial-gradient(at 50% 10%, rgba(56, 189, 248, 0.2) 0px, transparent 50%),
        radial-gradient(at 50% 90%, rgba(234, 179, 8, 0.18) 0px, transparent 50%),
        linear-gradient(180deg, #020612 0%, #071536 50%, #020614 100%)
      `,
      backgroundSize: '130px 130px, 100% 100%, 100% 100%, 100% 100%',
      backgroundAttachment: 'fixed'
    }
  },

  // 5. Ramadan Kareem
  {
    id: 'ramadan-kareem',
    name: 'Ramadan Kareem',
    category: 'festivals',
    categoryLabel: 'Festivals',
    description: 'Sacred twilight sky with filigree fanous lanterns, crescent moon, and peaceful celestial stars.',
    isDark: true,
    accentColor: '#A78BFA',
    iconName: 'Moon',
    previewClass: 'bg-slate-950 border border-violet-800',
    backgroundStyle: {
      backgroundColor: '#050514',
      backgroundImage: `
        ${encodeSvg(`
          <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
            <!-- Slender Hanging Fanous Lantern -->
            <line x1="30" y1="0" x2="30" y2="15" stroke="rgba(251,191,36,0.5)" stroke-width="0.8"/>
            <polygon points="30,15 24,20 36,20" fill="rgba(251,191,36,0.45)"/>
            <rect x="25" y="20" width="10" height="15" rx="1.5" fill="rgba(251,191,36,0.2)" stroke="rgba(251,191,36,0.6)" stroke-width="0.8"/>
            <polygon points="30,39 24,35 36,35" fill="rgba(251,191,36,0.45)"/>
            <ellipse cx="30" cy="27.5" rx="1.5" ry="3" fill="#FEF08A"/>
            <!-- Crescent Moon & Celestial Stars -->
            <path d="M80,25 A14,14 0 0 0 92,42 A16,16 0 1 1 80,25 Z" fill="rgba(251,191,36,0.5)"/>
            <!-- Subtle Islamic octagonal star tiles -->
            <g stroke="rgba(167,139,250,0.2)" stroke-width="0.6" fill="none">
              <rect x="52" y="72" width="16" height="16"/>
              <rect x="52" y="72" width="16" height="16" transform="rotate(45 60 80)"/>
            </g>
            <circle cx="100" cy="80" r="1.2" fill="#FEF08A"/>
            <circle cx="15" cy="85" r="1.2" fill="#A78BFA"/>
          </svg>
        `)},
        radial-gradient(at 75% 20%, rgba(251, 191, 36, 0.2) 0px, transparent 50%),
        radial-gradient(at 25% 80%, rgba(139, 92, 246, 0.22) 0px, transparent 50%),
        linear-gradient(180deg, #040410 0%, #0D0E29 50%, #03030D 100%)
      `,
      backgroundSize: '120px 120px, 100% 100%, 100% 100%, 100% 100%',
      backgroundAttachment: 'fixed'
    }
  },

  // 6. New Year
  {
    id: 'new-year-celebration',
    name: 'New Year',
    category: 'celebrations',
    categoryLabel: 'Celebrations',
    description: 'Dazzling firework bursts, champagne sparkles, confetti spirals, and midnight stars.',
    isDark: true,
    accentColor: '#FDE047',
    iconName: 'PartyPopper',
    previewClass: 'bg-black border border-yellow-600',
    backgroundStyle: {
      backgroundColor: '#020205',
      backgroundImage: `
        ${encodeSvg(`
          <svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <!-- Fireworks Starburst 1 -->
            <g stroke="rgba(253,224,71,0.5)" stroke-width="0.8" stroke-linecap="round">
              <line x1="45" y1="20" x2="45" y2="35"/>
              <line x1="45" y1="55" x2="45" y2="70"/>
              <line x1="20" y1="45" x2="35" y2="45"/>
              <line x1="55" y1="45" x2="70" y2="45"/>
              <line x1="27" y1="27" x2="38" y2="38"/>
              <line x1="52" y1="52" x2="63" y2="63"/>
              <line x1="27" y1="63" x2="38" y2="52"/>
              <line x1="52" y1="38" x2="63" y2="27"/>
              <circle cx="45" cy="45" r="2.5" fill="#FDE047"/>
            </g>
            <!-- Fireworks Starburst 2 (Cyan/Magenta) -->
            <g stroke="rgba(56,189,248,0.45)" stroke-width="0.8" stroke-linecap="round">
              <line x1="105" y1="85" x2="105" y2="95"/>
              <line x1="105" y1="115" x2="105" y2="125"/>
              <line x1="90" y1="105" x2="100" y2="105"/>
              <line x1="110" y1="105" x2="120" y2="105"/>
              <line x1="94" y1="94" x2="101" y2="101"/>
              <line x1="109" y1="109" x2="116" y2="116"/>
              <circle cx="105" cy="105" r="2" fill="#F43F5E"/>
            </g>
            <!-- Confetti Ribbons & Diamonds -->
            <rect x="95" y="25" width="4" height="6" rx="1" fill="#F43F5E" transform="rotate(25 95 25)"/>
            <rect x="25" y="105" width="5" height="4" rx="1" fill="#38BDF8" transform="rotate(-35 25 105)"/>
            <polygon points="120,40 122,44 126,44 123,47 124,51 120,49 116,51 117,47 114,44 118,44" fill="#FDE047"/>
            <circle cx="80" cy="75" r="1.5" fill="#FDE047"/>
            <circle cx="15" cy="65" r="1.2" fill="#F43F5E"/>
          </svg>
        `)},
        radial-gradient(at 30% 30%, rgba(253, 224, 71, 0.22) 0px, transparent 50%),
        radial-gradient(at 75% 75%, rgba(56, 189, 248, 0.2) 0px, transparent 50%),
        radial-gradient(at 80% 20%, rgba(244, 63, 94, 0.16) 0px, transparent 45%),
        linear-gradient(180deg, #020205 0%, #0B0B20 50%, #020205 100%)
      `,
      backgroundSize: '140px 140px, 100% 100%, 100% 100%, 100% 100%, 100% 100%',
      backgroundAttachment: 'fixed'
    }
  },

  // 7. Birthday Fiesta
  {
    id: 'birthday-fiesta',
    name: 'Birthday',
    category: 'celebrations',
    categoryLabel: 'Celebrations',
    description: 'Celebration party balloons, festive serpentine ribbons, bursting confetti, and party stars.',
    isDark: true,
    accentColor: '#F43F5E',
    iconName: 'Gift',
    previewClass: 'bg-indigo-950 border border-pink-700',
    backgroundStyle: {
      backgroundColor: '#060517',
      backgroundImage: `
        ${encodeSvg(`
          <svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 130 130">
            <!-- Balloon 1 (Coral) -->
            <ellipse cx="35" cy="30" rx="14" ry="17" fill="rgba(244,63,94,0.4)" stroke="rgba(244,63,94,0.7)" stroke-width="0.8"/>
            <polygon points="35,47 32,50 38,50" fill="rgba(244,63,94,0.6)"/>
            <path d="M35,50 Q31,60 38,70 Q34,80 37,85" stroke="rgba(255,255,255,0.4)" stroke-width="0.8" fill="none"/>
            <!-- Balloon 2 (Cyan) -->
            <ellipse cx="95" cy="75" rx="12" ry="15" fill="rgba(6,182,212,0.38)" stroke="rgba(6,182,212,0.65)" stroke-width="0.8"/>
            <polygon points="95,90 92,93 98,93" fill="rgba(6,182,212,0.6)"/>
            <path d="M95,93 Q99,103 92,112" stroke="rgba(255,255,255,0.35)" stroke-width="0.8" fill="none"/>
            <!-- Confetti Streamers & Dots -->
            <rect x="85" y="25" width="5" height="3" rx="1" fill="#FBBF24" transform="rotate(40 85 25)"/>
            <rect x="20" y="95" width="4" height="4" rx="1" fill="#F43F5E" transform="rotate(-30 20 95)"/>
            <circle cx="70" cy="50" r="2" fill="#FBBF24"/>
            <circle cx="115" cy="40" r="1.5" fill="#06B6D4"/>
            <circle cx="15" cy="20" r="1.5" fill="#F43F5E"/>
            <polygon points="65,100 66,103 69,103 67,105 68,108 65,106 62,108 63,105 61,103 64,103" fill="#FBBF24"/>
          </svg>
        `)},
        radial-gradient(at 20% 25%, rgba(244, 63, 94, 0.22) 0px, transparent 50%),
        radial-gradient(at 80% 75%, rgba(6, 182, 212, 0.2) 0px, transparent 50%),
        linear-gradient(180deg, #050414 0%, #131135 50%, #040311 100%)
      `,
      backgroundSize: '130px 130px, 100% 100%, 100% 100%, 100% 100%',
      backgroundAttachment: 'fixed'
    }
  },

  // 8. Valentine's Day
  {
    id: 'valentines-romance',
    name: "Valentine's Day",
    category: 'occasions',
    categoryLabel: 'Occasions',
    description: 'Romantic interlocking hearts, cascading rose petals, and subtle velvet filigree.',
    isDark: true,
    accentColor: '#FB7185',
    iconName: 'Heart',
    previewClass: 'bg-rose-950 border border-pink-700',
    backgroundStyle: {
      backgroundColor: '#100307',
      backgroundImage: `
        ${encodeSvg(`
          <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
            <!-- Heart 1 -->
            <path d="M40,25 C40,15 25,15 25,28 C25,40 40,50 40,50 C40,50 55,40 55,28 C55,15 40,15 40,25 Z" fill="rgba(244,63,94,0.45)" stroke="rgba(251,113,133,0.65)" stroke-width="0.8"/>
            <!-- Heart 2 (Smaller) -->
            <path d="M90,75 C90,68 80,68 80,76 C80,84 90,92 90,92 C90,92 100,84 100,76 C100,68 90,68 90,75 Z" fill="rgba(225,29,72,0.4)" stroke="rgba(251,113,133,0.55)" stroke-width="0.8"/>
            <!-- Rose Petal Silhouettes -->
            <path d="M85,30 Q92,20 100,28 Q95,38 85,30 Z" fill="rgba(251,113,133,0.3)"/>
            <path d="M25,85 Q32,77 38,83 Q33,92 25,85 Z" fill="rgba(251,113,133,0.25)"/>
            <!-- Floating Sparkle Diamonds -->
            <polygon points="65,40 66.5,43 70,43 67,45 68,48 65,46 62,48 63,45 60,43 63.5,43" fill="#FECDD3"/>
            <circle cx="15" cy="55" r="1.2" fill="#FDA4AF"/>
            <circle cx="105" cy="105" r="1.5" fill="#FDA4AF"/>
          </svg>
        `)},
        radial-gradient(at 30% 30%, rgba(244, 63, 94, 0.25) 0px, transparent 55%),
        radial-gradient(at 80% 80%, rgba(225, 29, 72, 0.22) 0px, transparent 50%),
        linear-gradient(180deg, #0D0206 0%, #250714 50%, #0B0205 100%)
      `,
      backgroundSize: '120px 120px, 100% 100%, 100% 100%, 100% 100%',
      backgroundAttachment: 'fixed'
    }
  },

  // 9. Diwali (Festival of Lights)
  {
    id: 'diwali-lights',
    name: 'Diwali',
    category: 'festivals',
    categoryLabel: 'Festivals',
    description: 'Illuminated diya oil lamps, sacred rangoli mandalas, and radiant warm golden sparks.',
    isDark: true,
    accentColor: '#F59E0B',
    iconName: 'Flame',
    previewClass: 'bg-amber-950 border border-amber-600',
    backgroundStyle: {
      backgroundColor: '#120401',
      backgroundImage: `
        ${encodeSvg(`
          <svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
            <!-- Illuminated Diya Oil Lamp 1 -->
            <g transform="translate(30, 25)">
              <!-- Clay Diya Base -->
              <path d="M5,18 Q18,28 32,18 L30,15 Q18,22 7,15 Z" fill="rgba(217,119,6,0.6)" stroke="rgba(245,158,11,0.8)" stroke-width="0.8"/>
              <!-- Teardrop Diya Flame -->
              <path d="M18.5,15 C13,10 16,3 18.5,0 C21,3 24,10 18.5,15 Z" fill="#FDE047" stroke="#F59E0B" stroke-width="0.8"/>
              <ellipse cx="18.5" cy="8" rx="1.5" ry="3.5" fill="#FFFFFF"/>
            </g>
            <!-- Symmetrical Rangoli Mandala Motif -->
            <g transform="translate(95, 95)" stroke="rgba(245,158,11,0.3)" stroke-width="0.8" fill="rgba(245,158,11,0.06)">
              <circle cx="0" cy="0" r="14"/>
              <circle cx="0" cy="0" r="8"/>
              <path d="M0,-14 Q4,-8 0,0 Q-4,-8 0,-14 Z" fill="rgba(245,158,11,0.2)"/>
              <path d="M0,14 Q4,8 0,0 Q-4,8 0,14 Z" fill="rgba(245,158,11,0.2)"/>
              <path d="M-14,0 Q-8,4 0,0 Q-8,-4 -14,0 Z" fill="rgba(245,158,11,0.2)"/>
              <path d="M14,0 Q8,4 0,0 Q8,-4 14,0 Z" fill="rgba(245,158,11,0.2)"/>
            </g>
            <!-- Diya 2 (Smaller) -->
            <g transform="translate(85, 15) scale(0.7)">
              <path d="M5,18 Q18,28 32,18 L30,15 Q18,22 7,15 Z" fill="rgba(217,119,6,0.5)"/>
              <path d="M18.5,15 C13,10 16,3 18.5,0 C21,3 24,10 18.5,15 Z" fill="#FDE047"/>
            </g>
            <!-- Radiant Golden Sparks -->
            <circle cx="70" cy="75" r="1.5" fill="#FEF08A"/>
            <circle cx="15" cy="95" r="1.2" fill="#F59E0B"/>
            <circle cx="125" cy="40" r="1.5" fill="#FEF08A"/>
          </svg>
        `)},
        radial-gradient(at 35% 30%, rgba(245, 158, 11, 0.28) 0px, transparent 55%),
        radial-gradient(at 80% 80%, rgba(234, 88, 12, 0.22) 0px, transparent 50%),
        linear-gradient(180deg, #0F0301 0%, #290C03 50%, #0E0301 100%)
      `,
      backgroundSize: '140px 140px, 100% 100%, 100% 100%, 100% 100%',
      backgroundAttachment: 'fixed'
    }
  },

  // 10. Spring Blossom
  {
    id: 'spring-blossom',
    name: 'Spring',
    category: 'occasions',
    categoryLabel: 'Occasions',
    description: 'Sakura cherry blossoms, botanical leafy twigs, and fresh seasonal floral silhouettes.',
    isDark: true,
    accentColor: '#34D399',
    iconName: 'Flower',
    previewClass: 'bg-emerald-950 border border-teal-700',
    backgroundStyle: {
      backgroundColor: '#020F09',
      backgroundImage: `
        ${encodeSvg(`
          <svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 130 130">
            <!-- 5-Petal Sakura Blossom 1 -->
            <g transform="translate(35, 35)">
              <circle cx="0" cy="-10" r="7" fill="rgba(244,114,182,0.35)"/>
              <circle cx="10" cy="-3" r="7" fill="rgba(244,114,182,0.35)"/>
              <circle cx="6" cy="9" r="7" fill="rgba(244,114,182,0.35)"/>
              <circle cx="-6" cy="9" r="7" fill="rgba(244,114,182,0.35)"/>
              <circle cx="-10" cy="-3" r="7" fill="rgba(244,114,182,0.35)"/>
              <circle cx="0" cy="0" r="3.5" fill="#FDE047"/>
            </g>
            <!-- Botanical Twig with Leaves -->
            <path d="M70,95 Q85,80 110,85" stroke="rgba(52,211,153,0.4)" stroke-width="1.2" fill="none"/>
            <ellipse cx="85" cy="83" rx="5" ry="3" fill="rgba(52,211,153,0.35)" transform="rotate(-30 85 83)"/>
            <ellipse cx="98" cy="87" rx="5" ry="3" fill="rgba(52,211,153,0.35)" transform="rotate(25 98 87)"/>
            <!-- Sakura Blossom 2 (Smaller) -->
            <g transform="translate(95, 30) scale(0.65)">
              <circle cx="0" cy="-10" r="7" fill="rgba(244,114,182,0.3)"/>
              <circle cx="10" cy="-3" r="7" fill="rgba(244,114,182,0.3)"/>
              <circle cx="6" cy="9" r="7" fill="rgba(244,114,182,0.3)"/>
              <circle cx="-6" cy="9" r="7" fill="rgba(244,114,182,0.3)"/>
              <circle cx="-10" cy="-3" r="7" fill="rgba(244,114,182,0.3)"/>
              <circle cx="0" cy="0" r="3" fill="#FDE047"/>
            </g>
            <circle cx="20" cy="90" r="1.5" fill="rgba(244,114,182,0.4)"/>
            <circle cx="115" cy="115" r="1.2" fill="#34D399"/>
          </svg>
        `)},
        radial-gradient(at 25% 25%, rgba(244, 114, 182, 0.2) 0px, transparent 50%),
        radial-gradient(at 80% 80%, rgba(52, 211, 153, 0.22) 0px, transparent 50%),
        linear-gradient(180deg, #010B07 0%, #072218 50%, #020D08 100%)
      `,
      backgroundSize: '130px 130px, 100% 100%, 100% 100%, 100% 100%',
      backgroundAttachment: 'fixed'
    }
  },

  // 11. Wedding Elegance
  {
    id: 'wedding-elegance',
    name: 'Wedding',
    category: 'celebrations',
    categoryLabel: 'Celebrations',
    description: 'Opulent gold damask lace, floral celebration garlands, and interlocking rings motif.',
    isDark: true,
    accentColor: '#E2E8F0',
    iconName: 'Sparkles',
    previewClass: 'bg-zinc-950 border border-amber-400',
    backgroundStyle: {
      backgroundColor: '#09090C',
      backgroundImage: `
        ${encodeSvg(`
          <svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 130 130">
            <!-- Interlocking Wedding Rings Motif -->
            <g transform="translate(65, 35)">
              <circle cx="-7" cy="0" r="9" stroke="rgba(234,179,8,0.65)" stroke-width="1.2" fill="none"/>
              <circle cx="7" cy="0" r="9" stroke="rgba(226,232,240,0.65)" stroke-width="1.2" fill="none"/>
              <polygon points="7,-10 9,-8 11,-10 9,-13" fill="#FDE047"/>
            </g>
            <!-- Baroque Damask Lace Motif -->
            <g stroke="rgba(234,179,8,0.22)" stroke-width="0.8" fill="rgba(234,179,8,0.05)">
              <path d="M65,70 Q75,80 65,95 Q55,80 65,70 Z"/>
              <path d="M50,85 Q65,80 80,85 Q65,98 50,85 Z"/>
              <circle cx="65" cy="85" r="3" fill="rgba(234,179,8,0.3)"/>
            </g>
            <!-- Champagne Floral Sprigs -->
            <circle cx="20" cy="20" r="1.5" fill="rgba(255,255,255,0.4)"/>
            <circle cx="110" cy="110" r="1.5" fill="rgba(234,179,8,0.4)"/>
            <circle cx="15" cy="105" r="1.2" fill="rgba(255,255,255,0.3)"/>
          </svg>
        `)},
        radial-gradient(at 50% 25%, rgba(234, 179, 8, 0.2) 0px, transparent 50%),
        radial-gradient(at 50% 85%, rgba(226, 232, 240, 0.15) 0px, transparent 50%),
        linear-gradient(180deg, #07070A 0%, #17161F 50%, #060609 100%)
      `,
      backgroundSize: '130px 130px, 100% 100%, 100% 100%, 100% 100%',
      backgroundAttachment: 'fixed'
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ── EVERYDAY COLLECTION (RETAINED CLASSIC PRESETS) ─────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    category: 'everyday',
    categoryLabel: 'Everyday',
    description: 'Ethereal northern lights gradient with soft emerald and deep indigo luminescence.',
    isDark: true,
    accentColor: '#10B981',
    iconName: 'Sparkles',
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
    category: 'everyday',
    categoryLabel: 'Everyday',
    description: 'Warm dusk twilight blending deep twilight navy with soft rose and golden amber.',
    isDark: true,
    accentColor: '#F59E0B',
    iconName: 'Sun',
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
    category: 'everyday',
    categoryLabel: 'Everyday',
    description: 'Deep celestial sapphire with radial luminescence and soft violet aura.',
    isDark: true,
    accentColor: '#8B5CF6',
    iconName: 'Moon',
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
    category: 'everyday',
    categoryLabel: 'Everyday',
    description: 'Opulent velvet violet with wine-magenta undertones and soft dark shading.',
    isDark: true,
    accentColor: '#C084FC',
    iconName: 'Sparkles',
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
  {
    id: 'obsidian-grid',
    name: 'Obsidian Mesh',
    category: 'everyday',
    categoryLabel: 'Everyday',
    description: 'Deep obsidian black with an ultra-fine high-precision technical grid matrix.',
    isDark: true,
    accentColor: '#38BDF8',
    iconName: 'Layers',
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
    category: 'everyday',
    categoryLabel: 'Everyday',
    description: 'Executive graphite slate with subtle structured diagonal micro-stripes.',
    isDark: true,
    accentColor: '#94A3B8',
    iconName: 'Layers',
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
    category: 'everyday',
    categoryLabel: 'Everyday',
    description: 'Brushed dark titanium with radial vignette and fine metallic grain.',
    isDark: true,
    accentColor: '#64748B',
    iconName: 'Layers',
    previewClass: 'bg-zinc-950 border border-zinc-800',
    backgroundStyle: {
      backgroundColor: '#09090B',
      backgroundImage: `
        radial-gradient(at 50% 50%, rgba(100, 116, 139, 0.1) 0px, transparent 65%),
        linear-gradient(135deg, #09090B 0%, #18181B 50%, #09090B 100%)
      `,
      backgroundAttachment: 'fixed'
    }
  },
  {
    id: 'alabaster-canvas',
    name: 'Alabaster Canvas',
    category: 'everyday',
    categoryLabel: 'Everyday',
    description: 'Clean studio white with ultra-soft warm ambient glow and delicate framing.',
    isDark: false,
    accentColor: '#0F172A',
    iconName: 'Palette',
    previewClass: 'bg-stone-50 border border-stone-200 text-stone-900',
    backgroundStyle: {
      backgroundColor: '#F8FAFC',
      backgroundImage: `
        radial-gradient(at 0% 0%, rgba(203, 213, 225, 0.4) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(241, 245, 249, 0.8) 0px, transparent 50%),
        linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)
      `,
      backgroundAttachment: 'fixed'
    }
  },
  {
    id: 'soft-linen',
    name: 'Soft Linen',
    category: 'everyday',
    categoryLabel: 'Everyday',
    description: 'Warm organic linen textured backdrop with natural fiber feel.',
    isDark: false,
    accentColor: '#78716C',
    iconName: 'Palette',
    previewClass: 'bg-amber-50/50 border border-amber-200 text-stone-800',
    backgroundStyle: {
      backgroundColor: '#FAF8F5',
      backgroundImage: `
        linear-gradient(to right, rgba(120, 113, 108, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(120, 113, 108, 0.03) 1px, transparent 1px),
        linear-gradient(180deg, #FDFBF7 0%, #F5EFEB 100%)
      `,
      backgroundSize: '20px 20px, 20px 20px, 100% 100%',
      backgroundAttachment: 'fixed'
    }
  },
  {
    id: 'frosted-pearl',
    name: 'Frosted Pearl',
    category: 'everyday',
    categoryLabel: 'Everyday',
    description: 'Soft iridescent pearl white with subtle cyan-lavender luminosity.',
    isDark: false,
    accentColor: '#3B82F6',
    iconName: 'Palette',
    previewClass: 'bg-slate-50 border border-blue-100 text-slate-800',
    backgroundStyle: {
      backgroundColor: '#F8FAFC',
      backgroundImage: `
        radial-gradient(at 20% 20%, rgba(219, 234, 254, 0.45) 0px, transparent 50%),
        radial-gradient(at 80% 80%, rgba(243, 232, 255, 0.45) 0px, transparent 50%),
        linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)
      `,
      backgroundAttachment: 'fixed'
    }
  },
  {
    id: 'topographic-flow',
    name: 'Topographic Flow',
    category: 'everyday',
    categoryLabel: 'Everyday',
    description: 'Modern elevation contour lines depicting geographic fluidity.',
    isDark: true,
    accentColor: '#10B981',
    iconName: 'Compass',
    previewClass: 'bg-zinc-950 border border-zinc-800',
    backgroundStyle: {
      backgroundColor: '#09090B',
      backgroundImage: `
        repeating-radial-gradient(ellipse at 50% 50%, rgba(16, 185, 129, 0.04) 0px, rgba(16, 185, 129, 0.04) 1px, transparent 2px, transparent 24px),
        linear-gradient(180deg, #09090B 0%, #121216 100%)
      `,
      backgroundAttachment: 'fixed'
    }
  },
  {
    id: 'constellation',
    name: 'Constellation',
    category: 'everyday',
    categoryLabel: 'Everyday',
    description: 'Deep cosmic star map with subtle interstellar coordinates.',
    isDark: true,
    accentColor: '#38BDF8',
    iconName: 'Star',
    previewClass: 'bg-black border border-slate-800',
    backgroundStyle: {
      backgroundColor: '#03050C',
      backgroundImage: `
        radial-gradient(1px 1px at 20px 30px, rgba(255, 255, 255, 0.4), transparent),
        radial-gradient(1.5px 1.5px at 80px 40px, rgba(56, 189, 248, 0.5), transparent),
        radial-gradient(1px 1px at 140px 90px, rgba(255, 255, 255, 0.35), transparent),
        radial-gradient(1px 1px at 60px 120px, rgba(255, 255, 255, 0.3), transparent),
        linear-gradient(180deg, #020308 0%, #060919 100%)
      `,
      backgroundSize: '180px 180px, 180px 180px, 180px 180px, 180px 180px, 100% 100%',
      backgroundAttachment: 'fixed'
    }
  },
  {
    id: 'isometric-vector',
    name: 'Isometric Vector',
    category: 'everyday',
    categoryLabel: 'Everyday',
    description: 'Geometric cube lattice with subtle dimensional isometric planes.',
    isDark: true,
    accentColor: '#6366F1',
    iconName: 'Layers',
    previewClass: 'bg-neutral-950 border border-indigo-900',
    backgroundStyle: {
      backgroundColor: '#080811',
      backgroundImage: `
        linear-gradient(30deg, rgba(99, 102, 241, 0.05) 12%, transparent 12.5%, transparent 87%, rgba(99, 102, 241, 0.05) 87.5%, rgba(99, 102, 241, 0.05)),
        linear-gradient(150deg, rgba(99, 102, 241, 0.05) 12%, transparent 12.5%, transparent 87%, rgba(99, 102, 241, 0.05) 87.5%, rgba(99, 102, 241, 0.05)),
        linear-gradient(180deg, #05050C 0%, #0F0F24 100%)
      `,
      backgroundSize: '40px 70px, 40px 70px, 100% 100%',
      backgroundAttachment: 'fixed'
    }
  },
  {
    id: 'velvet-dusk',
    name: 'Velvet Dusk',
    category: 'everyday',
    categoryLabel: 'Everyday',
    description: 'Deep dusk plum velvet with soft wine undertones.',
    isDark: true,
    accentColor: '#E11D48',
    iconName: 'Palette',
    previewClass: 'bg-gradient-to-tr from-stone-950 to-rose-950',
    backgroundStyle: {
      backgroundColor: '#0F0307',
      backgroundImage: `
        radial-gradient(at 50% 0%, rgba(225, 29, 72, 0.16) 0px, transparent 55%),
        linear-gradient(180deg, #0A0205 0%, #1A050D 50%, #0A0205 100%)
      `,
      backgroundAttachment: 'fixed'
    }
  },
  {
    id: 'emerald-silk',
    name: 'Emerald Silk',
    category: 'everyday',
    categoryLabel: 'Everyday',
    description: 'Lustrous deep forest jade with rich emerald silk sheen.',
    isDark: true,
    accentColor: '#059669',
    iconName: 'Palette',
    previewClass: 'bg-emerald-950 border border-emerald-900',
    backgroundStyle: {
      backgroundColor: '#021008',
      backgroundImage: `
        radial-gradient(at 100% 0%, rgba(5, 150, 105, 0.18) 0px, transparent 50%),
        radial-gradient(at 0% 100%, rgba(16, 185, 129, 0.15) 0px, transparent 50%),
        linear-gradient(180deg, #020C06 0%, #062314 50%, #020C06 100%)
      `,
      backgroundAttachment: 'fixed'
    }
  },
  {
    id: 'cyber-horizon',
    name: 'Cyber Horizon',
    category: 'everyday',
    categoryLabel: 'Everyday',
    description: 'Synthwave cybernetic horizon with luminous neon grid rays.',
    isDark: true,
    accentColor: '#EC4899',
    iconName: 'Sparkles',
    previewClass: 'bg-slate-950 border border-fuchsia-900',
    backgroundStyle: {
      backgroundColor: '#070714',
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
    category: 'everyday',
    categoryLabel: 'Everyday',
    description: 'Holographic chromatic light refractions across obsidian tinted crystal.',
    isDark: true,
    accentColor: '#A78BFA',
    iconName: 'Sparkles',
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

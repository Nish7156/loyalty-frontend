export interface ThemePalette {
  id: string;
  name: string;
  description: string;
  preview: { bg: string; accent: string; text: string; surface: string; border: string };
  variables: Record<string, string>;
}

function makeTheme(
  id: string,
  name: string,
  description: string,
  p: {
    bg: string; s: string; s2: string;
    bd: string; bdl: string;
    t: string; t2: string; t3: string;
    a: string; abg: string; abd: string;
    gr: string; grbg: string; grbd: string;
    re: string; rebg: string;
    am: string; ambg: string;
    adm: string; admbg: string;
    // Dark mode flag
    isDark?: boolean;
    // Card stripe decorative colors
    stripe1?: string; stripe2?: string; stripe3?: string; stripe4?: string;
  }
): ThemePalette {
  const isDark = p.isDark ?? false;
  return {
    id,
    name,
    description,
    preview: { bg: p.bg, accent: p.a, text: p.t, surface: p.s, border: p.bd },
    variables: {
      // Core
      'bg': p.bg, 's': p.s, 's2': p.s2,
      'bd': p.bd, 'bdl': p.bdl,
      't': p.t, 't2': p.t2, 't3': p.t3,
      'a': p.a, 'abg': p.abg, 'abd': p.abd,
      'gr': p.gr, 'grbg': p.grbg, 'grbd': p.grbd,
      're': p.re, 'rebg': p.rebg,
      'am': p.am, 'ambg': p.ambg,
      'adm': p.adm, 'admbg': p.admbg,

      // User-facing tokens
      'user-bg': p.bg,
      'user-bg-page': p.bg,
      'user-surface': p.s,
      'user-card': p.s,
      'user-border': p.bd,
      'user-border-subtle': p.bdl,
      'user-card-border': p.bdl,
      'user-card-hover-border': p.bd,
      'user-text': p.t,
      'user-text-primary': p.t,
      'user-text-muted': p.t2,
      'user-text-subtle': p.t3,
      'user-text-mid': p.t2,
      'user-overlay': isDark ? 'rgba(0,0,0,0.5)' : `rgba(0,0,0,0.3)`,
      'user-input-bg': p.bg,
      'user-nav-bg': p.s,
      'user-nav-border': p.bdl,
      'user-nav-item-color': p.t3,
      'user-nav-item-hover': p.abg,
      'user-hover': p.abg,
      'user-card-subtle': p.s,
      'user-card-shine': 'none',
      'user-tabs-bg': p.s2,
      'user-tabs-border': p.bdl,
      'user-tab-color': p.t3,
      'user-icon-btn-bg': p.bg,
      'user-icon-btn-border': p.bd,
      'user-prog-track': p.s2,
      'user-store-divider': p.bdl,
      'user-stat-chip-bg': isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      'user-earn-icon-bg': p.abg,
      'user-earn-icon-border': p.abd,
      'accent': p.a,
      'user-skeleton-bg': p.s2,
      'user-skeleton-card-bg': p.s,
      'user-skeleton-card-border': p.bdl,
      'user-reward-box-bg': p.abg,
      'user-reward-box-border': p.abd,
      'user-reward-box-text': p.a,
      'user-reward-box-text-strong': p.a,

      // Premium tokens
      'premium-blue': p.a,
      'premium-blue-light': p.a,
      'premium-green': p.gr,
      'premium-green-light': p.gr,
      'premium-bg': p.bg,
      'premium-surface': p.s,
      'premium-card': p.s,
      'premium-border': p.bdl,
      'premium-muted': p.t3,
      'premium-gold': p.a,
      'premium-gold-dim': p.a,
      'premium-cream': p.t,
      'premium-cream-dim': p.t2,

      // Card stripe colors (decorative)
      'stripe1': p.stripe1 ?? p.a,
      'stripe2': p.stripe2 ?? p.t3,
      'stripe3': p.stripe3 ?? '#5C6E84',
      'stripe4': p.stripe4 ?? '#7A5C6E',

      // Dark mode flag for JS
      'is-dark': isDark ? '1' : '0',
    },
  };
}

export const themes: ThemePalette[] = [
  // 1. Warm Earth (default) — terracotta, brown, off-white
  makeTheme('warm-earth', 'Warm Earth', 'Terracotta & brown tones', {
    bg: '#FAF9F6', s: '#FFF', s2: '#EDEFEE',
    bd: '#F5C4B3', bdl: '#FAECE7',
    t: '#5D4037', t2: '#7B5E54', t3: '#A08880',
    a: '#D85A30', abg: '#FAECE7', abd: '#F5C4B3',
    gr: '#2A6040', grbg: '#E4F2EB', grbd: '#A8D4BA',
    re: '#B03A2A', rebg: '#FDEEE9',
    am: '#B45309', ambg: '#FEF3C7',
    adm: '#3D3A8C', admbg: '#EEEDF8',
    stripe1: '#D85A30', stripe2: '#7A6C5C', stripe3: '#5C6E84', stripe4: '#7A5C6E',
  }),

  // 2. Ocean Blue — deep navy, cerulean accent, cool surfaces
  makeTheme('ocean-blue', 'Ocean Blue', 'Deep sea blues & whites', {
    bg: '#F5F7FA', s: '#FFF', s2: '#EBF0F5',
    bd: '#B8D4E8', bdl: '#E1EDF5',
    t: '#1B3A5C', t2: '#3D6080', t3: '#7A9AB8',
    a: '#1976D2', abg: '#E3F0FC', abd: '#B8D4E8',
    gr: '#1B7D46', grbg: '#E4F5EC', grbd: '#9AD4B5',
    re: '#C62828', rebg: '#FCE8E8',
    am: '#E65100', ambg: '#FFF3E0',
    adm: '#283593', admbg: '#E8EAF6',
    stripe1: '#1976D2', stripe2: '#455A64', stripe3: '#0097A7', stripe4: '#5C6BC0',
  }),

  // 3. Forest Green — emerald accent, sage surfaces
  makeTheme('forest-green', 'Forest Green', 'Natural greens & cream', {
    bg: '#F6FAF7', s: '#FFF', s2: '#E8F0EA',
    bd: '#A8D4BA', bdl: '#DFF0E4',
    t: '#1B3A28', t2: '#3D6048', t3: '#7BA088',
    a: '#2E7D32', abg: '#E8F5E9', abd: '#A5D6A7',
    gr: '#1B5E20', grbg: '#E8F5E9', grbd: '#81C784',
    re: '#C62828', rebg: '#FFEBEE',
    am: '#E65100', ambg: '#FFF3E0',
    adm: '#33691E', admbg: '#F1F8E9',
    stripe1: '#2E7D32', stripe2: '#5D8A6B', stripe3: '#00695C', stripe4: '#558B2F',
  }),

  // 4. Royal Purple — violet accent, lavender surfaces
  makeTheme('royal-purple', 'Royal Purple', 'Elegant purple & lavender', {
    bg: '#F8F6FB', s: '#FFF', s2: '#EEEAF5',
    bd: '#C5B3E8', bdl: '#EDE7F6',
    t: '#311B5C', t2: '#5C3D8F', t3: '#9A80C0',
    a: '#7B1FA2', abg: '#F3E5F5', abd: '#CE93D8',
    gr: '#2E7D32', grbg: '#E8F5E9', grbd: '#81C784',
    re: '#C62828', rebg: '#FFEBEE',
    am: '#F57C00', ambg: '#FFF3E0',
    adm: '#4527A0', admbg: '#EDE7F6',
    stripe1: '#7B1FA2', stripe2: '#5C4D7A', stripe3: '#1565C0', stripe4: '#AD1457',
  }),

  // 5. Rose Gold — blush pink accent, warm whites
  makeTheme('rose-gold', 'Rose Gold', 'Soft pinks & golden blush', {
    bg: '#FDF8F6', s: '#FFF', s2: '#F5ECEA',
    bd: '#E8C4BC', bdl: '#F9EDE9',
    t: '#4E2A2A', t2: '#7A4F4F', t3: '#B08888',
    a: '#C2185B', abg: '#FCE4EC', abd: '#F48FB1',
    gr: '#2E7D47', grbg: '#E8F5E9', grbd: '#81C784',
    re: '#B71C1C', rebg: '#FFEBEE',
    am: '#E65100', ambg: '#FFF3E0',
    adm: '#880E4F', admbg: '#FCE4EC',
    stripe1: '#C2185B', stripe2: '#8D6E63', stripe3: '#B8860B', stripe4: '#AD1457',
  }),

  // 6. Midnight — dark mode with gold accent
  makeTheme('midnight', 'Midnight', 'Dark mode with warm gold', {
    bg: '#0F1218', s: '#1A1F2B', s2: '#242A38',
    bd: '#3A4050', bdl: '#2A3040',
    t: '#E8E4DF', t2: '#B0A89E', t3: '#7A7268',
    a: '#D4A03C', abg: 'rgba(212,160,60,0.12)', abd: 'rgba(212,160,60,0.25)',
    gr: '#4CAF50', grbg: 'rgba(76,175,80,0.12)', grbd: 'rgba(76,175,80,0.25)',
    re: '#EF5350', rebg: 'rgba(239,83,80,0.12)',
    am: '#FFB74D', ambg: 'rgba(255,183,77,0.12)',
    adm: '#7C4DFF', admbg: 'rgba(124,77,255,0.12)',
    isDark: true,
    stripe1: '#D4A03C', stripe2: '#8D8070', stripe3: '#5C7090', stripe4: '#906070',
  }),

  // 7. Slate Modern — cool gray, teal accent
  makeTheme('slate-modern', 'Slate Modern', 'Clean gray & teal accent', {
    bg: '#F8FAFB', s: '#FFF', s2: '#EEF1F3',
    bd: '#C4D4DC', bdl: '#E4ECF0',
    t: '#1E293B', t2: '#475569', t3: '#94A3B8',
    a: '#0D9488', abg: '#F0FDFA', abd: '#99F6E4',
    gr: '#16A34A', grbg: '#F0FDF4', grbd: '#86EFAC',
    re: '#DC2626', rebg: '#FEF2F2',
    am: '#D97706', ambg: '#FFFBEB',
    adm: '#4F46E5', admbg: '#EEF2FF',
    stripe1: '#0D9488', stripe2: '#64748B', stripe3: '#0284C7', stripe4: '#7C3AED',
  }),

  // 8. Sunset Amber — warm amber/gold accent, cream surfaces
  makeTheme('sunset-amber', 'Sunset Amber', 'Golden amber & warm cream', {
    bg: '#FFFBF5', s: '#FFF', s2: '#F5EDE0',
    bd: '#E0C8A0', bdl: '#F5ECD8',
    t: '#3E2C1A', t2: '#6B5438', t3: '#A89070',
    a: '#D4830A', abg: '#FFF5E0', abd: '#F0D090',
    gr: '#2E7D47', grbg: '#E8F5E9', grbd: '#81C784',
    re: '#C62828', rebg: '#FFEBEE',
    am: '#E65100', ambg: '#FFF3E0',
    adm: '#5D4037', admbg: '#EFEBE9',
    stripe1: '#D4830A', stripe2: '#8D7A60', stripe3: '#6D8060', stripe4: '#8D6050',
  }),
];

export const DEFAULT_THEME_ID = 'warm-earth';

export function getThemeById(id: string): ThemePalette {
  return themes.find((t) => t.id === id) ?? themes[0];
}

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  secondary: string;
  text: string;
  textMuted: string;
  border: string;
  error: string;
  success: string;
  tint: string;
};

export type ThemePalette = {
  light: ThemeColors;
  dark: ThemeColors;
};

export const Palettes: Record<string, ThemePalette> = {
  Default: {
    light: {
      background: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceElevated: '#F1F5F9',
      primary: '#00387B',
      secondary: '#CD4E1E',
      text: '#0F172A',
      textMuted: '#64748B',
      border: '#E2E8F0',
      error: '#EF4444',
      success: '#22C55E',
      tint: '#00387B',
    },
    dark: {
      background: '#02040A',
      surface: '#0A0F1C',
      surfaceElevated: '#1A2338',
      primary: '#60A5FA',
      secondary: '#FB923C',
      text: '#F8FAFC',
      textMuted: '#94A3B8',
      border: '#1E2A44',
      error: '#F87171',
      success: '#4ADE80',
      tint: '#60A5FA',
    },
  },

  Emerald: {
    light: {
      background: '#F0FDF4',
      surface: '#FFFFFF',
      surfaceElevated: '#DCFCE7',
      primary: '#15803D',
      secondary: '#B45309',
      text: '#14532D',
      textMuted: '#3F6212',
      border: '#BBF7D0',
      error: '#B91C1C',
      success: '#15803D',
      tint: '#15803D',
    },
    dark: {
      background: '#02140B',
      surface: '#05291C',
      surfaceElevated: '#0F3F2B',
      primary: '#34D399',
      secondary: '#FBBF24',
      text: '#ECFDF5',
      textMuted: '#6EE7B7',
      border: '#134E3F',
      error: '#F87171',
      success: '#34D399',
      tint: '#34D399',
    },
  },

  Gold: {
    light: {
      background: '#FFFBEB',
      surface: '#FFFFFF',
      surfaceElevated: '#FEF3C7',
      primary: '#B45309',
      secondary: '#1E3A8A',
      text: '#78350F',
      textMuted: '#92400E',
      border: '#FDE68A',
      error: '#EF4444',
      success: '#059669',
      tint: '#B45309',
    },
    dark: {
      background: '#1A1204',
      surface: '#241B08',
      surfaceElevated: '#36280F',
      primary: '#FACC15',
      secondary: '#60A5FA',
      text: '#FEF3C7',
      textMuted: '#FCD34D',
      border: '#4A3A18',
      error: '#F87171',
      success: '#34D399',
      tint: '#FACC15',
    },
  },

  Crimson: {
    light: {
      background: '#FEF2F2',
      surface: '#FFFFFF',
      surfaceElevated: '#FEE2E2',
      primary: '#991B1B',
      secondary: '#00387B',
      text: '#450A0A',
      textMuted: '#7F1D1D',
      border: '#FECACA',
      error: '#EF4444',
      success: '#166534',
      tint: '#991B1B',
    },
    dark: {
      background: '#1C0808',
      surface: '#2A0F0F',
      surfaceElevated: '#3F1A1A',
      primary: '#FB7185',
      secondary: '#60A5FA',
      text: '#FEF2F2',
      textMuted: '#FDA4AF',
      border: '#5C1F1F',
      error: '#FB7185',
      success: '#4ADE80',
      tint: '#FB7185',
    },
  },

  Gemerald: {
    light: {
      background: '#F0FDF4',
      surface: '#FFFFFF',
      surfaceElevated: '#DCFCE7',
      primary: '#15803D',
      secondary: '#B45309',
      text: '#14532D',
      textMuted: '#3F6212',
      border: '#BBF7D0',
      error: '#B91C1C',
      success: '#15803D',
      tint: '#15803D',
    },
    dark: {
      background: '#01140A',
      surface: '#02291B',
      surfaceElevated: '#0A3F2D',
      primary: '#10E8A0',
      secondary: '#67E8B5',
      text: '#F0FDF4',
      textMuted: '#6EE7B7',
      border: '#134E3F',
      error: '#F87171',
      success: '#34D399',
      tint: '#10E8A0',
    },
  },

  // New Darken Theme (Pure deep dark neutral theme)
  Darken: {
    light: {
      // Light version kept minimal for type safety
      background: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceElevated: '#F1F5F9',
      primary: '#1E2937',
      secondary: '#64748B',
      text: '#0F172A',
      textMuted: '#64748B',
      border: '#E2E8F0',
      error: '#EF4444',
      success: '#22C55E',
      tint: '#1E2937',
    },
    dark: {
      background: '#000000',           // Pure black background
      surface: '#0A0A0A',              // Slightly lighter surface
      surfaceElevated: '#171717',      // Elevated cards
      primary: '#3B82F6',              // Bright blue accent
      secondary: '#A5B4FC',            // Soft indigo
      text: '#F8FAFC',
      textMuted: '#9CA3AF',
      border: '#27272A',
      error: '#F87171',
      success: '#4ADE80',
      tint: '#3B82F6',
    },
  },
};
export const brandColors = {
  primary: '#00B8D4',
  primaryLight: '#4DD4ED',
  primaryDark: '#0097A7',
  secondary: '#6EE0FF',
  warning: '#FFD34E',
  background: '#F7FBFF',
  paper: '#FFFFFF',
  textPrimary: '#0A2640',
  textSecondary: '#3A3A3A',
  successBg: '#E7F8EE',
  successBorder: '#B6E3C9',
  errorBg: '#FDECEC',
  errorBorder: '#F5C2C7',
  errorText: '#B91C1C',
};

export const darkColors = {
  primary: '#4DD4ED',
  primaryLight: '#7DD3FC',
  primaryDark: '#0EA5E9',
  secondary: '#38BDF8',
  warning: '#FCD34D',
  background: '#0B1220',
  paper: '#111827',
  textPrimary: '#E2E8F0',
  textSecondary: '#CBD5E1',
  cardBorder: '#1E293B',
  successBg: '#064E3B',
  successBorder: '#10B981',
  errorBg: '#7F1D1D',
  errorBorder: '#DC2626',
  errorText: '#FCA5A5',
};

export const getThemeColors = (isDark: boolean) => (isDark ? darkColors : brandColors);

export const brandGradient = ['#00B8D4', '#18C9E8', '#4DD4ED', '#6EE0FF'] as const;

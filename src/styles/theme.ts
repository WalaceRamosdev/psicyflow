export interface ThemeColors {
  bg: string;
  card: string;
  text: string;
  textSec: string;
  border: string;
  headerBg: string;
  inputBg: string;
  divider: string;
  primary: string;
  primaryLight: string;
  success: string;
  successLight: string;
  danger: string;
  dangerLight: string;
}

export const themes = {
  light: {
    bg: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    textSec: '#64748B',
    border: '#E2E8F0',
    headerBg: '#FFFFFF',
    inputBg: '#F8FAFC',
    divider: '#F1F5F9',
    primary: '#4F46E5', // IndigoBrand
    primaryLight: 'rgba(79, 70, 229, 0.06)',
    success: '#059669', // Emerald
    successLight: 'rgba(5, 150, 105, 0.04)',
    danger: '#EF4444',
    dangerLight: '#FEF2F2',
  },
  dark: {
    bg: '#090D16', // Ultra rich deep pitch black-slate
    card: '#131A26', // Premium deep dark card
    text: '#F8FAFC',
    textSec: '#94A3B8',
    border: '#1E293B',
    headerBg: '#131A26',
    inputBg: '#1C2533',
    divider: '#1E293B',
    primary: '#6366F1', // IndigoBrand (Lighter for Dark Mode contrast)
    primaryLight: 'rgba(99, 102, 241, 0.12)',
    success: '#10B981', // Emerald
    successLight: 'rgba(16, 185, 129, 0.1)',
    danger: '#F87171',
    dangerLight: 'rgba(248, 113, 113, 0.1)',
  }
};

import { create } from 'zustand';

interface ThemeColors {
  primary: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  gold: string;
  tint: string;
  statusBar: 'light' | 'dark';
}

interface ThemeState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  colors: ThemeColors;
}

const lightColors: ThemeColors = {
  primary: '#EC1325', // Deep red brand
  background: '#F3E7E4', // Cream pinkish
  card: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  border: '#E0E0E0',
  accent: '#B98C8F',
  gold: '#D4AF37', // Gold for best sellers
  tint: '#EC1325',
  statusBar: 'dark',
};

const darkColors: ThemeColors = {
  primary: '#EC1325', // Premium red brand color
  background: '#121212', // Deep premium dark black
  card: '#1C1C1E', // Elegant dark card background
  text: '#FFFFFF',
  textSecondary: '#A0A0A0', // Clean gray for readability
  border: '#2C2C2E', // Subtle dark border
  accent: '#3A3A3C',
  gold: '#FFD700', // Gold star
  tint: '#EC1325',
  statusBar: 'light',
};

export const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: false,
  colors: lightColors,
  toggleDarkMode: () =>
    set((state) => {
      const nextMode = !state.isDarkMode;
      return {
        isDarkMode: nextMode,
        colors: nextMode ? darkColors : lightColors,
      };
    }),
}));

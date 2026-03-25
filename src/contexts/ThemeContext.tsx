import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { themes, getThemeById, DEFAULT_THEME_ID } from '../lib/themes';
import type { ThemePalette } from '../lib/themes';

const STORAGE_KEY = 'loyale-theme';

interface ThemeContextValue {
  themeId: string;
  theme: ThemePalette;
  setTheme: (id: string) => void;
  themes: ThemePalette[];
}

const ThemeContext = createContext<ThemeContextValue>({
  themeId: DEFAULT_THEME_ID,
  theme: getThemeById(DEFAULT_THEME_ID),
  setTheme: () => {},
  themes,
});

function applyTheme(palette: ThemePalette) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(palette.variables)) {
    root.style.setProperty(`--${key}`, value);
  }
  // Update body background and color for instant feel
  document.body.style.backgroundColor = palette.variables['bg'];
  document.body.style.color = palette.variables['t'];
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME_ID;
    } catch {
      return DEFAULT_THEME_ID;
    }
  });

  const theme = getThemeById(themeId);

  // Apply on mount and whenever themeId changes
  useEffect(() => {
    applyTheme(theme);
  }, [themeId]);

  const setTheme = useCallback((id: string) => {
    setThemeIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // localStorage unavailable
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ themeId, theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

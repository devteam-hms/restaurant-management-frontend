import React, { createContext, useContext, useState, useEffect, useCallback, useTransition } from 'react';
import { useLocation } from 'react-router-dom';

export type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  isLight: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY_PUBLIC = 'rms_theme_public';
const STORAGE_KEY_DASHBOARD = 'rms_theme_dashboard';
const STORAGE_KEY_GLOBAL = 'rms_theme_override';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // Helper to determine if current route is a dashboard route
  const isDashboardRoute = (pathname: string) => {
    return pathname.startsWith('/customer') || pathname.startsWith('/admin');
  };

  const getSystemTheme = (): Theme => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  };

  const getInitialThemeForPath = (pathname: string): Theme => {
    if (typeof window === 'undefined') return 'dark';

    const isDashboard = isDashboardRoute(pathname);
    const storageKey = isDashboard ? STORAGE_KEY_DASHBOARD : STORAGE_KEY_PUBLIC;
    const saved = localStorage.getItem(storageKey);

    if (saved === 'dark' || saved === 'light') {
      return saved;
    }

    // Check if user set a universal global override
    const globalOverride = localStorage.getItem(STORAGE_KEY_GLOBAL);
    if (globalOverride === 'dark' || globalOverride === 'light') {
      return globalOverride;
    }

    // Default requirements:
    // Light Mode for customer and admin dashboards
    // Dark Mode for the public luxury landing page and login experience
    if (isDashboard) {
      return 'light';
    } else {
      return 'dark';
    }
  };

  const [theme, setCurrentTheme] = useState<Theme>(() => getInitialThemeForPath(location.pathname));

  const applyThemeToDOM = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  };

  // Sync with DOM on mount and theme change
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  // Adjust theme on route change if user hasn't explicitly set conflicting manual choice
  useEffect(() => {
    const isDashboard = isDashboardRoute(location.pathname);
    const storageKey = isDashboard ? STORAGE_KEY_DASHBOARD : STORAGE_KEY_PUBLIC;
    const saved = localStorage.getItem(storageKey);

    if (saved === 'dark' || saved === 'light') {
      if (saved !== theme) {
        setCurrentTheme(saved);
      }
    } else {
      // Apply the section default
      const defaultForSection: Theme = isDashboard ? 'light' : 'dark';
      if (defaultForSection !== theme) {
        setCurrentTheme(defaultForSection);
      }
    }
  }, [location.pathname]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setCurrentTheme(newTheme);
      applyThemeToDOM(newTheme);

      const isDashboard = isDashboardRoute(location.pathname);
      const storageKey = isDashboard ? STORAGE_KEY_DASHBOARD : STORAGE_KEY_PUBLIC;
      localStorage.setItem(storageKey, newTheme);
      localStorage.setItem(STORAGE_KEY_GLOBAL, newTheme);
    },
    [location.pathname]
  );

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        isDark: theme === 'dark',
        isLight: theme === 'light',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};


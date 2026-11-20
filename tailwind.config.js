/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          hover: 'rgb(var(--primary-hover) / <alpha-value>)',
          dark: 'rgb(var(--primary-dark) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          secondary: 'rgb(var(--surface-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--surface-tertiary) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          dark: 'rgb(var(--muted-dark) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
          subtle: 'rgb(var(--border-subtle) / <alpha-value>)',
          gold: 'rgb(var(--primary) / 0.3)',
        },
        success: 'rgb(var(--success) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['var(--font-family-base)', 'sans-serif'],
        sans: ['var(--font-family-base)', 'sans-serif'],
      },
      boxShadow: {
        'luxury': '0 15px 35px -10px rgba(0, 0, 0, 0.35), 0 0 1px 1px rgb(var(--primary) / 0.1)',
        'luxury-hover': '0 25px 45px -10px rgba(0, 0, 0, 0.45), 0 0 15px 1px rgb(var(--primary) / 0.25)',
        'gold-glow': '0 0 25px rgb(var(--primary) / 0.35)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, rgb(var(--primary)) 0%, rgb(var(--primary-hover)) 50%, rgb(var(--primary-dark)) 100%)',
      },
    },
  },
  plugins: [],
};

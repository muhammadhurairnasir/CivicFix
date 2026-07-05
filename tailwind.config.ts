import type { Config } from 'tailwindcss';

/*
  CivicFix — Locked Tailwind Config
  ALL colors reference CSS variables only.
  No Tailwind default palette classes (blue-*, gray-*, slate-*, etc.) are available.
  This is intentional. See implementation_plan.md for the full rules.
*/

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Override the entire color palette — no Tailwind defaults.
    colors: {
      transparent: 'transparent',
      current:     'currentColor',

      background:  'var(--background)',
      surface:     'var(--surface)',
      card:        'var(--card)',
      border:      'var(--border)',

      text: {
        primary:   'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        inverse:   'var(--text-inverse)',
      },

      primary: {
        DEFAULT: 'var(--primary)',
        hover:   'var(--primary-hover)',
        fg:      'var(--primary-fg)',
      },

      status: {
        pending:  'var(--status-pending)',
        active:   'var(--status-active)',
        resolved: 'var(--status-resolved)',
        critical: 'var(--status-critical)',
      },
    },

    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm:  '4px',
        md:  '6px',
        lg:  '8px',
        xl:  '12px',
        '2xl': '16px',
        full: '9999px',
      },
      boxShadow: {
        xs:       'var(--shadow-xs)',
        sm:       'var(--shadow-sm)',
        card:     'var(--shadow-card)',
        md:       'var(--shadow-md)',
        dropdown: 'var(--shadow-dropdown)',
        modal:    'var(--shadow-modal)',
        focus:    '0 0 0 2px var(--primary)',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        marquee2: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out both',
        'fade-up': 'fade-up 0.4s ease-out both',
        shimmer:   'shimmer 2s linear infinite',
        marquee:   'marquee 40s linear infinite',
        marquee2:  'marquee2 40s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;

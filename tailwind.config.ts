import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic Theme Tokens (Mapped to CSS variables)
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          hover: 'hsl(var(--primary-hover) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          hover: 'hsl(var(--secondary-hover) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          hover: 'hsl(var(--accent-hover) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',

        // Brand Lime Scale (#A9CB37)
        brand: {
          50: '#f7fbe9',
          100: '#edf7ce',
          200: '#dcf0a2',
          300: '#c6e56e',
          400: '#b5d848',
          500: '#A9CB37',
          600: '#89aa26',
          700: '#688220',
          800: '#53671f',
          900: '#46571d',
          950: '#24310a',
          DEFAULT: '#A9CB37',
        },

        // Brand Electric Blue Scale (#0077FF)
        'brand-blue': {
          50: '#eff7ff',
          100: '#dbeeff',
          200: '#bfdfff',
          300: '#93c8ff',
          400: '#60a6ff',
          500: '#0077FF',
          600: '#005fe6',
          700: '#0048b8',
          800: '#003d96',
          900: '#06377c',
          950: '#042150',
          DEFAULT: '#0077FF',
        },

        // Dark Theme Surfaces
        surface: {
          DEFAULT: '#070B14',
          elevated: '#0F172A',
          card: '#111722',
          border: '#1E293B',
        },
      },
      backgroundImage: {
        'accent-gradient':
          'linear-gradient(264.19deg, rgba(169, 203, 55, 0) -7.67%, rgba(169, 203, 55, 0.1) 14.51%, rgba(169, 203, 55, 0.96) 46.63%, #0077FF 88.34%)',
        'brand-gradient':
          'linear-gradient(264.19deg, rgba(169, 203, 55, 0) -7.67%, rgba(169, 203, 55, 0.1) 14.51%, rgba(169, 203, 55, 0.96) 46.63%, #0077FF 88.34%)',
        'brand-gradient-multi':
          'linear-gradient(264.06deg, #0077FF -99.77%, rgba(169, 203, 55, 0.96) -47.75%, rgba(169, 203, 55, 0.1) -1.37%, rgba(169, 203, 55, 0.96) 55.55%, #0077FF 91.47%)',
        'brand-gradient-solid':
          'linear-gradient(264.06deg, #0077FF -99.77%, rgba(169, 203, 55, 0.96) 0%, rgba(169, 203, 55, 0.96) 55.55%, #0077FF 91.47%)',
        'brand-gradient-vibrant':
          'linear-gradient(264.06deg, #0077FF 6.75%, rgba(169, 203, 55, 0.96) 50%, #0077FF 93.25%)',
        'brand-gradient-flow':
          'linear-gradient(264.06deg, #0077FF -99.77%, rgba(169, 203, 55, 0.96) -47.75%, rgba(169, 203, 55, 0.1) -1.37%, rgba(169, 203, 55, 0.96) 55.55%, #0077FF 91.47%)',
        'brand-gradient-spectrum':
          'linear-gradient(264.19deg, #0077FF 6.75%, rgba(169, 203, 55, 0.96) 28.93%, rgba(169, 203, 55, 0.1) 52.08%, rgba(169, 203, 55, 0.96) 76.61%, #0077FF 99.71%)',
        'brand-gradient-reverse':
          'linear-gradient(84.19deg, #0077FF 11.66%, rgba(169, 203, 55, 0.96) 53.37%, rgba(169, 203, 55, 0.1) 85.49%, rgba(169, 203, 55, 0) 107.67%)',
        'brand-radial-glow':
          'radial-gradient(circle at 50% 0%, rgba(169, 203, 55, 0.15), rgba(0, 119, 255, 0.05) 50%, transparent 80%)',
      },
    },
  },
  plugins: [],
};

export default config;

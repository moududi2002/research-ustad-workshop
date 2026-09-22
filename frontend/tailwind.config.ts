import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd3ff',
          300: '#8eb6ff',
          400: '#598cff',
          500: '#3366ff',
          600: '#1f47f5',
          700: '#1836e1',
          800: '#1a2eb6',
          900: '#1c2e8f',
          950: '#151d57',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5d9e2',
          300: '#b1b9c9',
          400: '#8793aa',
          500: '#68758f',
          600: '#535e76',
          700: '#444c60',
          800: '#3b4151',
          900: '#343946',
          950: '#23262f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -8px rgba(35, 38, 47, 0.12)',
        card: '0 10px 40px -12px rgba(35, 38, 47, 0.15)',
      },
      backgroundImage: {
        'grid-pattern':
          "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 39.5h40M39.5 0v40' stroke='%23e5e7eb' stroke-width='0.5'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // theme-flippable surfaces; backed by CSS vars in index.css so we can swap dark/light.
        base:         'rgb(var(--c-base) / <alpha-value>)',
        surface:      'rgb(var(--c-surface) / <alpha-value>)',
        surfaceLight: 'rgb(var(--c-surfaceLight) / <alpha-value>)',
        textsec:      'rgb(var(--c-textsec) / <alpha-value>)',

        // Static brand accents (never change with theme).
        softblue: '#82A0FF',
        danger: '#FF4B4B',
        ink: '#0B0D14',     // always-dark for text on neon/softblue buttons
        paper: '#F8FAFC',   // always-light alternative for ink

        // Dark-default shaded scale, kept for legacy refs in screens.
        'ink-950': '#0B0D14',
        'ink-900': '#1A1D27',
        'ink-800': '#2A2E3D',
        'ink-700': '#363B4D',
        'ink-600': '#444A5E',
        'ink-500': '#5A6075',
        neon: {
          400: '#9DFF40', // hover
          500: '#7FFF00', // primary
          600: '#B9E000', // active
          glow: 'rgba(127,255,0,0.35)',
        },
        sky: {
          400: '#82A0FF',
          500: '#6A8DFF',
          600: '#4F75F0',
          glow: 'rgba(130,160,255,0.30)',
        },
        signal: {
          green: '#5EE6A8',
          red: '#FF4B4B',
          amber: '#FFB05A',
          violet: '#B698FF',
        },
      },
      fontFamily: {
        brand:   ['Outfit', '"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        sans:    ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        bento: '0 1px 0 rgba(255,255,255,0.04) inset, 0 30px 80px -30px rgba(0,0,0,0.7)',
        neon: '0 0 20px rgba(127,255,0,0.2)',
        'neon-strong': '0 0 30px rgba(127,255,0,0.4)',
        sky: '0 0 20px rgba(130,160,255,0.2)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '2rem', // 32px to match the kit's bento radius
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        'radial-neon':
          'radial-gradient(800px circle at 10% -10%, rgba(127,255,0,0.10), transparent 50%), radial-gradient(700px circle at 90% 10%, rgba(130,160,255,0.10), transparent 50%)',
      },
      backgroundSize: {
        'grid-32': '32px 32px',
      },
      keyframes: {
        pulseGlow: {
          '0%,100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        upvotePop: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.18)' },
          '100%': { transform: 'scale(1)' },
        },
        cursorBlink: {
          '0%,55%': { opacity: '1' },
          '60%,100%': { opacity: '0.15' },
        },
        tickerFade: {
          '0%':   { opacity: '0', transform: 'translateY(2px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        pulseGlow:   'pulseGlow 2.4s ease-in-out infinite',
        floaty:      'floaty 4s ease-in-out infinite',
        upvotePop:   'upvotePop 350ms ease-out',
        cursorBlink: 'cursorBlink 1.4s steps(1) infinite',
        tickerFade:  'tickerFade 220ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // semantic aliases that match the UI kit
        base: '#0B0D14',
        surface: '#1A1D27',
        surfaceLight: '#2A2E3D',
        textsec: '#A0A5B5',
        softblue: '#82A0FF',
        danger: '#FF4B4B',

        // shaded scales used across the app
        ink: {
          950: '#0B0D14', // base
          900: '#1A1D27', // surface
          800: '#2A2E3D', // surfaceLight
          700: '#363B4D',
          600: '#444A5E',
          500: '#5A6075',
        },
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
        brand:   ['"Bruno Ace"', 'Audiowide', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
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
      },
      animation: {
        pulseGlow:   'pulseGlow 2.4s ease-in-out infinite',
        floaty:      'floaty 4s ease-in-out infinite',
        upvotePop:   'upvotePop 350ms ease-out',
        cursorBlink: 'cursorBlink 1.4s steps(1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;

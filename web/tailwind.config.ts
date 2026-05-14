import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05060A',
          900: '#0A0B12',
          800: '#10121C',
          700: '#171A26',
          600: '#1F2333',
          500: '#2A2F44',
        },
        neon: {
          // primary — neon yellow
          400: '#FFF06B',
          500: '#F9F26B',
          600: '#EDE34B',
          glow: 'rgba(249,242,107,0.35)',
        },
        sky: {
          // secondary — soft blue
          400: '#7AB6FF',
          500: '#4F95F4',
          600: '#2F77D8',
          glow: 'rgba(122,182,255,0.30)',
        },
        signal: {
          green: '#5EE6A8',
          red: '#FF6B7A',
          amber: '#FFB05A',
          violet: '#B698FF',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        bento: '0 1px 0 rgba(255,255,255,0.04) inset, 0 30px 80px -30px rgba(0,0,0,0.7)',
        neon: '0 0 0 1px rgba(249,242,107,0.35), 0 0 30px rgba(249,242,107,0.18)',
        sky: '0 0 0 1px rgba(122,182,255,0.30), 0 0 30px rgba(122,182,255,0.16)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        'radial-neon':
          'radial-gradient(800px circle at 10% -10%, rgba(249,242,107,0.10), transparent 50%), radial-gradient(700px circle at 90% 10%, rgba(122,182,255,0.10), transparent 50%)',
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
      },
      animation: {
        pulseGlow: 'pulseGlow 2.4s ease-in-out infinite',
        floaty: 'floaty 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;

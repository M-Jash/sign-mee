/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFDFB',
          100: '#F9F8F6',
          200: '#F3F1EC',
          300: '#EAE8E4',
        },
        slate: {
          700: '#2C3E50',
          800: '#1A252F',
          900: '#1E293B',
        },
        sage: {
          400: '#8BA89C',
          500: '#607D8B',
          600: '#3A7E84',
          700: '#2E6F40',
        },
        sand: {
          400: '#C4BBA8',
          500: '#A89F8C',
        },
        amber: {
          100: '#FAF3E0',
          500: '#D4A547',
          600: '#B8902F',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 20px 40px rgba(142, 151, 140, 0.08)',
        'card-hover': '0 24px 48px rgba(142, 151, 140, 0.14)',
        inner: 'inset 0 1px 2px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'fade-out': 'fade-out 0.5s ease-out forwards',
        'slide-up': 'slide-up 0.5s ease-out forwards',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

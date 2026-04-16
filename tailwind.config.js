/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#B8442E',
        'primary-light': '#D4654F',
        'primary-dark': '#8C3322',
        brand: {
          50: '#FEF5F3',
          100: '#FDE8E3',
          200: '#FBD5CC',
          300: '#F7B5A7',
          400: '#F08B74',
          500: '#E4654A',
          600: '#B8442E',
          700: '#9A3826',
          800: '#7F3123',
          900: '#6A2D23',
        },
        surface: {
          DEFAULT: '#FDFBF7',
          card: '#FEFDFB',
          elevated: '#FFFFFF',
          dark: '#121212',
          'dark-card': '#1E1E1E',
          'dark-elevated': '#2A2A2A',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        chinese: ['Noto Sans SC', 'sans-serif'],
      },
      padding: {
        safe: 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
}

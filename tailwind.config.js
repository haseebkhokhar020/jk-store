/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FFFFFF',
        cream: '#FAF7F2',
        champagne: {
          50: '#FBF7EF',
          100: '#F5EEDC',
          200: '#EADFC3',
          300: '#DCC99A',
          400: '#CDB274',
          500: '#C9A227',
          600: '#A98620',
          700: '#86681B',
          800: '#5F4B15',
          900: '#3A2E0E',
        },
        ink: '#111111',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(17,17,17,0.15)',
        card: '0 4px 24px -6px rgba(17,17,17,0.10)',
      },
    },
  },
  plugins: [],
}

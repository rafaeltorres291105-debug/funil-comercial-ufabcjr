/** @type {import('tailwindcss').Config} */
export default {
  content: [
  "./index.html",
  "./*.{js,ts,jsx,tsx}",
  "./src/**/*.{js,ts,jsx,tsx}",
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      colors: {
        'ufabc-dark': '#2A2A2A',
        'ufabc-green': '#0B4F3A',
        'ufabc-green-light': '#127355',
        'ufabc-yellow': '#FBBF24',
        'ufabc-yellow-hover': '#F59E0B',
        'ufabc-bg': '#F8F9F5',
        'col-diag': '#3B82F6',
        'col-alin': '#D97706',
        'col-prop': '#10B981',
        'col-nego': '#F59E0B',
        'col-cont': '#8B5CF6',
      }
    },
  },
  plugins: [],
}

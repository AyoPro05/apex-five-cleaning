/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#edfdf5',
          100: '#d4f7e5',
          500: '#0f8f68',
          600: '#007a5a',
          700: '#006047',
          800: '#064b39',
        },
        primary: {
          teal: '#0d9488',
          dark: '#0f766e',
          light: '#14b8a6',
        },
        accent: {
          charcoal: '#1f2937',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

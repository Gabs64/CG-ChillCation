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
          black: '#09090b',
          dark: '#121215',
          card: '#18181b',
          border: '#27272a',
          muted: '#3f3f46',
          gray: '#71717a',
          lightgray: '#a1a1aa',
          offwhite: '#e4e4e7',
          white: '#ffffff',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

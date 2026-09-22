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
          black: "#09090b",
          dark: "#09090b",
          card: "#121215",
          border: "#27272a",
          gray: "#71717a",
          lightgray: "#a1a1aa",
          offwhite: "#f4f4f5",
        }
      }
    },
  },
  plugins: [],
}

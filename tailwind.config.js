/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Outfit', 'sans-serif']
      },
      colors: {
        slate: {
          900: '#070C14',
          800: '#0D1625',
          700: '#172439',
        },
        primary: '#A3E635',
        alert: '#EF4444',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        military: {
          50: '#f4f6f4',
          100: '#e3e8e3',
          200: '#c7d1c7',
          300: '#a3b4a3',
          400: '#7a937a',
          500: '#5a6f5a',
          600: '#4a5c4a',
          700: '#3d4b3d',
          800: '#343e34',
          900: '#2d352d',
          950: '#1a1f1a',
        },
        sand: {
          50: '#faf8f3',
          100: '#f3ede0',
          200: '#e6d9bf',
          300: '#d4bf98',
        },
      },
    },
  },
  plugins: [],
}
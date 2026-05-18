/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#F8FAFC',
          dark: '#0F172A',
          DEFAULT: '#4F46E5', // Indigo-600 (sole high-contrast accent)
          muted: '#64748B',
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      shadows: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}

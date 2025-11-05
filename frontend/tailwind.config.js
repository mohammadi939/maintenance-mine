const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e9',
        entry: '#22c55e',
        repair: '#f59e0b',
        exit: '#ef4444',
      },
      fontFamily: {
        sans: ['"Vazirmatn"', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant('rtl', '&[dir="rtl"] &');
      addVariant('ltr', '&[dir="ltr"] &');
    }),
  ],
};

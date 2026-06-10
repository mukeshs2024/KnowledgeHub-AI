/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ebff',
          400: '#60a5fa',
          500: '#3578f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        ink: '#172033',
      },
      boxShadow: {
        soft: '0 12px 32px rgba(31, 45, 61, 0.08)',
      },
    },
  },
  plugins: [],
};

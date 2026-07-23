/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0B1220',
          900: '#0D1B2A',
          800: '#132437',
          700: '#1B2F45',
        },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#2F6FED',
          600: '#2557C7',
          700: '#1E45A0',
        },
        severity: {
          high: '#E5484D',
          medium: '#F5A524',
          low: '#12B76A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.1)',
      },
    },
  },
  plugins: [],
};

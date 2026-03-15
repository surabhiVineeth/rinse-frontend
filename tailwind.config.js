/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#cb6016',
          dark:   '#1e1f21',
        },
      },
      fontFamily: {
        sans: [
          'AvenirNext', 'Avenir Next', 'Avenir',
          '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif',
        ],
      },
      keyframes: {
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'slide-in-up': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.25s ease-out',
        'slide-in-up':    'slide-in-up 0.25s ease-out',
      },
    },
  },
  plugins: [],
}


/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand': {
          'primary': 'var(--brand-primary)',
          'secondary': 'var(--brand-secondary)',
        }
      },
      backgroundColor: {
        'brand': {
          'primary': 'var(--brand-primary)',
          'secondary': 'var(--brand-secondary)',
        }
      },
      textColor: {
        'brand': {
          'primary': 'var(--brand-primary)',
          'secondary': 'var(--brand-secondary)',
        }
      },
      borderColor: {
        'brand': {
          'primary': 'var(--brand-primary)',
          'secondary': 'var(--brand-secondary)',
        }
      },
      ringColor: {
        'brand': {
          'primary': 'var(--brand-primary)',
          'secondary': 'var(--brand-secondary)',
        }
      }
    },
  },
  plugins: [],
}
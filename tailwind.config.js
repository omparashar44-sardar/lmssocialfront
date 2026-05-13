/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        olive: '#556B2F',
        'olive-dark': '#3C4A28',
        beige: '#F5F1E3',
        'off-white': '#FAFAF7',
        accent: '#C9A86A'
      },
      boxShadow: {
        soft: '0 18px 45px rgba(0,0,0,0.08)'
      },
      borderRadius: {
        xl2: '1.25rem'
      }
    }
  },
  plugins: []
};
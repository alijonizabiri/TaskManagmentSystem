/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#4F46E5',
          bg: '#FFFFFF',
          muted: '#F3F4F6',
          text: '#111827',
          success: '#22C55E',
          warning: '#F59E0B',
          info: '#3B82F6'
        }
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(17, 24, 39, 0.06), 0 1px 3px 1px rgba(17, 24, 39, 0.08)'
      }
    }
  },
  plugins: []
}

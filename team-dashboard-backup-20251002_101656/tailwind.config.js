/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#111827', // Dark gray
        surface: '#1F2937',    // Lighter gray
        primary: '#3B82F6',    // Blue
        secondary: '#10B981',  // Green
        accent: '#F59E0B',     // Amber
        'text-primary': '#F9FAFB', // Very light gray
        'text-secondary': '#9CA3AF', // Medium gray
      }
    },
  },
  plugins: [],
}
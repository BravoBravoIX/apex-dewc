module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dashboard-dark': '#121826',
        'sidebar-dark': '#1C2433',
        'panel-dark': '#252D3D',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    // Couleurs statut projet
    'bg-blue-100',   'text-blue-700',
    'bg-orange-100', 'text-orange-700',
    'bg-green-100',  'text-green-700',
    'bg-emerald-700','text-white',
    'bg-red-100',    'text-red-700',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0f5362',
        secondary: '#2a9d8f',
        accent: '#e9c46a',
        danger: '#d62828',
      },
    },
  },
  plugins: [],
};

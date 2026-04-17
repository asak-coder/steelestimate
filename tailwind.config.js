/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}', './lib/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0f1a',
        panel: '#111827',
        panelAlt: '#172033',
        border: 'rgba(148, 163, 184, 0.16)',
        text: '#e5eefc',
        muted: '#94a3b8',
        primary: '#38bdf8',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444'
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(56, 189, 248, 0.12), 0 20px 60px rgba(15, 23, 42, 0.45)'
      }
    }
  },
  plugins: []
};
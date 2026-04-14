const { DISCLAIMER } = require('../constants/appConstants');

const APP_THEME = {
  colors: {
    background: '#0B1220',
    surface: '#111A2E',
    surfaceAlt: '#16223A',
    primary: '#F97316',
    primaryDark: '#C2410C',
    accent: '#38BDF8',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    border: '#26324A',
    shadow: '#020617',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
  },
  typography: {
    title: 30,
    sectionTitle: 20,
    body: 15,
    caption: 12,
    label: 14,
  },
  layout: {
    maxContentWidth: 720,
  },
  disclaimer: DISCLAIMER,
};

module.exports = {
  APP_THEME,
  default: APP_THEME,
  DISCLAIMER,
};
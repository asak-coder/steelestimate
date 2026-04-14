const React = require('react');
const { StyleSheet, Text, View } = require('react-native');
const { COLORS, SPACING, RADIUS } = require('../theme/appTheme');

function FeedbackMessage({ type = 'info', title, message, style }) {
  const palette = {
    success: { bg: '#0F2418', border: COLORS.success, title: '#BBF7D0', body: '#DCFCE7' },
    warning: { bg: '#2A1C10', border: COLORS.warning, title: '#FED7AA', body: '#FFEDD5' },
    danger: { bg: '#2A1212', border: COLORS.danger, title: '#FECACA', body: '#FEE2E2' },
    info: { bg: '#102433', border: COLORS.secondary, title: '#BAE6FD', body: '#E0F2FE' },
  }[type] || { bg: '#102433', border: COLORS.secondary, title: '#BAE6FD', body: '#E0F2FE' };

  return React.createElement(
    View,
    [styles.container, { backgroundColor: palette.bg, borderColor: palette.border }, style],
    title ? React.createElement(Text, { style: [styles.title, { color: palette.title }] }, title) : null,
    message ? React.createElement(Text, { style: [styles.message, { color: palette.body }] }, message) : null
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
  },
});

module.exports = FeedbackMessage;
module.exports.default = FeedbackMessage;
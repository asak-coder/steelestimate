const React = require('react');
const { StyleSheet, Text, View } = require('react-native');
const { COLORS, RADIUS, SPACING } = require('../theme/appTheme');

function InfoCard({ title, subtitle, children, footer, style }) {
  return React.createElement(
    View,
    [styles.card, style],
    title ? React.createElement(Text, { style: styles.title }, title) : null,
    subtitle ? React.createElement(Text, { style: styles.subtitle }, subtitle) : null,
    children,
    footer ? React.createElement(View, { style: styles.footer }, footer) : null
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    marginTop: 12,
  },
});

module.exports = InfoCard;
module.exports.default = InfoCard;
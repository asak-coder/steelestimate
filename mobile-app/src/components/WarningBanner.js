const React = require('react');
const { StyleSheet, Text, View } = require('react-native');
const { COLORS, RADIUS, SPACING } = require('../theme/appTheme');

function WarningBanner({ title = 'Important', message, style }) {
  return React.createElement(
    View,
    [styles.banner, style],
    React.createElement(Text, { style: styles.title }, title),
    React.createElement(Text, { style: styles.message }, message)
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#2A1C10',
    borderColor: COLORS.warning,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  title: {
    color: '#FED7AA',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 4,
  },
  message: {
    color: '#FFEDD5',
    fontSize: 13,
    lineHeight: 19,
  },
});

module.exports = WarningBanner;
module.exports.default = WarningBanner;
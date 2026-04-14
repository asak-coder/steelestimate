const React = require('react');
const { ActivityIndicator, StyleSheet, Text, View } = require('react-native');
const { COLORS } = require('../theme/appTheme');

function FullScreenLoader({ message = 'Loading estimate...' }) {
  return React.createElement(
    View,
    styles.overlay,
    React.createElement(ActivityIndicator, { size: 'large', color: COLORS.primary }),
    React.createElement(Text, { style: styles.text }, message)
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 15, 20, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 50,
  },
  text: {
    marginTop: 12,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

module.exports = FullScreenLoader;
module.exports.default = FullScreenLoader;
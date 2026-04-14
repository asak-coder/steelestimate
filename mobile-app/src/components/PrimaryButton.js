const React = require('react');
const { Pressable, StyleSheet, Text, View } = require('react-native');
const { COLORS, RADIUS } = require('../theme/appTheme');

function PrimaryButton({ title, onPress, variant = 'primary', disabled = false, style, textStyle, leftIcon, rightIcon }) {
  const isSecondary = variant === 'secondary';
  return React.createElement(
    Pressable,
    {
      onPress,
      disabled,
      style: [
        styles.button,
        isSecondary ? styles.secondary : styles.primary,
        disabled && styles.disabled,
        style,
      ],
    },
    React.createElement(
      View,
      { style: styles.inner },
      leftIcon || null,
      React.createElement(Text, { style: [styles.text, isSecondary ? styles.secondaryText : styles.primaryText, textStyle] }, title),
      rightIcon || null
    )
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    fontSize: 15,
    fontWeight: '800',
  },
  primaryText: {
    color: COLORS.black,
  },
  secondaryText: {
    color: COLORS.text,
  },
});

module.exports = PrimaryButton;
module.exports.default = PrimaryButton;
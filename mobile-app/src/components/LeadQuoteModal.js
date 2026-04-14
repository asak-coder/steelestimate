const React = require('react');
const { Modal, Pressable, StyleSheet, Text, View } = require('react-native');
const { COLORS, SPACING, RADIUS } = require('../theme/appTheme');

function LeadQuoteModal({ visible, onClose, onLeadPress, tonnage, title = 'High-value project detected' }) {
  if (!visible) return null;

  return React.createElement(
    Modal,
    { visible, transparent: true, animationType: 'fade', onRequestClose: onClose },
    React.createElement(
      Pressable,
      { style: styles.backdrop, onPress: onClose },
      React.createElement(
        Pressable,
        { style: styles.card, onPress: () => {} },
        React.createElement(Text, { style: styles.title }, title),
        React.createElement(Text, { style: styles.body }, `Estimated tonnage is ${tonnage || 'above threshold'}. Our team can review your project and provide a follow-up quote.`),
        React.createElement(Text, { style: styles.note }, 'This is a preliminary estimation tool. Not for structural design.'),
        React.createElement(
          View,
          style=styles.actions,
          React.createElement(
            Pressable,
            { style: [styles.button, styles.secondary], onPress: onClose },
            React.createElement(Text, { style: styles.secondaryText }, 'Not now')
          ),
          React.createElement(
            Pressable,
            { style: [styles.button, styles.primary], onPress: onLeadPress },
            React.createElement(Text, { style: styles.primaryText }, 'Request quote')
          )
        )
      )
    )
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  note: {
    color: COLORS.warning,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  secondary: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondaryText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 14,
  },
  primaryText: {
    color: COLORS.black,
    fontWeight: '800',
    fontSize: 14,
  },
});

module.exports = LeadQuoteModal;
module.exports.default = LeadQuoteModal;
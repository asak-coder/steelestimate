import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const COLORS = {
  primary: '#0A2540',
  accent: '#F97316',
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',
  successText: '#065F46',
  errorBg: '#FEF2F2',
  errorBorder: '#FECACA',
  errorText: '#991B1B',
  infoBg: '#EFF6FF',
  infoBorder: '#BFDBFE',
  infoText: '#1D4ED8',
  text: '#1F2937',
  muted: '#6B7280',
};

const FeedbackMessage = ({ type = 'info', title, message, style }) => {
  const variant = VARIANTS[type] || VARIANTS.info;

  return (
    <View style={[styles.container, variant.container, style]}>
      <Text style={[styles.title, variant.title]}>{title}</Text>
      {message ? <Text style={[styles.message, variant.message]}>{message}</Text> : null}
    </View>
  );
};

const VARIANTS = {
  success: {
    container: { backgroundColor: COLORS.successBg, borderColor: COLORS.successBorder },
    title: { color: COLORS.successText },
    message: { color: COLORS.successText },
  },
  error: {
    container: { backgroundColor: COLORS.errorBg, borderColor: COLORS.errorBorder },
    title: { color: COLORS.errorText },
    message: { color: COLORS.errorText },
  },
  info: {
    container: { backgroundColor: COLORS.infoBg, borderColor: COLORS.infoBorder },
    title: { color: COLORS.infoText },
    message: { color: COLORS.infoText },
  },
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
    color: COLORS.text,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.muted,
  },
});

export default FeedbackMessage;
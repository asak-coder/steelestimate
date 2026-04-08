import React from 'react';
import { Text, StyleSheet } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { APP_NAME, COLORS } from '../utils/appConstants';

const SplashScreen = () => {
  return (
    <ScreenContainer style={styles.center}>
      <Text style={styles.title}>{APP_NAME}</Text>
      <Text style={styles.subtitle}>Steel estimation made simple</Text>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
});

export default SplashScreen;
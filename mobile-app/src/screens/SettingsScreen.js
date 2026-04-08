import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { COLORS } from '../utils/appConstants';

const SettingsScreen = () => {
  return (
    <ScreenContainer>
      <Text style={styles.heading}>Settings</Text>
      <View style={styles.card}>
        <Text style={styles.text}>Configure app preferences, sync, and support settings.</Text>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  text: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});

export default SettingsScreen;
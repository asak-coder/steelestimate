import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import FeedbackMessage from '../components/FeedbackMessage';
import { COLORS } from '../utils/appConstants';

const EstimateSummaryScreen = () => {
  return (
    <ScreenContainer>
      <Text style={styles.heading}>Estimate Summary</Text>
      <FeedbackMessage
        type="success"
        title="Calculation complete"
        message="Review the steel tonnage, steel weight, and column load in the result screen for a quick summary."
        style={styles.feedback}
      />
      <View style={styles.card}>
        <Text style={styles.text}>Review results, assumptions, and warnings here.</Text>
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
  feedback: {
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

export default EstimateSummaryScreen;
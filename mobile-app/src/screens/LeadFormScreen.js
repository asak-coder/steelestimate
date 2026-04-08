import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const LeadFormScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lead Form</Text>
      <Text style={styles.subtitle}>Please complete your details for a detailed design & fabrication quote.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0A2540',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#1F2937',
    textAlign: 'center',
  },
});

export default LeadFormScreen;
import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const options = [
  { key: 'steel', title: 'Steel Weight Calculator', subtitle: 'Fast structural quantity calculation', route: 'EstimateInput' },
  { key: 'peb', title: 'PEB Estimator', subtitle: 'Pre-engineered building quotation', route: 'EstimateInput', params: { mode: 'peb' } },
];

const CalculatorSelectionScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Choose Calculator</Text>
        <Text style={styles.subtitle}>Select a workflow to estimate steel weight or project cost.</Text>

        {options.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={styles.card}
            onPress={() => navigation.navigate(option.route, option.params || {})}
          >
            <Text style={styles.cardTitle}>{option.title}</Text>
            <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Highlights</Text>
          <Text style={styles.tipText}>Steel Weight and Estimated Cost are shown early so field teams can quote faster.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  container: { padding: 20, paddingBottom: 32 },
  title: { color: '#fff', fontSize: 26, fontWeight: '800' },
  subtitle: { color: '#cbd5e1', marginTop: 6, marginBottom: 18, fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: '#111827',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cardSubtitle: { color: '#cbd5e1', marginTop: 8, fontSize: 13, lineHeight: 18 },
  tipCard: {
    marginTop: 8,
    backgroundColor: '#3b2f14',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f59e0b',
    padding: 16,
  },
  tipTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  tipText: { color: '#fde68a', fontSize: 14, lineHeight: 20 },
});

export default CalculatorSelectionScreen;
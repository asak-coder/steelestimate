import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const materialOptions = [
  { label: 'Mild Steel', value: 'ms' },
  { label: 'Structural Steel', value: 'ss' },
  { label: 'Galvanized Steel', value: 'gs' },
];

const SteelWeightCalculatorScreen = ({ navigation }) => {
  const [material, setMaterial] = useState('ms');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [thickness, setThickness] = useState('');

  const estimate = useMemo(() => {
    const l = Number(length) || 0;
    const w = Number(width) || 0;
    const t = Number(thickness) || 0;
    const weight = l * w * t * 0.00000785;
    return weight > 0 ? weight.toFixed(3) : '0.000';
  }, [length, width, thickness]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Steel Weight Calculator</Text>
        <Text style={styles.subtitle}>Compute fast weight estimates and move straight to quotation.</Text>

        <Text style={styles.label}>Material</Text>
        <View style={styles.pills}>
          {materialOptions.map((item) => (
            <TouchableOpacity key={item.value} style={[styles.pill, material === item.value && styles.pillActive]} onPress={() => setMaterial(item.value)}>
              <Text style={[styles.pillText, material === item.value && styles.pillTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Length</Text>
        <TextInput style={styles.input} value={length} onChangeText={setLength} keyboardType="numeric" placeholder="mm" placeholderTextColor="#64748b" />

        <Text style={styles.label}>Width</Text>
        <TextInput style={styles.input} value={width} onChangeText={setWidth} keyboardType="numeric" placeholder="mm" placeholderTextColor="#64748b" />

        <Text style={styles.label}>Thickness</Text>
        <TextInput style={styles.input} value={thickness} onChangeText={setThickness} keyboardType="numeric" placeholder="mm" placeholderTextColor="#64748b" />

        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Steel Weight</Text>
          <Text style={styles.resultValue}>{estimate} ton</Text>
          <Text style={styles.resultNote}>Estimated Cost will be calculated in the next step.</Text>
        </View>

        <TouchableOpacity style={styles.primaryCta} onPress={() => navigation.navigate('EstimateSummary', { inputs: { material, length, width, thickness } })}>
          <Text style={styles.primaryCtaText}>Get Exact Design & Quote</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  container: { padding: 20, paddingBottom: 32 },
  title: { color: '#fff', fontSize: 26, fontWeight: '800' },
  subtitle: { color: '#cbd5e1', marginTop: 6, marginBottom: 16, fontSize: 14, lineHeight: 20 },
  label: { color: '#e2e8f0', fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: '#111827',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  pillActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  pillText: { color: '#cbd5e1', fontWeight: '700', fontSize: 13 },
  pillTextActive: { color: '#111827' },
  resultCard: {
    marginTop: 20,
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  resultLabel: { color: '#cbd5e1', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  resultValue: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 6 },
  resultNote: { color: '#cbd5e1', fontSize: 13, marginTop: 8 },
  primaryCta: {
    marginTop: 22,
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryCtaText: { color: '#111827', fontWeight: '800', fontSize: 16 },
});

export default SteelWeightCalculatorScreen;
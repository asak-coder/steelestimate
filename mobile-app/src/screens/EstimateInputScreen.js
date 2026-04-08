import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const estimateModes = [
  { label: 'Steel Weight', value: 'steel' },
  { label: 'PEB Estimate', value: 'peb' },
];

const unitOptions = [
  { label: 'Ton', value: 'ton' },
  { label: 'Kg', value: 'kg' },
  { label: 'Piece', value: 'piece' },
];

const EstimateInputScreen = ({ navigation, route }) => {
  const initialMode = route?.params?.mode || 'steel';
  const [mode, setMode] = useState(initialMode);
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [unit, setUnit] = useState('ton');
  const [projectName, setProjectName] = useState('');

  const summary = useMemo(() => {
    const len = Number(length) || 0;
    const wid = Number(width) || 0;
    const hei = Number(height) || 0;
    const estimate = mode === 'steel' ? (len + wid + hei) * 0.85 : (len * wid * hei) * 0.0012;
    return estimate > 0 ? estimate.toFixed(2) : '0.00';
  }, [height, length, mode, width]);

  const handleSubmit = () => {
    navigation.navigate('EstimateSummary', {
      inputs: { mode, length, width, height, unit, projectName },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>Estimate Inputs</Text>
        <Text style={styles.pageSubtitle}>Fast entry for steel weight and PEB calculations.</Text>

        <Text style={styles.label}>Project Name</Text>
        <TextInput style={styles.input} value={projectName} onChangeText={setProjectName} placeholder="Warehouse Shed" placeholderTextColor="#64748b" />

        <Text style={styles.label}>Estimate Type</Text>
        <View style={styles.pills}>
          {estimateModes.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[styles.pill, mode === item.value && styles.pillActive]}
              onPress={() => setMode(item.value)}
            >
              <Text style={[styles.pillText, mode === item.value && styles.pillTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Length</Text>
        <TextInput style={styles.input} value={length} onChangeText={setLength} keyboardType="numeric" placeholder="Enter length" placeholderTextColor="#64748b" />

        <Text style={styles.label}>Width</Text>
        <TextInput style={styles.input} value={width} onChangeText={setWidth} keyboardType="numeric" placeholder="Enter width" placeholderTextColor="#64748b" />

        <Text style={styles.label}>Height / Clear Span</Text>
        <TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" placeholder="Enter height" placeholderTextColor="#64748b" />

        <Text style={styles.label}>Unit</Text>
        <View style={styles.pills}>
          {unitOptions.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[styles.pill, unit === item.value && styles.pillActive]}
              onPress={() => setUnit(item.value)}
            >
              <Text style={[styles.pillText, unit === item.value && styles.pillTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.estimateBox}>
          <Text style={styles.estimateLabel}>Estimated Steel Weight</Text>
          <Text style={styles.estimateValue}>{summary} {unit}</Text>
        </View>

        <TouchableOpacity style={styles.primaryCta} onPress={handleSubmit}>
          <Text style={styles.primaryCtaText}>Get Exact Design & Quote</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  container: { padding: 20, paddingBottom: 32 },
  pageTitle: { color: '#fff', fontSize: 26, fontWeight: '800' },
  pageSubtitle: { color: '#cbd5e1', marginTop: 6, marginBottom: 18, fontSize: 14, lineHeight: 20 },
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
  estimateBox: {
    marginTop: 20,
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  estimateLabel: { color: '#cbd5e1', fontSize: 13 },
  estimateValue: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 6 },
  primaryCta: {
    marginTop: 22,
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryCtaText: { color: '#111827', fontWeight: '800', fontSize: 16 },
});

export default EstimateInputScreen;
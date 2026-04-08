const React = require('react');
const { useState } = React;
const { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } = require('react-native');
const { createEstimate } = require('../services/estimateService');

function PEBEstimatorScreen({ navigation }) {
  const [span, setSpan] = useState('');
  const [length, setLength] = useState('');
  const [height, setHeight] = useState('');
  const [windSpeed, setWindSpeed] = useState('');
  const [bays, setBays] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCalculate = async () => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        span: Number(span),
        length: Number(length),
        height: Number(height),
        windSpeed: Number(windSpeed),
        bays: Number(bays),
      };

      const response = await createEstimate(payload);
      const data = response && response.data ? response.data : response;

      navigation.navigate('EstimateResultScreen', {
        data,
      });
    } catch (err) {
      const message = err && err.message ? err.message : 'Failed to calculate estimate';
      setError(message);
      Alert.alert('Estimate failed', message, [{ text: 'Retry', onPress: handleCalculate }, { text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>PEB Estimator</Text>
      <Text style={styles.subtitle}>Provide project dimensions to generate a live estimate.</Text>

      <TextInput style={styles.input} placeholder="Span" placeholderTextColor="#94a3b8" keyboardType="numeric" value={span} onChangeText={setSpan} />
      <TextInput style={styles.input} placeholder="Length" placeholderTextColor="#94a3b8" keyboardType="numeric" value={length} onChangeText={setLength} />
      <TextInput style={styles.input} placeholder="Height" placeholderTextColor="#94a3b8" keyboardType="numeric" value={height} onChangeText={setHeight} />
      <TextInput style={styles.input} placeholder="Wind Speed" placeholderTextColor="#94a3b8" keyboardType="numeric" value={windSpeed} onChangeText={setWindSpeed} />
      <TextInput style={styles.input} placeholder="Bays" placeholderTextColor="#94a3b8" keyboardType="numeric" value={bays} onChangeText={setBays} />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleCalculate} activeOpacity={0.85} disabled={loading}>
        {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Calculate Estimate</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#b91c1c',
    marginTop: 4,
    marginBottom: 8,
  },
});

module.exports = PEBEstimatorScreen;
module.exports.default = PEBEstimatorScreen;

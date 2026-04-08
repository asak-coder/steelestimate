const React = require('react');
const { useMemo, useState } = React;
const { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } = require('react-native');

function parseNumber(value) {
  const num = Number(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : 0;
}

function SteelCalculatorScreen({ navigation }) {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [thickness, setThickness] = useState('');
  const [density, setDensity] = useState('7850');

  const computed = useMemo(() => {
    const l = parseNumber(length);
    const w = parseNumber(width);
    const t = parseNumber(thickness);
    const d = parseNumber(density) || 7850;
    const volumeM3 = (l * w * t) / 1000000;
    const weightKg = volumeM3 * d;
    const tonnage = weightKg / 1000;
    return {
      weightKg: Number(weightKg.toFixed(2)),
      tonnage: Number(tonnage.toFixed(3)),
    };
  }, [length, width, thickness, density]);

  const handleEstimate = () => {
    if (!parseNumber(length) || !parseNumber(width) || !parseNumber(thickness)) {
      Alert.alert('Missing values', 'Please enter length, width, and thickness.');
      return;
    }

    navigation.navigate('EstimateResultScreen', {
      data: {
        results: {
          steelWeight: computed.weightKg,
          steelTonnage: computed.tonnage,
          windLoad: 0,
          columnLoad: 0,
        },
        assumptions: ['Calculated using plate volume x density.'],
        warnings: ['This is a local calculator output and not a structural design.'],
        source: 'local-calculator',
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Steel Weight Calculator</Text>
      <Text style={styles.subtitle}>Enter dimensions to estimate steel weight quickly.</Text>

      <TextInput
        style={styles.input}
        placeholder="Length (mm)"
        placeholderTextColor="#94a3b8"
        keyboardType="numeric"
        value={length}
        onChangeText={setLength}
      />
      <TextInput
        style={styles.input}
        placeholder="Width (mm)"
        placeholderTextColor="#94a3b8"
        keyboardType="numeric"
        value={width}
        onChangeText={setWidth}
      />
      <TextInput
        style={styles.input}
        placeholder="Thickness (mm)"
        placeholderTextColor="#94a3b8"
        keyboardType="numeric"
        value={thickness}
        onChangeText={setThickness}
      />
      <TextInput
        style={styles.input}
        placeholder="Density (kg/m³)"
        placeholderTextColor="#94a3b8"
        keyboardType="numeric"
        value={density}
        onChangeText={setDensity}
      />

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Estimated Weight</Text>
        <Text style={styles.cardValue}>{computed.weightKg} kg</Text>
        <Text style={styles.cardMeta}>{computed.tonnage} tons</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleEstimate} activeOpacity={0.85}>
        <Text style={styles.buttonText}>View Estimate Result</Text>
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
  card: {
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    marginBottom: 18,
  },
  cardLabel: {
    color: '#334155',
    fontSize: 14,
    marginBottom: 8,
  },
  cardValue: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '800',
  },
  cardMeta: {
    color: '#475569',
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

module.exports = SteelCalculatorScreen;
module.exports.default = SteelCalculatorScreen;

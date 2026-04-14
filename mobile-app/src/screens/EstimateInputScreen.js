const React = require('react');
const { useMemo, useState } = React;
const { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Alert } = require('react-native');
const { createEstimate, shouldTriggerLeadCapture, DEFAULT_TONNAGE_THRESHOLD, DEFAULT_DISCLAIMER } = require('../services/estimateService');

function Field({ label, value, onChangeText, keyboardType, placeholder, multiline }) {
  return React.createElement(View, { style: styles.field },
    React.createElement(Text, style: styles.label, label),
    React.createElement(TextInput, {
      style: [styles.input, multiline && styles.multiline],
      value,
      onChangeText,
      keyboardType,
      placeholder,
      placeholderTextColor: '#7f8c8d',
      multiline,
    })
  );
}

function EstimateInputScreen({ navigation }) {
  const [projectName, setProjectName] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [baseCostPerTon, setBaseCostPerTon] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const payload = useMemo(() => ({
    projectName,
    length,
    width,
    height,
    baseCostPerTon,
    notes,
  }), [projectName, length, width, height, baseCostPerTon, notes]);

  const onEstimate = async () => {
    setLoading(true);
    try {
      const result = await createEstimate(payload);
      const shouldCaptureLead = shouldTriggerLeadCapture(result, DEFAULT_TONNAGE_THRESHOLD);
      navigation.navigate('EstimateResultScreen', {
        result,
        shouldCaptureLead,
      });
    } catch (error) {
      Alert.alert('Estimate failed', error.message || 'Unable to create estimate.');
    } finally {
      setLoading(false);
    }
  };

  return React.createElement(ScrollView, { style: styles.container, contentContainerStyle: styles.content },
    React.createElement(Text, style: styles.title, 'Steel Estimate'),
    React.createElement(Text, style: styles.disclaimer, DEFAULT_DISCLAIMER),
    React.createElement(Field, { label: 'Project name', value: projectName, onChangeText: setProjectName, placeholder: 'Warehouse expansion' }),
    React.createElement(Field, { label: 'Length (m)', value: length, onChangeText: setLength, keyboardType: 'numeric', placeholder: '30' }),
    React.createElement(Field, { label: 'Width (m)', value: width, onChangeText: setWidth, keyboardType: 'numeric', placeholder: '20' }),
    React.createElement(Field, { label: 'Height (m)', value: height, onChangeText: setHeight, keyboardType: 'numeric', placeholder: '8' }),
    React.createElement(Field, { label: 'Base cost / ton', value: baseCostPerTon, onChangeText: setBaseCostPerTon, keyboardType: 'numeric', placeholder: '95000' }),
    React.createElement(Field, { label: 'Notes', value: notes, onChangeText: setNotes, placeholder: 'Optional notes', multiline: true }),
    React.createElement(Pressable, { style: styles.button, onPress: onEstimate, disabled: loading },
      React.createElement(Text, style: styles.buttonText, loading ? 'Calculating...' : 'Generate estimate')
    )
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111821' },
  content: { padding: 20, gap: 14 },
  title: { color: '#f5f7fa', fontSize: 28, fontWeight: '700' },
  disclaimer: { color: '#f0c674', fontSize: 13, lineHeight: 18 },
  field: { gap: 8 },
  label: { color: '#e8ecef', fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: '#1a2430', borderColor: '#304050', borderWidth: 1, borderRadius: 12, color: '#fff', paddingHorizontal: 14, paddingVertical: 12 },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  button: { backgroundColor: '#f0c674', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#101820', fontWeight: '700', fontSize: 16 },
});

module.exports = EstimateInputScreen;
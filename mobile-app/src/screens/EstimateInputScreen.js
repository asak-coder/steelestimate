import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';

const SOIL_TYPES = ['Hard Soil', 'Medium Soil', 'Soft Soil', 'Rock'];
const DESIGN_CODES = ['IS800', 'AISC', 'Eurocode'];
const UNIT_SYSTEMS = ['Metric', 'Imperial'];

const EstimateInputScreen = ({ navigation, route }) => {
  const [form, setForm] = useState({
    length: route?.params?.projectData?.length?.toString?.() ?? '',
    width: route?.params?.projectData?.width?.toString?.() ?? '',
    height: route?.params?.projectData?.height?.toString?.() ?? '',
    soilType: route?.params?.projectData?.soilType ?? SOIL_TYPES[0],
    designCode: route?.params?.projectData?.designCode ?? DESIGN_CODES[0],
    unitSystem: route?.params?.projectData?.unitSystem ?? UNIT_SYSTEMS[0]
  });

  const isValid = useMemo(() => {
    const length = Number(form.length);
    const width = Number(form.width);
    const height = Number(form.height);
    return length > 0 && width > 0 && height > 0;
  }, [form]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const goNext = () => {
    if (!isValid) {
      Alert.alert('Invalid input', 'Please enter valid dimensions before continuing.');
      return;
    }

    navigation.navigate('LeadCapture', {
      projectData: {
        length: Number(form.length),
        width: Number(form.width),
        height: Number(form.height),
        soilType: form.soilType,
        designCode: form.designCode,
        unitSystem: form.unitSystem
      }
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Estimate Inputs</Text>
      <Text style={styles.subheader}>Provide the core geometry and design preferences for the analysis.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Length</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={form.length} onChangeText={(value) => setField('length', value)} placeholder="Enter length" placeholderTextColor="#7C8CA1" />

        <Text style={styles.label}>Width</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={form.width} onChangeText={(value) => setField('width', value)} placeholder="Enter width" placeholderTextColor="#7C8CA1" />

        <Text style={styles.label}>Height</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={form.height} onChangeText={(value) => setField('height', value)} placeholder="Enter height" placeholderTextColor="#7C8CA1" />

        <Text style={styles.label}>Soil Type</Text>
        <View style={styles.pillsRow}>
          {SOIL_TYPES.map((item) => (
            <Pressable key={item} style={[styles.pill, form.soilType === item && styles.pillActive]} onPress={() => setField('soilType', item)}>
              <Text style={[styles.pillText, form.soilType === item && styles.pillTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Design Code</Text>
        <View style={styles.pillsRow}>
          {DESIGN_CODES.map((item) => (
            <Pressable key={item} style={[styles.pill, form.designCode === item && styles.pillActive]} onPress={() => setField('designCode', item)}>
              <Text style={[styles.pillText, form.designCode === item && styles.pillTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Unit System</Text>
        <View style={styles.pillsRow}>
          {UNIT_SYSTEMS.map((item) => (
            <Pressable key={item} style={[styles.pill, form.unitSystem === item && styles.pillActive]} onPress={() => setField('unitSystem', item)}>
              <Text style={[styles.pillText, form.unitSystem === item && styles.pillTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={[styles.button, !isValid && styles.buttonDisabled]} onPress={goNext} disabled={!isValid}>
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EEF3F8',
    padding: 20,
    paddingBottom: 32
  },
  header: {
    color: '#102033',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8
  },
  subheader: {
    color: '#5E6E82',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D8E1EB'
  },
  label: {
    color: '#1E2D41',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8
  },
  input: {
    backgroundColor: '#F5F8FC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#102033',
    borderWidth: 1,
    borderColor: '#D8E1EB'
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#EDF3FA',
    borderWidth: 1,
    borderColor: '#D8E1EB'
  },
  pillActive: {
    backgroundColor: '#4DA3FF',
    borderColor: '#4DA3FF'
  },
  pillText: {
    color: '#3D4C5F',
    fontWeight: '700'
  },
  pillTextActive: {
    color: '#FFFFFF'
  },
  button: {
    marginTop: 22,
    backgroundColor: '#111A2E',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center'
  },
  buttonDisabled: {
    opacity: 0.45
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800'
  }
});

export default EstimateInputScreen;
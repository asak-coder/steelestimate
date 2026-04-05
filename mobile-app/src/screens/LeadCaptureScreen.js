import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';

const LeadCaptureScreen = ({ navigation, route }) => {
  const projectData = route?.params?.projectData ?? {};
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    requirement: ''
  });

  const isValid = useMemo(() => {
    return (
      form.name.trim().length > 1 &&
      form.phone.trim().length >= 8 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
      form.city.trim().length > 1 &&
      form.requirement.trim().length > 3
    );
  }, [form]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const goNext = () => {
    if (!isValid) {
      Alert.alert('Invalid input', 'Please complete all lead details before continuing.');
      return;
    }

    navigation.navigate('Loading', {
      projectData,
      leadData: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        city: form.city.trim(),
        requirement: form.requirement.trim()
      }
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Lead Capture</Text>
      <Text style={styles.subheader}>Share contact details so the quotation can be delivered instantly.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={form.name} onChangeText={(value) => setField('name', value)} placeholder="Your name" placeholderTextColor="#7C8CA1" />

        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={form.phone} keyboardType="phone-pad" onChangeText={(value) => setField('phone', value)} placeholder="Phone number" placeholderTextColor="#7C8CA1" />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={form.email} keyboardType="email-address" autoCapitalize="none" onChangeText={(value) => setField('email', value)} placeholder="Email address" placeholderTextColor="#7C8CA1" />

        <Text style={styles.label}>City</Text>
        <TextInput style={styles.input} value={form.city} onChangeText={(value) => setField('city', value)} placeholder="City" placeholderTextColor="#7C8CA1" />

        <Text style={styles.label}>Requirement</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.requirement}
          onChangeText={(value) => setField('requirement', value)}
          placeholder="Project requirement"
          placeholderTextColor="#7C8CA1"
          multiline
        />

        <Pressable style={[styles.button, !isValid && styles.buttonDisabled]} onPress={goNext} disabled={!isValid}>
          <Text style={styles.buttonText}>Generate Estimate</Text>
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
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top'
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

export default LeadCaptureScreen;
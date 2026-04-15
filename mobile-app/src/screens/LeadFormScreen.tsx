import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import InputField from '../components/InputField';
import { createLead, LeadPayload } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'LeadForm'>;

type FormErrors = Partial<Record<keyof LeadPayload, string>>;

const initialFormState: LeadPayload = {
  name: '',
  phone: '',
  company: '',
  requirement: '',
};

const LeadFormScreen: React.FC<Props> = ({ navigation }) => {
  const [form, setForm] = useState<LeadPayload>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validate = () => {
    const nextErrors: FormErrors = {};
    const phoneRegex = /^[0-9]{10,15}$/;

    if (!form.name.trim()) nextErrors.name = 'Name is required';
    if (!form.phone.trim()) nextErrors.phone = 'Phone is required';
    else if (!phoneRegex.test(form.phone.trim())) {
      nextErrors.phone = 'Enter a valid phone number';
    }
    if (!form.company.trim()) nextErrors.company = 'Company is required';
    if (!form.requirement.trim()) {
      nextErrors.requirement = 'Requirement is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (field: keyof LeadPayload, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      setSuccessMessage('');
      await createLead({
        name: form.name.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        requirement: form.requirement.trim(),
      });
      setSuccessMessage('Lead submitted successfully');
      setForm(initialFormState);
      setTimeout(() => navigation.navigate('Dashboard'), 500);
    } catch (error) {
      Alert.alert('Submission failed', error instanceof Error ? error.message : 'Unable to submit lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Lead</Text>
        <Text style={styles.subtitle}>Enter customer details and service requirements</Text>

        <InputField
          label="Name"
          value={form.name}
          onChangeText={value => handleChange('name', value)}
          placeholder="Enter name"
          error={errors.name}
        />
        <InputField
          label="Phone"
          value={form.phone}
          onChangeText={value => handleChange('phone', value)}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          error={errors.phone}
        />
        <InputField
          label="Company"
          value={form.company}
          onChangeText={value => handleChange('company', value)}
          placeholder="Enter company"
          error={errors.company}
        />
        <InputField
          label="Requirement"
          value={form.requirement}
          onChangeText={value => handleChange('requirement', value)}
          placeholder="Enter requirement"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={styles.textArea}
          error={errors.requirement}
        />

        {!!successMessage && <Text style={styles.success}>{successMessage}</Text>}

        <Button title="Submit Lead" onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 24,
  },
  textArea: {
    minHeight: 110,
  },
  success: {
    marginBottom: 16,
    color: '#059669',
    fontWeight: '600',
  },
});

export default LeadFormScreen;

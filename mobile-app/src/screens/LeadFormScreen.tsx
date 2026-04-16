import React, { useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
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
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [form, setForm] = useState<LeadPayload>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const formSections = useMemo(
    () => [
      {
        title: 'Basic Details',
        fields: ['name', 'phone'],
      },
      {
        title: 'Company & Requirement',
        fields: ['company', 'requirement'],
      },
    ],
    [],
  );

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
      <ScrollView
        contentContainerStyle={[
          styles.content,
          isTablet && styles.contentTablet,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, isTablet && styles.cardTablet]}>
          <Text style={styles.kicker}>Lead Intake</Text>
          <Text style={styles.title}>Create Lead</Text>
          <Text style={styles.subtitle}>
            Enter customer details and service requirements.
          </Text>

          {formSections.map(section => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>

              {section.fields.indexOf('name') !== -1 && (
                <InputField
                  label="Name"
                  value={form.name}
                  onChangeText={value => handleChange('name', value)}
                  placeholder="Enter name"
                  error={errors.name}
                />
              )}

              {section.fields.indexOf('phone') !== -1 && (
                <InputField
                  label="Phone"
                  value={form.phone}
                  onChangeText={value => handleChange('phone', value)}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  error={errors.phone}
                />
              )}

              {section.fields.indexOf('company') !== -1 && (
                <InputField
                  label="Company"
                  value={form.company}
                  onChangeText={value => handleChange('company', value)}
                  placeholder="Enter company"
                  error={errors.company}
                />
              )}

              {section.fields.indexOf('requirement') !== -1 && (
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
              )}
            </View>
          ))}

          {!!successMessage && (
            <Text style={styles.success}>{successMessage}</Text>
          )}

          <Button title="Submit Lead" onPress={handleSubmit} loading={loading} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  content: {
    padding: 20,
  },
  contentTablet: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 5,
  },
  cardTablet: {
    maxWidth: 860,
    width: '100%',
    padding: 32,
  },
  kicker: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 24,
  },
  section: {
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  textArea: {
    minHeight: 120,
  },
  success: {
    marginBottom: 16,
    color: '#059669',
    fontWeight: '700',
  },
});

export default LeadFormScreen;

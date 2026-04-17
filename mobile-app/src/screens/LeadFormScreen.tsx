import React, { useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  ViewStyle,
} from 'react-native';
import Button from '../components/Button';
import InputField from '../components/InputField';
import { createLead, LeadPayload, UnitSystem } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LeadForm'>;

type FormErrors = Partial<Record<keyof LeadPayload, string>>;

const initialFormState: LeadPayload = {
  name: '',
  phone: '',
  company: '',
  requirement: '',
  unitSystem: 'metric',
};

const LeadFormScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [form, setForm] = useState<LeadPayload>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');

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

  const handleUnitChange = (value: UnitSystem) => {
    setUnitSystem(value);
    setForm(prev => ({ ...prev, unitSystem: value }));
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
        unitSystem: unitSystem || 'metric',
      });
      setSuccessMessage('Lead submitted successfully');
      setForm(initialFormState);
      setTimeout(() => navigation.navigate('Dashboard'), 500);
    } catch (error) {
      Alert.alert(
        'Submission failed',
        error instanceof Error ? error.message : 'Unable to submit lead',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            isTablet && styles.contentTablet,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={[styles.card, isTablet && styles.cardTablet]}>
            <Text style={styles.kicker}>Lead Intake</Text>
            <Text style={styles.title}>Create Lead</Text>
            <Text style={styles.subtitle}>
              Enter customer details and service requirements.
            </Text>

            <View style={styles.unitRow}>
              <Text style={styles.sectionTitle}>Unit System</Text>
              <View style={styles.unitPills}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: unitSystem === 'metric' }}
                  onPress={() => handleUnitChange('metric')}
                  style={({ pressed }) => [
                    styles.unitButton,
                    styles.unitButtonBase,
                    unitSystem === 'metric' && styles.unitButtonActive,
                    pressed && styles.unitButtonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      unitSystem === 'metric' && styles.unitButtonTextActive,
                    ]}
                  >
                    Metric
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: unitSystem === 'imperial' }}
                  onPress={() => handleUnitChange('imperial')}
                  style={({ pressed }) => [
                    styles.unitButton,
                    styles.unitButtonBase,
                    unitSystem === 'imperial' && styles.unitButtonActive,
                    pressed && styles.unitButtonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      unitSystem === 'imperial' &&
                        styles.unitButtonTextActive,
                    ]}
                  >
                    Imperial
                  </Text>
                </Pressable>
              </View>
            </View>

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

            <Button
              title="Submit Lead"
              onPress={handleSubmit}
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.xl,
  },
  contentTablet: {
    paddingHorizontal: theme.spacing.xxxl,
    alignItems: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xxl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 5,
  },
  cardTablet: {
    maxWidth: 860,
    width: '100%',
    padding: theme.spacing.xxxl,
  },
  kicker: {
    color: theme.colors.primary,
    fontSize: theme.typography.kicker,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.titleMd,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.xxl,
  },
  section: {
    marginBottom: theme.spacing.xs,
  },
  unitRow: {
    marginBottom: theme.spacing.lg,
  },
  unitPills: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  unitButton: {
    flex: 1,
    minWidth: 0,
  },
  unitButtonBase: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  unitButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceMuted,
  },
  unitButtonPressed: {
    opacity: 0.88,
  },
  unitButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    fontWeight: '700',
  },
  unitButtonTextActive: {
    color: theme.colors.primary,
  },
  sectionTitle: {
    fontSize: theme.typography.body,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  textArea: {
    minHeight: 120,
  },
  success: {
    marginBottom: theme.spacing.lg,
    color: theme.colors.success,
    fontWeight: '700',
  },
});

export default LeadFormScreen;

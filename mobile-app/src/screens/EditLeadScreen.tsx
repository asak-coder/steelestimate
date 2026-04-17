import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { api, Lead, LeadStatus } from '../services/api';
import { theme } from '../theme/theme';

type RootStackParamList = {
  Dashboard: undefined;
  LeadForm: undefined;
  EditLead: { leadId: string; lead?: Lead };
};

type Props = NativeStackScreenProps<RootStackParamList, 'EditLead'>;

const STATUS_OPTIONS: LeadStatus[] = ['NEW', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];

export const EditLeadScreen: React.FC<Props> = ({ navigation, route }) => {
  const leadId = route.params?.leadId;
  const initialLead = route.params?.lead;

  const [lead, setLead] = useState<Lead | null>(initialLead ?? null);
  const [loading, setLoading] = useState(!initialLead);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientName, setClientName] = useState(initialLead?.clientName ?? initialLead?.name ?? '');
  const [company, setCompany] = useState(initialLead?.company ?? '');
  const [phone, setPhone] = useState(initialLead?.phone ?? '');
  const [email, setEmail] = useState(initialLead?.email ?? '');
  const [projectData, setProjectData] = useState(
    typeof initialLead?.projectData === 'string'
      ? initialLead.projectData
      : initialLead?.projectData
      ? JSON.stringify(initialLead.projectData, null, 2)
      : '',
  );
  const [boq, setBoq] = useState(
    typeof initialLead?.boq === 'string'
      ? initialLead.boq
      : initialLead?.boq
      ? JSON.stringify(initialLead.boq, null, 2)
      : '',
  );
  const [cost, setCost] = useState(
    initialLead?.cost !== undefined && initialLead?.cost !== null ? String(initialLead.cost) : '',
  );
  const [quotationText, setQuotationText] = useState(initialLead?.quotationText ?? '');
  const [score, setScore] = useState(
    initialLead?.score !== undefined && initialLead?.score !== null ? String(initialLead.score) : '',
  );
  const [tag, setTag] = useState(initialLead?.tag ?? '');
  const [optimizedPrice, setOptimizedPrice] = useState(
    initialLead?.optimizedPrice !== undefined && initialLead?.optimizedPrice !== null
      ? String(initialLead.optimizedPrice)
      : '',
  );
  const [marginSuggestion, setMarginSuggestion] = useState(initialLead?.marginSuggestion ?? '');
  const [pricingJustification, setPricingJustification] = useState(initialLead?.pricingJustification ?? '');
  const [status, setStatus] = useState<LeadStatus>(normalizeStatus(initialLead?.status) ?? 'NEW');

  useEffect(() => {
    let mounted = true;

    const fetchLead = async () => {
      if (!leadId || initialLead) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await api.getLeadById(leadId);
        if (!mounted) {
          return;
        }
        const fetchedLead = response?.data ?? response;
        setLead(fetchedLead);
        setClientName(fetchedLead?.clientName ?? fetchedLead?.name ?? '');
        setCompany(fetchedLead?.company ?? '');
        setPhone(fetchedLead?.phone ?? '');
        setEmail(fetchedLead?.email ?? '');
        setProjectData(
          typeof fetchedLead?.projectData === 'string'
            ? fetchedLead.projectData
            : fetchedLead?.projectData
            ? JSON.stringify(fetchedLead.projectData, null, 2)
            : '',
        );
        setBoq(
          typeof fetchedLead?.boq === 'string'
            ? fetchedLead.boq
            : fetchedLead?.boq
            ? JSON.stringify(fetchedLead.boq, null, 2)
            : '',
        );
        setCost(fetchedLead?.cost !== undefined && fetchedLead?.cost !== null ? String(fetchedLead.cost) : '');
        setQuotationText(fetchedLead?.quotationText ?? '');
        setScore(fetchedLead?.score !== undefined && fetchedLead?.score !== null ? String(fetchedLead.score) : '');
        setTag(fetchedLead?.tag ?? '');
        setOptimizedPrice(
          fetchedLead?.optimizedPrice !== undefined && fetchedLead?.optimizedPrice !== null
            ? String(fetchedLead.optimizedPrice)
            : '',
        );
        setMarginSuggestion(fetchedLead?.marginSuggestion ?? '');
        setPricingJustification(fetchedLead?.pricingJustification ?? '');
        setStatus(normalizeStatus(fetchedLead?.status) ?? 'NEW');
      } catch (err: any) {
        if (!mounted) {
          return;
        }
        setError(err?.message || 'Failed to load lead');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchLead();

    return () => {
      mounted = false;
    };
  }, [initialLead, leadId]);

  const subtitle = useMemo(() => {
    return lead?.clientName || lead?.name || 'Lead details';
  }, [lead]);

  const handleSave = async () => {
    if (!leadId) {
      Alert.alert('Missing lead', 'Unable to edit this lead right now.');
      return;
    }
    if (saving) {
      return;
    }

    const payload: Record<string, any> = {
      status,
      clientName: clientName.trim(),
      company: company.trim(),
      phone: phone.trim(),
      email: email.trim(),
      quotationText: quotationText.trim(),
      tag: tag.trim(),
      marginSuggestion: marginSuggestion.trim(),
      pricingJustification: pricingJustification.trim(),
    };

    if (projectData.trim()) {
      payload.projectData = parseJsonMaybe(projectData.trim());
    }
    if (boq.trim()) {
      payload.boq = parseJsonMaybe(boq.trim());
    }
    if (cost.trim() !== '') {
      payload.cost = Number(cost);
    }
    if (score.trim() !== '') {
      payload.score = Number(score);
    }
    if (optimizedPrice.trim() !== '') {
      payload.optimizedPrice = Number(optimizedPrice);
    }

    try {
      setSaving(true);
      setError(null);
      const response = await api.updateLead(leadId, payload);
      const updatedLead = response?.data ?? response;
      Alert.alert('Success', 'Lead updated successfully');
      navigation.goBack();
      if (updatedLead) {
        setLead(updatedLead);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save lead');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.centerText}>Loading lead...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Edit Lead</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.statusChip, status === option && styles.statusChipActive]}
                onPress={() => setStatus(option)}
              >
                <Text style={[styles.statusChipText, status === option && styles.statusChipTextActive]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <InputField label="Client Name" value={clientName} onChangeText={setClientName} placeholder="Enter client name" />
        <InputField label="Company" value={company} onChangeText={setCompany} placeholder="Enter company" />
        <InputField label="Phone" value={phone} onChangeText={setPhone} placeholder="Enter phone number" keyboardType="phone-pad" />
        <InputField label="Email" value={email} onChangeText={setEmail} placeholder="Enter email" keyboardType="email-address" autoCapitalize="none" />
        <InputField label="Quotation Text" value={quotationText} onChangeText={setQuotationText} placeholder="Enter quotation details" multiline />
        <InputField label="Tag" value={tag} onChangeText={setTag} placeholder="Enter tag" />
        <InputField label="Cost" value={cost} onChangeText={setCost} placeholder="Enter cost" keyboardType="numeric" />
        <InputField label="Score" value={score} onChangeText={setScore} placeholder="Enter score" keyboardType="numeric" />
        <InputField label="Optimized Price" value={optimizedPrice} onChangeText={setOptimizedPrice} placeholder="Enter optimized price" keyboardType="numeric" />
        <InputField label="Margin Suggestion" value={marginSuggestion} onChangeText={setMarginSuggestion} placeholder="Enter margin suggestion" multiline />
        <InputField label="Pricing Justification" value={pricingJustification} onChangeText={setPricingJustification} placeholder="Enter pricing justification" multiline />
        <InputField label="Project Data (JSON)" value={projectData} onChangeText={setProjectData} placeholder="Optional JSON" multiline />
        <InputField label="BOQ (JSON)" value={boq} onChangeText={setBoq} placeholder="Optional JSON" multiline />

        <Button title={saving ? 'Saving...' : 'Save Changes'} onPress={handleSave} disabled={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

function normalizeStatus(status?: string | null): LeadStatus | null {
  const value = String(status || '').toUpperCase();
  if (value === 'NEW' || value === 'IN_PROGRESS' || value === 'COMPLETED' || value === 'REJECTED') {
    return value;
  }
  return null;
}

function parseJsonMaybe(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  section: {
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statusChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  statusChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  statusChipTextActive: {
    color: theme.colors.white,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  centerText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
});
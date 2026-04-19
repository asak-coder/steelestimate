import React, { useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import Button from '../components/Button';
import { RootStackParamList } from '../navigation/AppNavigator';
import { api, EstimateRequest, EstimateResponse } from '../services/api';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Estimate'>;

const projectTypes = ['PEB Shed', 'Industrial Building', 'Warehouse', 'Mezzanine', 'Canopy'];
const clientTypes = ['General Contractor', 'Developer', 'Industrial Owner', 'Government', 'Consultant'];

const formatCurrency = (value?: number | string | null) => {
  const numeric = typeof value === 'number' ? value : Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isNaN(numeric) ? 0 : numeric);
};

const formatPercent = (value?: number | string | null) => {
  const numeric = typeof value === 'number' ? value : Number(value || 0);
  if (Number.isNaN(numeric)) return '—';
  return `${numeric.toFixed(1)}%`;
};

const EstimateScreen: React.FC<Props> = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [form, setForm] = useState<EstimateRequest>({
    projectType: 'PEB Shed',
    tonnage: 100,
    height: 12,
    clientType: 'General Contractor',
    hazard: false,
    width: 30,
    length: 60,
    workType: 'Fabrication + Erection',
    locationType: 'Urban',
    shutdown: false,
    nightShift: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<EstimateResponse | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(form.projectType && form.clientType && form.tonnage > 0 && form.height > 0);
  }, [form]);

  const updateField = <K extends keyof EstimateRequest>(key: K, value: EstimateRequest[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.runOrchestrator(form);
      const payload = response?.data || response;
      if (!payload) {
        throw new Error('Unable to calculate estimate.');
      }
      setResult(payload.data || payload);
    } catch (err) {
      Alert.alert(
        'Estimate failed',
        err instanceof Error ? err.message : 'Unable to calculate estimate',
      );
      setError(err instanceof Error ? err.message : 'Unable to calculate estimate');
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
          contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, isTablet && styles.cardTablet]}>
            <Text style={styles.kicker}>Quotation engine</Text>
            <Text style={styles.title}>Run estimate</Text>
            <Text style={styles.subtitle}>
              Submit project parameters to the orchestrator and review BOQ, cost, margin, strategy, and win probability.
            </Text>

            <View style={styles.grid}>
              <View style={styles.field}>
                <Text style={styles.label}>Project Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.pillRow}>
                    {projectTypes.map(item => (
                      <Text
                        key={item}
                        onPress={() => updateField('projectType', item)}
                        style={[
                          styles.pill,
                          form.projectType === item && styles.pillActive,
                        ]}
                      >
                        {item}
                      </Text>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Client Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.pillRow}>
                    {clientTypes.map(item => (
                      <Text
                        key={item}
                        onPress={() => updateField('clientType', item)}
                        style={[
                          styles.pill,
                          form.clientType === item && styles.pillActive,
                        ]}
                      >
                        {item}
                      </Text>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.twoCol}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>Tonnage</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={String(form.tonnage)}
                    onChangeText={value => updateField('tonnage', Number(value) || 0)}
                    placeholder="100"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>Height</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={String(form.height)}
                    onChangeText={value => updateField('height', Number(value) || 0)}
                    placeholder="12"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.twoCol}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>Width</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={String(form.width ?? '')}
                    onChangeText={value => updateField('width', value ? Number(value) : undefined)}
                    placeholder="30"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>Length</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={String(form.length ?? '')}
                    onChangeText={value => updateField('length', value ? Number(value) : undefined)}
                    placeholder="60"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.twoCol}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>Work Type</Text>
                  <TextInput
                    style={styles.input}
                    value={form.workType || ''}
                    onChangeText={value => updateField('workType', value)}
                    placeholder="Fabrication + Erection"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>Location Type</Text>
                  <TextInput
                    style={styles.input}
                    value={form.locationType || ''}
                    onChangeText={value => updateField('locationType', value)}
                    placeholder="Urban"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.toggleRow}>
                <Button
                  title={form.hazard ? 'Hazard: On' : 'Hazard: Off'}
                  onPress={() => updateField('hazard', !form.hazard)}
                />
                <Button
                  title={form.shutdown ? 'Shutdown: On' : 'Shutdown: Off'}
                  onPress={() => updateField('shutdown', !form.shutdown)}
                />
                <Button
                  title={form.nightShift ? 'Night: On' : 'Night: Off'}
                  onPress={() => updateField('nightShift', !form.nightShift)}
                />
              </View>

              {!!error && <Text style={styles.error}>{error}</Text>}

              <Button title={loading ? 'Calculating...' : 'Run estimate'} onPress={handleSubmit} loading={loading} />
            </View>
          </View>

          {result ? (
            <View style={[styles.resultCard, isTablet && styles.cardTablet]}>
              <Text style={styles.sectionTitle}>Results</Text>

              <View style={styles.resultGrid}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Final Amount</Text>
                  <Text style={styles.metricValue}>{formatCurrency(result.finalAmount)}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Cost</Text>
                  <Text style={styles.metricValue}>{formatCurrency(result.cost)}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Margin</Text>
                  <Text style={styles.metricValue}>{formatPercent(result.recommendedMargin)}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Win Probability</Text>
                  <Text style={styles.metricValue}>{formatPercent(result.winProbability)}</Text>
                </View>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Strategy</Text>
                <Text style={styles.infoValue}>{result.strategy || 'Balanced competitive bid'}</Text>
                <Text style={styles.infoMeta}>Risk: {result.riskLevel || 'Moderate'}</Text>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Cost breakdown</Text>
                {Object.entries(result.costBreakdown || {}).map(([key, value]) => (
                  <View key={key} style={styles.breakdownRow}>
                    <Text style={styles.breakdownKey}>{key}</Text>
                    <Text style={styles.breakdownValue}>
                      {typeof value === 'number' ? formatCurrency(value) : String(value)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>BOQ</Text>
                {(result.boq || []).map((row, index) => (
                  <View key={`${row.item || 'row'}-${index}`} style={styles.boqRow}>
                    <Text style={styles.boqTitle}>{row.item || 'Item'}</Text>
                    <Text style={styles.boqMeta}>
                      {row.unit || '—'} • Qty {row.quantity ?? '—'} • {formatCurrency(row.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
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
    gap: theme.spacing.xl,
  },
  contentTablet: {
    paddingHorizontal: theme.spacing.xxxl,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xxl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTablet: {
    maxWidth: 960,
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
    color: theme.colors.text,
    fontSize: theme.typography.titleMd,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    lineHeight: 22,
    marginBottom: theme.spacing.xxl,
  },
  grid: {
    gap: theme.spacing.lg,
  },
  field: {
    gap: theme.spacing.sm,
  },
  fieldHalf: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  twoCol: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  label: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },
  pillRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  pill: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    color: theme.colors.textSecondary,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    overflow: 'hidden',
  },
  pillActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceMuted,
    color: theme.colors.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  error: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
  resultCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xxl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.titleMd,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
  },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  metric: {
    minWidth: '48%',
    flexGrow: 1,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: theme.spacing.xs,
  },
  infoBox: {
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  infoLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoValue: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: '700',
  },
  infoMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  breakdownKey: {
    color: theme.colors.textSecondary,
    flex: 1,
  },
  breakdownValue: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  boqRow: {
    gap: 2,
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  boqTitle: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  boqMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
});

export default EstimateScreen;
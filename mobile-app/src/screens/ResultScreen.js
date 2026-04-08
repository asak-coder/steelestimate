import React, { useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FeedbackMessage from '../components/FeedbackMessage';
import FullScreenLoader from '../components/FullScreenLoader';

const ResultScreen = ({ navigation, route }) => {
  const inputs = route?.params?.inputs || {};
  const resultData = route?.params?.resultData || {};
  const loading = Boolean(route?.params?.loading);
  const error = route?.params?.error || null;
  const [retrying, setRetrying] = useState(false);

  const metrics = useMemo(() => ({
    steelTonnage: resultData?.steelTonnage ?? inputs?.steelTonnage ?? 24.8,
    steelWeight: resultData?.steelWeight ?? inputs?.steelWeight ?? 24.8,
    columnLoad: resultData?.columnLoad ?? inputs?.columnLoad ?? 0,
  }), [inputs, resultData]);

  const errorMessage = useMemo(() => {
    const status = error?.status || error?.response?.status;
    const message = String(error?.message || '').toLowerCase();
    if (!error) return '';
    if (message.includes('timeout') || status === 408) return 'The estimate request timed out. Please check your connection and try again.';
    if (message.includes('network') || message.includes('offline') || message.includes('fetch')) return 'Network error detected. Please reconnect and retry the estimate.';
    if (message.includes('invalid') || message.includes('validation')) return 'Some input values are invalid. Please review the project data and try again.';
    if (message.includes('empty') || message.includes('no data')) return 'The server returned an empty response. Please retry the calculation.';
    return error.message || 'Unable to generate the estimate right now. Please retry.';
  }, [error]);

  const handleRetry = () => {
    if (typeof navigation?.goBack === 'function') {
      navigation.goBack();
      return;
    }
    navigation.navigate('EstimateInput', { retry: true, inputs });
  };

  const handleLead = async () => {
    setRetrying(true);
    try {
      navigation.navigate('LeadCapture', { inputs: { ...inputs, ...resultData } });
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <FullScreenLoader
        title="Generating your estimate"
        subtitle="We are processing the project inputs and preparing the result summary."
        message="This screen will update automatically once the calculation is complete."
        progress={72}
        progressLabel="Calculation in progress"
      />
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
        <View style={styles.errorWrap}>
          <FeedbackMessage type="error" title="Calculation failed" message={errorMessage} />
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.85}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.title}>Estimate Summary</Text>
          <Text style={styles.subtitle}>Calculation complete. Review the key result metrics below.</Text>
        </View>

        <FeedbackMessage
          type="success"
          title="Success"
          message="Your estimate has been generated successfully. You can now review the numbers or continue to lead capture."
        />

        <View style={styles.highlightCard}>
          <Text style={styles.metricLabel}>Steel Tonnage</Text>
          <Text style={styles.highlightValue}>{Number(metrics.steelTonnage || 0).toFixed(2)} tons</Text>
          <Text style={styles.metricHint}>Primary result shown prominently for quick review.</Text>
        </View>

        <View style={styles.metricGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Steel Weight</Text>
            <Text style={styles.metricValue}>{Number(metrics.steelWeight || 0).toFixed(2)} kg</Text>
            <Text style={styles.metricHint}>Total steel quantity used for the estimate.</Text>
          </View>

          <View style={styles.metricCardAccent}>
            <Text style={styles.metricLabelAccent}>Column Load</Text>
            <Text style={styles.metricValueAccent}>{Number(metrics.columnLoad || 0).toFixed(2)}</Text>
            <Text style={styles.metricHintAccent}>Estimated load transfer to primary columns.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Inputs</Text>
          <Text style={styles.detail}>Project: {inputs.projectName || '—'}</Text>
          <Text style={styles.detail}>Mode: {inputs.mode || 'steel'}</Text>
          <Text style={styles.detail}>Length: {inputs.length || '—'}</Text>
          <Text style={styles.detail}>Width: {inputs.width || '—'}</Text>
          <Text style={styles.detail}>Height: {inputs.height || '—'}</Text>
          <Text style={styles.detail}>Unit: {inputs.unit || 'ton'}</Text>
        </View>

        <TouchableOpacity style={styles.primaryCta} onPress={handleLead} activeOpacity={0.85} disabled={retrying}>
          {retrying ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryCtaText}>Get Exact Design & Quote</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryCta} onPress={() => navigation.navigate('SavedProjects')} activeOpacity={0.85}>
          <Text style={styles.secondaryCtaText}>Save Project</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { padding: 20, paddingBottom: 32 },
  hero: { marginBottom: 16 },
  title: { color: '#0A2540', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#4B5563', marginTop: 6, fontSize: 14, lineHeight: 20 },
  highlightCard: {
    backgroundColor: '#0A2540',
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#0A2540',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  metricGrid: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  metricCardAccent: {
    backgroundColor: '#FFF7ED',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDBA74',
    marginBottom: 12,
  },
  metricLabel: { color: '#D1D5DB', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  metricLabelAccent: { color: '#9A3412', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  highlightValue: { color: '#FFFFFF', fontSize: 38, fontWeight: '900', letterSpacing: 0.2 },
  metricValue: { color: '#0F172A', fontSize: 22, fontWeight: '800' },
  metricValueAccent: { color: '#9A3412', fontSize: 22, fontWeight: '800' },
  metricHint: { color: '#94A3B8', fontSize: 12, marginTop: 6, lineHeight: 18 },
  metricHintAccent: { color: '#B45309', fontSize: 12, marginTop: 6, lineHeight: 18 },
  section: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  sectionTitle: { color: '#0A2540', fontSize: 17, fontWeight: '800', marginBottom: 10 },
  detail: { color: '#334155', fontSize: 14, marginBottom: 6 },
  primaryCta: {
    marginTop: 22,
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  primaryCtaText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  secondaryCta: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryCtaText: { color: '#0A2540', fontWeight: '800', fontSize: 15 },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F5F7FA',
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: '#0A2540',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default ResultScreen;
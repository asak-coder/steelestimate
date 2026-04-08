const React = require('react');
const { useMemo, useState } = React;
const { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } = require('react-native');
const { saveEstimate } = require('../storage/storageService');
const FeedbackMessage = require('../components/FeedbackMessage');
const FullScreenLoader = require('../components/FullScreenLoader');

function formatNumber(value, fractionDigits = 2) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(fractionDigits) : `0.${'0'.repeat(fractionDigits)}`;
}

function getResults(data) {
  const results = data && data.results ? data.results : data || {};
  return {
    steelWeight: results.steelWeight ?? data?.steelWeight ?? 0,
    steelTonnage: results.steelTonnage ?? data?.steelTonnage ?? 0,
    windLoad: results.windLoad ?? data?.windLoad ?? 0,
    columnLoad: results.columnLoad ?? data?.columnLoad ?? 0,
  };
}

function getFriendlyError(error) {
  const status = error?.status || error?.response?.status;
  const message = String(error?.message || '').toLowerCase();

  if (!error) return 'Something went wrong while calculating the estimate. Please try again.';
  if (message.includes('empty') || message.includes('no data') || message.includes('invalid response')) {
    return 'We received an empty response from the server. Please retry the calculation.';
  }
  if (message.includes('timeout') || status === 408) {
    return 'The calculation request timed out. Please check your connection and try again.';
  }
  if (message.includes('network') || message.includes('offline') || message.includes('fetch')) {
    return 'Network error detected. Please go online and retry the calculation.';
  }
  if (message.includes('invalid') || message.includes('validation')) {
    return 'Some input values are invalid. Please review the project details and try again.';
  }
  if (status >= 500) {
    return 'The server is temporarily unavailable. Please retry after a short while.';
  }
  return error?.message || 'Unable to calculate estimate at this time. Please try again.';
}

function EstimateResultScreen({ navigation, route }) {
  const data = route && route.params ? route.params.data : null;
  const initialError = route?.params?.error || null;
  const initialLoading = Boolean(route?.params?.loading);
  const [saving, setSaving] = useState(false);

  const results = useMemo(() => getResults(data), [data]);
  const assumptions = (data && data.assumptions) || [];
  const warnings = (data && data.warnings) || [];
  const errorMessage = initialError ? getFriendlyError(initialError) : '';
  const hasResults = Number.isFinite(Number(results.steelTonnage)) || Number.isFinite(Number(results.steelWeight));

  const isHighValueLead = Number(results.steelTonnage) > 3;

  const handleLead = async () => {
    setSaving(true);
    try {
      if (data) {
        await saveEstimate({
          ...data,
          results,
          savedAt: new Date().toISOString(),
        });
      }
      navigation.navigate('LeadFormScreen', { data: { ...data, results } });
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = () => {
    if (typeof navigation?.goBack === 'function') {
      navigation.goBack();
      return;
    }
    navigation.navigate('EstimateInputScreen', { retry: true, data });
  };

  if (initialLoading) {
    return (
      <FullScreenLoader
        title="Generating your estimate"
        subtitle="We are calculating the steel tonnage, steel weight, and column load."
        message="This usually takes just a few seconds."
        progress={65}
        progressLabel="Processing project data"
      />
    );
  }

  if (initialError) {
    return (
      <View style={styles.errorContainer}>
        <FeedbackMessage
          type="error"
          title="Calculation failed"
          message={errorMessage}
        />
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.85}>
          <Text style={styles.retryText}>Retry Calculation</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!hasResults) {
    return (
      <View style={styles.errorContainer}>
        <FeedbackMessage
          type="error"
          title="No result found"
          message="We could not read any estimate values from the response. Please retry the calculation."
        />
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.85}>
          <Text style={styles.retryText}>Retry Calculation</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Estimate Result</Text>
        <Text style={styles.subtitle}>Your calculation is complete. Review the key values below.</Text>
      </View>

      <FeedbackMessage
        type="success"
        title="Calculation complete"
        message="The estimate was generated successfully. You can review the summary and continue to lead capture."
      />

      <View style={styles.highlightCard}>
        <Text style={styles.highlightLabel}>Steel Tonnage</Text>
        <Text style={styles.highlightValue}>{formatNumber(results.steelTonnage)} tons</Text>
        <Text style={styles.highlightHint}>Primary result from the current estimate</Text>
      </View>

      <View style={styles.metricGrid}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Steel Weight</Text>
          <Text style={styles.cardValue}>{formatNumber(results.steelWeight)} kg</Text>
          <Text style={styles.cardHint}>Total steel weight used for fabrication planning</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Column Load</Text>
          <Text style={styles.cardValue}>{formatNumber(results.columnLoad)} kN</Text>
          <Text style={styles.cardHint}>Estimated structural load transferred to columns</Text>
        </View>
      </View>

      {Number.isFinite(Number(results.windLoad)) ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional load data</Text>
          <View style={styles.inlineRow}>
            <Text style={styles.detailLabel}>Wind Load</Text>
            <Text style={styles.detailValue}>{formatNumber(results.windLoad)}</Text>
          </View>
        </View>
      ) : null}

      {assumptions.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assumptions</Text>
          {assumptions.map((item, index) => (
            <Text key={`${item}-${index}`} style={styles.listItem}>• {item}</Text>
          ))}
        </View>
      ) : null}

      {warnings.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warnings</Text>
          {warnings.map((item, index) => (
            <Text key={`${item}-${index}`} style={[styles.listItem, styles.warningText]}>• {item}</Text>
          ))}
        </View>
      ) : null}

      <TouchableOpacity style={styles.cta} onPress={handleLead} activeOpacity={0.85} disabled={saving}>
        {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.ctaText}>Get Exact Design & Quote</Text>}
      </TouchableOpacity>

      {isHighValueLead ? (
        <Text style={styles.leadNote}>This project qualifies for detailed design and fabrication support.</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f7fa',
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0A2540',
    marginBottom: 8,
  },
  subtitle: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 20,
  },
  highlightCard: {
    backgroundColor: '#0A2540',
    padding: 22,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#0A2540',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  highlightLabel: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '600',
  },
  highlightValue: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  highlightHint: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 8,
  },
  metricGrid: {
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0A2540',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardLabel: {
    color: '#475569',
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '600',
  },
  cardValue: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '800',
  },
  cardHint: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  section: {
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 18,
    padding: 16,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },
  inlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
  },
  listItem: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  warningText: {
    color: '#b45309',
  },
  cta: {
    marginTop: 20,
    backgroundColor: '#F97316',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  leadNote: {
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    padding: 20,
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: '#0A2540',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  retryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});

module.exports = EstimateResultScreen;
module.exports.default = EstimateResultScreen;
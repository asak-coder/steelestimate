import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';

const ResultScreen = ({ navigation, route, onLogout }) => {
  const projectData = route?.params?.projectData ?? {};
  const leadData = route?.params?.leadData ?? {};
  const resultData = route?.params?.resultData ?? route?.params?.data ?? {};

  const summary = useMemo(() => {
    return resultData?.data ?? resultData ?? {};
  }, [resultData]);

  const cost = summary?.cost ?? {};
  const boq = summary?.boq ?? {};
  const drawingSvg = summary?.drawingSvg ?? summary?.drawing?.svg ?? '';
  const disclaimer = summary?.disclaimer ?? 'This estimate is indicative and subject to detailed engineering review.';

  const optimizedPrice = summary?.optimizedPrice ?? summary?.pricing?.optimizedPrice ?? summary?.pricingOptimization?.optimizedPrice ?? summary?.pricing?.price ?? null;
  const marginPercent = summary?.marginPercent ?? summary?.pricing?.marginPercent ?? summary?.pricingOptimization?.marginPercent ?? summary?.marginSuggestion ?? null;
  const justificationText = summary?.justificationText ?? summary?.pricingJustification ?? summary?.pricing?.justificationText ?? summary?.pricingOptimization?.justificationText ?? '';
  const whyThisPriceIsOptimal = summary?.whyThisPriceIsOptimal ?? summary?.pricingOptimization?.whyThisPriceIsOptimal ?? '';

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
  };

  const handlePdf = () => {
    if (summary?.pdfUrl) {
      Linking.openURL(summary.pdfUrl);
    }
  };

  const handleWhatsApp = () => {
    const phone = leadData?.phone ? leadData.phone.replace(/\D/g, '') : '';
    const message = encodeURIComponent(`Hello ${leadData?.name || 'Customer'}, your PEB estimate is ready.`);
    const url = phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
    Linking.openURL(url);
  };

  const handleCall = () => {
    if (leadData?.phone) {
      Linking.openURL(`tel:${leadData.phone}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.kicker}>Quotation Ready</Text>
        <Text style={styles.title}>Result Overview</Text>
        <Text style={styles.subtitle}>Summary for {leadData?.name || 'the client'} in {leadData?.city || 'your city'}.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Project Summary</Text>
        <View style={styles.card}>
          <Row label="Length" value={formatValue(projectData?.length ?? summary?.length)} />
          <Row label="Width" value={formatValue(projectData?.width ?? summary?.width)} />
          <Row label="Height" value={formatValue(projectData?.height ?? summary?.height)} />
          <Row label="Soil Type" value={formatValue(projectData?.soilType)} />
          <Row label="Design Code" value={formatValue(projectData?.designCode)} />
          <Row label="Unit System" value={formatValue(projectData?.unitSystem)} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing Optimizer</Text>
        <View style={styles.card}>
          <Row label="Optimized Price" value={formatValue(optimizedPrice)} />
          <Row label="Margin %" value={formatValue(marginPercent)} />
          <Row label="Justification" value={formatValue(justificationText)} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why this price is optimal</Text>
        <View style={styles.card}>
          <Text style={styles.paragraph}>{formatValue(whyThisPriceIsOptimal)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Design Output</Text>
        <View style={styles.dualRow}>
          <Metric label="Cost" value={cost?.grandTotal ?? summary?.cost ?? '-'} />
          <Metric label="Steel Weight" value={summary?.steelWeight ?? summary?.steelWeightKg ?? '-'} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Structural Details</Text>
        <View style={styles.card}>
          <Row label="Area" value={formatValue(summary?.area ?? summary?.areaSqm)} />
          <Row label="Lead Score" value={formatValue(summary?.score)} />
          <Row label="Tag" value={formatValue(summary?.tag)} />
          <Row label="Optimized Price" value={formatValue(summary?.optimizedPrice ?? summary?.pricing?.optimizedPrice ?? summary?.pricingOptimization?.optimizedPrice)} />
          <Row label="Margin Suggestion" value={formatValue(summary?.marginSuggestion ?? summary?.marginPercent ?? summary?.pricing?.marginPercent ?? summary?.pricingOptimization?.marginPercent)} />
          <Row label="Pricing Justification" value={formatValue(summary?.pricingJustification ?? summary?.justificationText ?? summary?.pricing?.justificationText ?? summary?.pricingOptimization?.justificationText)} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BOQ Summary</Text>
        <View style={styles.card}>
          <Row label="Total Items" value={String(boq?.items?.length ?? boq?.totalItems ?? '-')} />
          <Row label="Total Weight" value={String(boq?.totalWeight ?? '-')} />
          <Row label="Total Cost" value={String(boq?.totalCost ?? '-')} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Drawing</Text>
        <View style={styles.card}>
          {drawingSvg ? (
            <Text style={styles.svgPlaceholder}>
              SVG drawing received from API. Render with Expo SVG support in the shared wrapper.
            </Text>
          ) : (
            <Text style={styles.emptyState}>No drawing available.</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Disclaimer</Text>
        <View style={styles.card}>
          <Text style={styles.disclaimer}>{disclaimer}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={handlePdf}>
          <Text style={styles.actionText}>Download PDF</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={handleWhatsApp}>
          <Text style={styles.actionText}>Share WhatsApp</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={handleCall}>
          <Text style={styles.actionText}>Call Now</Text>
        </Pressable>
        {onLogout ? (
          <Pressable style={styles.actionButton} onPress={onLogout}>
            <Text style={styles.actionText}>Logout</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.secondaryButtonText}>Back to Home</Text>
      </Pressable>
    </ScrollView>
  );
};

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const Metric = ({ label, value }) => (
  <View style={styles.metric}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{String(value)}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EEF3F8',
    padding: 20,
    paddingBottom: 36
  },
  headerCard: {
    backgroundColor: '#111A2E',
    borderRadius: 24,
    padding: 24,
    marginBottom: 18
  },
  kicker: {
    color: '#81A8DF',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8
  },
  subtitle: {
    color: '#C6D0DF',
    fontSize: 14,
    lineHeight: 20
  },
  section: {
    marginBottom: 16
  },
  sectionTitle: {
    color: '#102033',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D8E1EB'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7'
  },
  rowLabel: {
    color: '#5E6E82',
    fontSize: 13,
    fontWeight: '700'
  },
  rowValue: {
    color: '#102033',
    fontSize: 13,
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12
  },
  dualRow: {
    flexDirection: 'row',
    gap: 12
  },
  metric: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D8E1EB'
  },
  metricLabel: {
    color: '#5E6E82',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8
  },
  metricValue: {
    color: '#102033',
    fontSize: 22,
    fontWeight: '800'
  },
  paragraph: {
    color: '#5E6E82',
    fontSize: 13,
    lineHeight: 20
  },
  svgPlaceholder: {
    color: '#5E6E82',
    fontSize: 13,
    lineHeight: 19
  },
  emptyState: {
    color: '#7A889A',
    fontSize: 13
  },
  disclaimer: {
    color: '#5E6E82',
    fontSize: 13,
    lineHeight: 20
  },
  actions: {
    gap: 10,
    marginTop: 8,
    marginBottom: 16
  },
  actionButton: {
    backgroundColor: '#111A2E',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center'
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8E1EB'
  },
  secondaryButtonText: {
    color: '#102033',
    fontSize: 15,
    fontWeight: '800'
  }
});

export default ResultScreen;
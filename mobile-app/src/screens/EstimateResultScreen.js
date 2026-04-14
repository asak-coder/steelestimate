const React = require('react');
const { View, Text, ScrollView, Pressable, StyleSheet } = require('react-native');
const { DEFAULT_DISCLAIMER, DEFAULT_TONNAGE_THRESHOLD } = require('../services/estimateService');

function Row({ label, value }) {
  return React.createElement(View, style ? null : null);
}

function EstimateResultScreen({ route, navigation }) {
  const result = route && route.params ? route.params.result : null;
  const shouldCaptureLead = route && route.params ? route.params.shouldCaptureLead : false;
  const steel = result && result.steel ? result.steel : {};
  const costBreakdown = result && result.costBreakdown ? result.costBreakdown : {};
  const assumptions = result && result.assumptions ? result.assumptions : [];
  const warnings = result && result.warnings ? result.warnings : [];

  const goToLead = () => {
    navigation.navigate('LeadFormScreen', {
      estimate: result,
    });
  };

  return React.createElement(ScrollView, { style: styles.container, contentContainerStyle: styles.content },
    React.createElement(Text, style: styles.title, 'Estimate result'),
    React.createElement(Text, style: styles.disclaimer, result && result.disclaimer ? result.disclaimer : DEFAULT_DISCLAIMER),
    React.createElement(View, style: styles.card,
      React.createElement(Text, style: styles.cardTitle, 'Steel weight'),
      React.createElement(Text, style: styles.metric, `${steel.weightTons || 0} tons`)
    ),
    React.createElement(View, style: styles.card,
      React.createElement(Text, style: styles.cardTitle, 'Estimated cost'),
      React.createElement(Text, style: styles.metric, `${costBreakdown.totalEstimate || 0}`)
    ),
    warnings.length ? React.createElement(View, style: styles.warningBox,
      React.createElement(Text, style: styles.warningTitle, 'Warnings'),
      warnings.map((warning, index) => React.createElement(Text, { key: `${warning}-${index}`, style: styles.warningText }, warning))
    ) : null,
    assumptions.length ? React.createElement(View, style: styles.card,
      React.createElement(Text, style: styles.cardTitle, 'Assumptions'),
      assumptions.map((assumption, index) => React.createElement(Text, { key: `${assumption}-${index}`, style: styles.assumptionText }, assumption))
    ) : null,
    shouldCaptureLead ? React.createElement(Pressable, { style: styles.button, onPress: goToLead },
      React.createElement(Text, style: styles.buttonText, 'Continue to lead form')
    ) : null,
    React.createElement(Text, style: styles.threshold, `Lead capture threshold: ${DEFAULT_TONNAGE_THRESHOLD} tons`)
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111821' },
  content: { padding: 20, gap: 14 },
  title: { color: '#f5f7fa', fontSize: 26, fontWeight: '700' },
  disclaimer: { color: '#f0c674', fontSize: 13, lineHeight: 18 },
  card: { backgroundColor: '#1a2430', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#304050', gap: 6 },
  cardTitle: { color: '#b9c4cf', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6 },
  metric: { color: '#fff', fontSize: 24, fontWeight: '700' },
  warningBox: { backgroundColor: '#3a2b10', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#f0c674', gap: 6 },
  warningTitle: { color: '#f0c674', fontSize: 14, fontWeight: '700' },
  warningText: { color: '#fff', fontSize: 13, lineHeight: 18 },
  assumptionText: { color: '#d7dde3', fontSize: 13, lineHeight: 18 },
  button: { backgroundColor: '#f0c674', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#101820', fontWeight: '700', fontSize: 16 },
  threshold: { color: '#8996a3', fontSize: 12, textAlign: 'center', marginTop: 6 },
});

module.exports = EstimateResultScreen;
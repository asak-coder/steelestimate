const React = require('react');
const { View, Text, TouchableOpacity, StyleSheet, ScrollView } = require('react-native');
const ScreenContainer = require('../components/ScreenContainer');
const { APP_THEME } = require('../theme/appTheme');

function HomeScreen({ navigation }) {
  return (
    <ScreenContainer style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>Industrial Steel Estimation</Text>
          <Text style={styles.title}>Steel Estimator</Text>
          <Text style={styles.subtitle}>
            Estimate steel, generate leads, and save projects offline with a clean industrial workflow.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('SteelCalculatorScreen')}
            activeOpacity={0.86}
          >
            <Text style={styles.primaryButtonText}>Steel Weight Calculator</Text>
            <Text style={styles.buttonMeta}>Calculate weights, columns, and tonnage</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('PEBEstimatorScreen')}
            activeOpacity={0.86}
          >
            <Text style={styles.secondaryButtonText}>PEB Estimator</Text>
            <Text style={styles.buttonMeta}>Plan industrial buildings and estimates</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostButton}
            onPress={() => navigation.navigate('SavedProjectsScreen')}
            activeOpacity={0.86}
          >
            <Text style={styles.ghostButtonText}>Saved Projects</Text>
            <Text style={styles.buttonMeta}>View offline saved calculations</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoValue}>Offline</Text>
            <Text style={styles.infoLabel}>Save estimates when network is unavailable</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoValue}>Fast</Text>
            <Text style={styles.infoLabel}>Streamlined inputs for site and office use</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: APP_THEME.colors.background,
  },
  content: {
    padding: APP_THEME.spacing.lg,
    paddingBottom: APP_THEME.spacing.xxl,
  },
  heroCard: {
    backgroundColor: APP_THEME.colors.surface,
    borderRadius: APP_THEME.radius.xl,
    padding: APP_THEME.spacing.xl,
    marginBottom: APP_THEME.spacing.lg,
    borderWidth: 1,
    borderColor: APP_THEME.colors.border,
    shadowColor: APP_THEME.colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 5,
  },
  kicker: {
    color: APP_THEME.colors.accent,
    fontSize: APP_THEME.typography.caption,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: APP_THEME.spacing.xs,
  },
  title: {
    fontSize: APP_THEME.typography.title,
    fontWeight: '800',
    color: APP_THEME.colors.primary,
    marginBottom: APP_THEME.spacing.sm,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: APP_THEME.typography.body,
    color: APP_THEME.colors.textMuted,
    lineHeight: 24,
  },
  section: {
    marginBottom: APP_THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: APP_THEME.typography.sectionTitle,
    fontWeight: '800',
    color: APP_THEME.colors.text,
    marginBottom: APP_THEME.spacing.md,
  },
  primaryButton: {
    backgroundColor: APP_THEME.colors.primary,
    borderRadius: APP_THEME.radius.lg,
    paddingVertical: APP_THEME.spacing.lg,
    paddingHorizontal: APP_THEME.spacing.lg,
    marginBottom: APP_THEME.spacing.md,
    borderWidth: 1,
    borderColor: APP_THEME.colors.primary,
    shadowColor: APP_THEME.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: APP_THEME.colors.accent,
    borderRadius: APP_THEME.radius.lg,
    paddingVertical: APP_THEME.spacing.lg,
    paddingHorizontal: APP_THEME.spacing.lg,
    marginBottom: APP_THEME.spacing.md,
    shadowColor: APP_THEME.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  ghostButton: {
    backgroundColor: APP_THEME.colors.surface,
    borderRadius: APP_THEME.radius.lg,
    paddingVertical: APP_THEME.spacing.lg,
    paddingHorizontal: APP_THEME.spacing.lg,
    borderWidth: 1,
    borderColor: APP_THEME.colors.border,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: APP_THEME.spacing.xs,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: APP_THEME.spacing.xs,
  },
  ghostButtonText: {
    color: APP_THEME.colors.primary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: APP_THEME.spacing.xs,
  },
  buttonMeta: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: APP_THEME.typography.caption,
    lineHeight: 18,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: APP_THEME.spacing.md,
  },
  infoCard: {
    flex: 1,
    backgroundColor: APP_THEME.colors.surface,
    borderRadius: APP_THEME.radius.lg,
    padding: APP_THEME.spacing.lg,
    borderWidth: 1,
    borderColor: APP_THEME.colors.border,
  },
  infoValue: {
    color: APP_THEME.colors.primary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: APP_THEME.spacing.xs,
  },
  infoLabel: {
    color: APP_THEME.colors.textMuted,
    fontSize: APP_THEME.typography.caption,
    lineHeight: 18,
  },
});

module.exports = HomeScreen;
module.exports.default = HomeScreen;
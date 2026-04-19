import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Button from '../components/Button';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, isTablet && styles.contentTablet]}>
        <View style={[styles.heroCard, isTablet && styles.heroCardTablet]}>
          <Text style={styles.kicker}>EPC Lead Management</Text>
          <Text style={styles.title}>A K ENGINEERING</Text>
          <Text style={styles.subtitle}>
            Industrial lead tracking, structured estimate capture, and hybrid
            quotation summaries built for fast site workflows.
          </Text>

          <View style={styles.metricRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Fast</Text>
              <Text style={styles.metricValue}>Launch</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Hybrid</Text>
              <Text style={styles.metricValue}>Estimate</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Tablet</Text>
              <Text style={styles.metricValue}>Ready</Text>
            </View>
          </View>

          <View style={styles.buttonGroup}>
            <Button
              title="Create Lead"
              onPress={() => navigation.navigate('LeadForm')}
            />
            <Button
              title="Run Estimate"
              onPress={() => navigation.navigate('Estimate')}
            />
            <Button
              title="View Dashboard"
              onPress={() => navigation.navigate('Dashboard')}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'center',
  },
  contentTablet: {
    paddingHorizontal: theme.spacing.xxxl,
    alignItems: 'center',
  },
  heroCard: {
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
  heroCardTablet: {
    maxWidth: 760,
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
    fontSize: theme.typography.titleXl,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.bodyLg,
    lineHeight: 24,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xxl,
  },
  metricRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xxl,
    flexWrap: 'wrap',
  },
  metricCard: {
    flexGrow: 1,
    minWidth: 96,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricValue: {
    marginTop: theme.spacing.xs,
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: '700',
  },
  buttonGroup: {
    gap: theme.spacing.md,
  },
});

export default HomeScreen;
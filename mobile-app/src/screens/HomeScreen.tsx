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
            Industrial lead tracking, quoting, and dashboard operations built
            for fast site workflows.
          </Text>

          <View style={styles.metricRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Fast</Text>
              <Text style={styles.metricValue}>Launch</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Clean</Text>
              <Text style={styles.metricValue}>UI</Text>
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
    backgroundColor: '#F1F5F9',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  contentTablet: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  heroCard: {
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
  heroCardTablet: {
    maxWidth: 760,
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
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#475569',
    marginBottom: 24,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  metricCard: {
    flexGrow: 1,
    minWidth: 96,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricValue: {
    marginTop: 4,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonGroup: {
    gap: 12,
  },
});

export default HomeScreen;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Button from '../components/Button';
import { getLeads, Lead } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState('');
  const leadStats = useMemo(
    () => ({
      total: leads.length,
      active: leads.length,
      empty: leads.length === 0,
    }),
    [leads],
  );

  const fetchLeads = useCallback(async () => {
    try {
      setErrorText('');
      const data = await getLeads();
      setLeads(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load leads';
      setErrorText(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeads();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, isTablet && styles.headerTablet]}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Operations Board</Text>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>
            Monitor leads, refresh live data, and continue intake.
          </Text>
        </View>

        <View style={styles.headerActions}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Leads</Text>
            <Text style={styles.statValue}>{leadStats.total}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={styles.statValue}>
              {leadStats.empty ? 'Idle' : 'Active'}
            </Text>
          </View>
          <Button
            title="Create Lead"
            onPress={() => navigation.navigate('LeadForm')}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={item => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={[
            leads.length === 0 ? styles.emptyContainer : styles.listContainer,
            isTablet && styles.listContainerTablet,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {errorText ? 'Unable to load leads' : 'No leads found'}
              </Text>
              <Text style={styles.emptyText}>
                {errorText
                  ? errorText
                  : 'New leads will appear here once created.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>Lead</Text>
                </View>
              </View>
              <Text style={styles.cardText}>Phone: {item.phone}</Text>
              <Text style={styles.cardText}>Company: {item.company}</Text>
              <Text style={styles.cardText}>Requirement: {item.requirement}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 16,
  },
  headerTablet: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  headerActions: {
    gap: 10,
    minWidth: 220,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: 20,
    gap: 12,
  },
  listContainerTablet: {
    paddingHorizontal: 32,
    paddingBottom: 28,
  },
  emptyContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    paddingRight: 12,
  },
  pill: {
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
  },
  cardText: {
    color: '#334155',
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default DashboardScreen;

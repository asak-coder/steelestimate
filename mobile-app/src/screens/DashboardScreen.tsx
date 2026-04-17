import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import Button from '../components/Button';
import { getLeads, getLeadDashboard, Lead, LeadStatus } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const STATUS_FILTERS: Array<{ label: string; value: LeadStatus | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'New', value: 'NEW' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [leads, setLeads] = useState<Lead[]>([]);
  const [dashboard, setDashboard] = useState({
    totalLeads: 0,
    statusCounts: { NEW: 0, IN_PROGRESS: 0, COMPLETED: 0, REJECTED: 0 },
    recentLeads: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'ALL'>('ALL');

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await getLeadDashboard();
      setDashboard(data);
    } catch {
      setDashboard(prev => prev);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      setErrorText('');
      const data = await getLeads({
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        search: search.trim() || undefined,
      });
      setLeads(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load leads';
      setErrorText(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedStatus]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (mounted) {
        setLoading(true);
      }
      await Promise.all([fetchDashboard(), fetchLeads()]);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [fetchDashboard, fetchLeads]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchDashboard(), fetchLeads()]);
  }, [fetchDashboard, fetchLeads]);

  const cards = useMemo(
    () => [
      { label: 'Total Leads', value: dashboard.totalLeads },
      { label: 'New', value: dashboard.statusCounts.NEW },
      { label: 'In Progress', value: dashboard.statusCounts.IN_PROGRESS },
      { label: 'Completed', value: dashboard.statusCounts.COMPLETED },
      { label: 'Rejected', value: dashboard.statusCounts.REJECTED },
    ],
    [dashboard],
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={leads}
        keyExtractor={item => item._id}
        numColumns={isTablet ? 2 : 1}
        columnWrapperStyle={isTablet ? styles.columnWrapper : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={[
          leads.length === 0 ? styles.emptyContainer : styles.listContainer,
          isTablet && styles.listContainerTablet,
        ]}
        ListHeaderComponent={
          <View style={[styles.header, isTablet && styles.headerTablet]}>
            <View style={styles.headerCopy}>
              <Text style={styles.kicker}>Operations Board</Text>
              <Text style={styles.title}>Dashboard</Text>
              <Text style={styles.subtitle}>
                Monitor leads, search by name or company, and continue intake.
              </Text>
            </View>

            <View style={styles.headerActions}>
              <Button title="Create Lead" onPress={() => navigation.navigate('LeadForm')} />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{errorText ? 'Unable to load leads' : 'No leads found'}</Text>
              <Text style={styles.emptyText}>
                {errorText ? errorText : 'New leads will appear here once created.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable style={[styles.card, isTablet && styles.cardTablet]} onPress={() => navigation.navigate('EditLead', { leadId: item._id, lead: item })}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.clientName || item.name || 'Unnamed Lead'}</Text>
                <Text style={styles.cardText}>Company: {item.company || '—'}</Text>
              </View>
              <View style={[styles.statusBadge, getStatusStyle(normalizeStatus(item.status))]}>
                <Text style={styles.statusBadgeText}>{normalizeStatus(item.status)}</Text>
              </View>
            </View>
            <Text style={styles.cardText}>Phone: {item.phone || '—'}</Text>
            <Text style={styles.cardText}>Requirement: {item.requirement || '—'}</Text>
            <View style={styles.cardActions}>
              <Button title="Edit" onPress={() => navigation.navigate('EditLead', { leadId: item._id, lead: item })} />
            </View>
          </Pressable>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <View style={[styles.statsGrid, isTablet && styles.statsGridTablet]}>
              {cards.map(card => (
                <View key={card.label} style={styles.statCard}>
                  <Text style={styles.statLabel}>{card.label}</Text>
                  <Text style={styles.statValue}>{card.value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.searchSection}>
              <Text style={styles.sectionTitle}>Search</Text>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name or company"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.searchInput}
                returnKeyType="search"
                onSubmitEditing={fetchLeads}
              />
            </View>

            <View style={styles.searchSection}>
              <Text style={styles.sectionTitle}>Filter by Status</Text>
              <View style={styles.filterRow}>
                {STATUS_FILTERS.map(filter => {
                  const active = selectedStatus === filter.value;
                  return (
                    <Pressable
                      key={filter.value}
                      onPress={() => setSelectedStatus(filter.value)}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                    >
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {filter.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
};

function normalizeStatus(status?: string | null): LeadStatus {
  const value = String(status || 'NEW').toUpperCase();
  if (value === 'IN_PROGRESS' || value === 'COMPLETED' || value === 'REJECTED') {
    return value;
  }
  return 'NEW';
}

function getStatusStyle(status: LeadStatus) {
  switch (status) {
    case 'NEW':
      return styles.statusNew;
    case 'IN_PROGRESS':
      return styles.statusInProgress;
    case 'COMPLETED':
      return styles.statusCompleted;
    case 'REJECTED':
      return styles.statusRejected;
    default:
      return styles.statusNew;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 16,
    paddingBottom: 12,
    gap: theme.spacing.md,
  },
  headerTablet: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xxxl,
    paddingTop: 24,
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    color: theme.colors.primary,
    fontSize: theme.typography.kicker,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.titleMd,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  headerActions: {
    minWidth: 220,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  statsGridTablet: {
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 150,
    flexGrow: 1,
    flexBasis: '48%',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statValue: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.bodyLg,
    fontWeight: '800',
    color: theme.colors.text,
  },
  searchSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    fontSize: 12,
  },
  filterChipTextActive: {
    color: theme.colors.white,
  },
  loader: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  listContainerTablet: {
    paddingHorizontal: theme.spacing.xxxl,
    paddingBottom: 28,
  },
  columnWrapper: {
    gap: theme.spacing.md,
  },
  emptyContainer: {
    flexGrow: 1,
    padding: theme.spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.titleSm,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.bodyLg,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 3,
    marginBottom: theme.spacing.md,
    flex: 1,
  },
  cardTablet: {
    flexBasis: '48%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.typography.titleSm,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
  },
  cardText: {
    color: theme.colors.textSecondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  cardActions: {
    marginTop: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  footer: {
    marginTop: theme.spacing.md,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statusNew: {
    backgroundColor: '#2563EB',
  },
  statusInProgress: {
    backgroundColor: '#F59E0B',
  },
  statusCompleted: {
    backgroundColor: '#16A34A',
  },
  statusRejected: {
    backgroundColor: '#DC2626',
  },
});

export default DashboardScreen;
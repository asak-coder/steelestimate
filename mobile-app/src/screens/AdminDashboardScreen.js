import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import apiClient from '../utils/apiClient';
import authClient from '../utils/authClient';
import authToken from '../utils/authToken';

const STATUS_OPTIONS = ['new', 'contacted', 'converted'];

const getLeadId = (lead) => lead?.id || lead?._id || lead?.leadId || '';
const getLeadName = (lead) => lead?.clientName || lead?.name || 'Unnamed lead';
const getLeadCity = (lead) => lead?.projectData?.city || lead?.city || '-';
const getLeadProjectSize = (lead) => {
  const value =
    lead?.projectData?.projectSize ||
    lead?.projectData?.size ||
    lead?.projectData?.builtUpArea ||
    lead?.projectSize ||
    lead?.size;
  return value ? String(value) : '-';
};
const getLeadPhone = (lead) => lead?.phone || lead?.mobile || lead?.contactNumber || '';
const getLeadStatus = (lead) => (lead?.status || 'new').toLowerCase();

const AdminDashboardScreen = ({ navigation, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leads, setLeads] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadLeads = useCallback(async () => {
    try {
      const me = await authClient.me();
      const role = me?.user?.role || me?.role;
      if (role !== 'admin') {
        await authToken.clear();
        setIsAdmin(false);
        Alert.alert('Access denied', 'Admin access is required.');
        if (onLogout) {
          onLogout();
        } else if (navigation?.navigate) {
          navigation.navigate('Login');
        }
        return;
      }

      setIsAdmin(true);
      const response = await apiClient.get('/api/leads');
      const data = response?.data;
      const items = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setLeads(items);
    } catch (error) {
      if (error?.response?.status === 401) {
        await authToken.clear();
        if (onLogout) {
          onLogout();
        } else if (navigation?.navigate) {
          navigation.navigate('Login');
        }
        return;
      }
      Alert.alert('Failed to load leads', error?.response?.data?.message || 'Unable to fetch leads.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation, onLogout]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLeads();
  };

  const updateStatus = async (lead, nextStatus) => {
    const id = getLeadId(lead);
    if (!id) return;

    try {
      setBusyId(id);
      const response = await apiClient.patch(`/api/leads/${id}`, { status: nextStatus });
      const updatedLead = response?.data?.data || response?.data || lead;
      setLeads((current) =>
        current.map((item) => (getLeadId(item) === id ? { ...item, ...updatedLead, status: nextStatus } : item))
      );
    } catch (error) {
      Alert.alert('Update failed', error?.response?.data?.message || 'Unable to update lead status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCall = async (lead) => {
    const phone = getLeadPhone(lead);
    if (!phone) {
      Alert.alert('No phone number', 'This lead does not have a phone number.');
      return;
    }

    const url = `tel:${phone}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Unsupported action', 'Calling is not supported on this device.');
      return;
    }

    Linking.openURL(url);
  };

  const renderStatusButtons = (lead) => {
    const currentStatus = getLeadStatus(lead);
    const id = getLeadId(lead);

    return (
      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map((status) => {
          const selected = currentStatus === status;
          const disabled = busyId === id || selected;
          return (
            <TouchableOpacity
              key={status}
              style={[styles.statusChip, selected && styles.statusChipActive, disabled && styles.statusChipDisabled]}
              onPress={() => updateStatus(lead, status)}
              disabled={disabled}
            >
              <Text style={[styles.statusChipText, selected && styles.statusChipTextActive]}>{status}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderLead = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={[styles.cell, styles.nameCell]} numberOfLines={1}>
          {getLeadName(item)}
        </Text>
        <Text style={styles.cell}>{getLeadCity(item)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.cell}>{getLeadProjectSize(item)}</Text>
        <Text style={[styles.cell, styles.statusText]}>{getLeadStatus(item)}</Text>
      </View>

      {renderStatusButtons(item)}

      <TouchableOpacity style={styles.callButton} onPress={() => handleCall(item)}>
        <Text style={styles.callButtonText}>Call</Text>
      </TouchableOpacity>
    </View>
  );

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage leads and update status quickly</Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.nameCell]}>Name</Text>
          <Text style={styles.tableHeaderText}>City</Text>
          <Text style={styles.tableHeaderText}>Project size</Text>
          <Text style={styles.tableHeaderText}>Status</Text>
        </View>
      </View>
    ),
    []
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#0f62fe" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={leads}
        keyExtractor={(item, index) => String(getLeadId(item) || index)}
        ListHeaderComponent={header}
        renderItem={renderLead}
        contentContainerStyle={leads.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0f62fe" />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No leads found</Text>
            <Text style={styles.emptyText}>Pull down to refresh when new leads arrive.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fb' },
  loadingText: { marginTop: 12, color: '#4b5563' },
  listContent: { padding: 16, paddingBottom: 32 },
  emptyContainer: { flexGrow: 1, padding: 16, paddingBottom: 32 },
  header: { marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { marginTop: 6, fontSize: 14, color: '#6b7280' },
  tableHeader: {
    flexDirection: 'row',
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#e8eef8',
  },
  tableHeaderText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#374151', textTransform: 'uppercase' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  row: { flexDirection: 'row', marginBottom: 10 },
  cell: { flex: 1, color: '#111827', fontSize: 14, paddingRight: 8 },
  nameCell: { flex: 1.2, fontWeight: '700' },
  statusText: { textTransform: 'capitalize', fontWeight: '700' },
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  statusChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
  },
  statusChipActive: { backgroundColor: '#0f62fe' },
  statusChipDisabled: { opacity: 0.7 },
  statusChipText: { color: '#1f2937', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  statusChipTextActive: { color: '#fff' },
  callButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  callButtonText: { color: '#fff', fontWeight: '700' },
  emptyState: { marginTop: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptyText: { marginTop: 6, color: '#6b7280', textAlign: 'center' },
});

export default AdminDashboardScreen;

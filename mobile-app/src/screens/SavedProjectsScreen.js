const React = require('react');
const { useEffect, useState } = React;
const { View, Text, ScrollView, Pressable, StyleSheet } = require('react-native');
const { getCachedEstimates, getCachedLeads, syncOfflineQueue } = require('../services/estimateService');

function SavedProjectsScreen({ navigation }) {
  const [estimates, setEstimates] = useState([]);
  const [leads, setLeads] = useState([]);

  const load = async () => {
    const savedEstimates = await getCachedEstimates();
    const savedLeads = await getCachedLeads();
    setEstimates(savedEstimates);
    setLeads(savedLeads);
  };

  useEffect(() => {
    load();
  }, []);

  const onSync = async () => {
    await syncOfflineQueue();
    await load();
  };

  return React.createElement(ScrollView, { style: styles.container, contentContainerStyle: styles.content },
    React.createElement(Text, style: styles.title, 'Saved projects'),
    React.createElement(Pressable, style: styles.button, onPress: onSync },
      React.createElement(Text, style: styles.buttonText, 'Sync offline items')
    ),
    React.createElement(Text, style: styles.sectionTitle, 'Estimates'),
    estimates.map(item => React.createElement(View, { key: item.id || item.payload && item.payload.projectName, style: styles.card },
      React.createElement(Text, style: styles.cardTitle, item.payload && item.payload.projectName ? item.payload.projectName : 'Saved estimate'),
      React.createElement(Text, style: styles.cardText, item.synced ? 'Synced' : 'Pending sync')
    )),
    React.createElement(Text, style: styles.sectionTitle, 'Leads'),
    leads.map(item => React.createElement(View, { key: item.id || item.payload && item.payload.email, style: styles.card },
      React.createElement(Text, style: styles.cardTitle, item.payload && item.payload.name ? item.payload.name : 'Saved lead'),
      React.createElement(Text, style: styles.cardText, item.synced ? 'Synced' : 'Pending sync')
    ))
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111821' },
  content: { padding: 20, gap: 14 },
  title: { color: '#fff', fontSize: 26, fontWeight: '700' },
  sectionTitle: { color: '#b9c4cf', fontSize: 14, fontWeight: '700', marginTop: 8 },
  card: { backgroundColor: '#1a2430', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#304050', gap: 4 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cardText: { color: '#c3cbd4', fontSize: 13 },
  button: { backgroundColor: '#f0c674', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#101820', fontWeight: '700', fontSize: 16 },
});

module.exports = SavedProjectsScreen;
const React = require('react');
const { useCallback, useState } = React;
const { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } = require('react-native');
const { loadSavedEstimates } = require('../storage/storageService');

function SavedProjectsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const saved = await loadSavedEstimates();
      setItems(Array.isArray(saved) ? saved : []);
    } catch (err) {
      Alert.alert('Error', err && err.message ? err.message : 'Failed to load saved projects');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadItems();
  }, [loadItems]);

  const openItem = (item) => {
    navigation.navigate('EstimateResultScreen', { data: item });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Saved Projects</Text>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>No saved estimates found.</Text>
      ) : (
        items.map((item, index) => (
          <TouchableOpacity
            key={item.id || item.savedAt || index}
            style={styles.card}
            onPress={() => openItem(item)}
            activeOpacity={0.85}
          >
            <Text style={styles.cardTitle}>Project {index + 1}</Text>
            <Text style={styles.cardMeta}>Tonnage: {Number(item?.results?.steelTonnage ?? item?.steelTonnage ?? 0).toFixed(2)} tons</Text>
            <Text style={styles.cardMeta}>Saved: {item.savedAt ? new Date(item.savedAt).toLocaleString() : 'Recently'}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  emptyText: {
    color: '#475569',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardMeta: {
    color: '#475569',
    fontSize: 14,
    marginTop: 3,
  },
});

module.exports = SavedProjectsScreen;
module.exports.default = SavedProjectsScreen;

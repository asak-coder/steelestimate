import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LeadQuoteModal from '../components/LeadQuoteModal';

const LeadCaptureScreen = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const openLeadForm = () => {
    setModalVisible(false);
    navigation.navigate('LeadForm');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Need a detailed design & fabrication quote?</Text>
      <TouchableOpacity style={styles.primaryButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.primaryText}>Get Quote</Text>
      </TouchableOpacity>

      <LeadQuoteModal
        visible={modalVisible}
        onNo={() => setModalVisible(false)}
        onYes={openLeadForm}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F5F7FA',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 18,
  },
  primaryButton: {
    backgroundColor: '#0A2540',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default LeadCaptureScreen;
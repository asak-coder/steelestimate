import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const LeadQuoteModal = ({ visible, onYes, onNo }) => {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onNo}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Need detailed design & fabrication quote?</Text>
          <Text style={styles.body}>Tap Yes to continue to the lead form or No to stay on the current screen.</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onNo}>
              <Text style={styles.secondaryText}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={onYes}>
              <Text style={styles.primaryText}>Yes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31, 41, 55, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#0A2540',
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: '#1F2937',
    marginBottom: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    minWidth: 96,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  secondaryButton: {
    backgroundColor: '#E5E7EB',
  },
  primaryButton: {
    backgroundColor: '#F97316',
  },
  secondaryText: {
    color: '#1F2937',
    fontWeight: '700',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default LeadQuoteModal;
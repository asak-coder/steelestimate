import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';

const HomeScreen = ({ navigation, onLogout }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Industrial estimation platform</Text>
        <Text style={styles.title}>Fast PEB quotes with engineering-backed outputs</Text>
        <Text style={styles.description}>
          Enter project dimensions, capture lead details, and generate a structured estimate with BOQ, steel metrics, and drawing preview.
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Design codes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Unified flow</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>PDF</Text>
            <Text style={styles.statLabel}>Quotation export</Text>
          </View>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('EstimateInput')}>
          <Text style={styles.primaryButtonText}>Start Estimate</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('AdminDashboard')}>
          <Text style={styles.secondaryButtonText}>Admin Dashboard</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onLogout}>
          <Text style={styles.secondaryButtonText}>Logout</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What you get</Text>
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Project Summary</Text>
          <Text style={styles.featureText}>Area, steel weight, and a concise project overview.</Text>
        </View>
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Design Output</Text>
          <Text style={styles.featureText}>Cost, optimized pricing, and engineering notes.</Text>
        </View>
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>BOQ & Drawing</Text>
          <Text style={styles.featureText}>Bill of quantities and SVG drawing preview.</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EEF3F8',
    padding: 20,
    paddingBottom: 32
  },
  hero: {
    backgroundColor: '#111A2E',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20
  },
  kicker: {
    color: '#81A8DF',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
    marginBottom: 12
  },
  description: {
    color: '#C6D0DF',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22
  },
  statCard: {
    flex: 1,
    backgroundColor: '#18233A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center'
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4
  },
  statLabel: {
    color: '#AEBBD0',
    fontSize: 12
  },
  primaryButton: {
    backgroundColor: '#4DA3FF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16
  },
  secondaryButton: {
    backgroundColor: '#18233A',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16
  },
  section: {
    gap: 12
  },
  sectionTitle: {
    color: '#1B2A41',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D8E1EB'
  },
  featureTitle: {
    color: '#122033',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6
  },
  featureText: {
    color: '#5D6C80',
    fontSize: 14,
    lineHeight: 20
  }
});

export default HomeScreen;

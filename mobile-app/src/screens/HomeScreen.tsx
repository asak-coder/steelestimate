import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>A K ENGINEERING</Text>
        <Text style={styles.subtitle}>
          Lead generation and EPC service platform
        </Text>

        <View style={styles.buttonGroup}>
          <Button
            title="Create Lead"
            onPress={() => navigation.navigate('LeadForm')}
          />
          <View style={styles.spacer} />
          <Button
            title="View Dashboard"
            onPress={() => navigation.navigate('Dashboard')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonGroup: {
    gap: 12,
  },
  spacer: {
    height: 4,
  },
});

export default HomeScreen;

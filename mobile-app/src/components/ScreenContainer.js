import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

const ScreenContainer = ({ children, style }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, style]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    padding: 16,
  },
});

export default ScreenContainer;
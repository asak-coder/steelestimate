import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';

const FullScreenLoader = ({ title = 'Calculating estimate...', subtitle = 'Please wait while we prepare your results.', progressLabel, progress = 0, message }) => {
  const spin = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} />
        <ActivityIndicator size="small" color="#F97316" style={styles.activity} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, progress))}%` }]} />
        </View>
        {progressLabel ? <Text style={styles.progressLabel}>{progressLabel}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    shadowColor: '#0A2540',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  spinner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 8,
    borderColor: '#E2E8F0',
    borderTopColor: '#F97316',
    marginBottom: 14,
  },
  activity: {
    marginBottom: 14,
  },
  title: {
    color: '#0A2540',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },
  message: {
    color: '#1F2937',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 18,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F97316',
  },
  progressLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});

export default FullScreenLoader;
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const STEPS = ['Analyzing structure...', 'Calculating loads...', 'Optimizing design...', 'Generating drawing...'];

const LoadingScreen = ({ navigation, route }) => {
  const projectData = route?.params?.projectData ?? {};
  const leadData = route?.params?.leadData ?? {};
  const [stepIndex, setStepIndex] = useState(0);
  const spin = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true
      })
    );
    animation.start();

    const interval = setInterval(() => {
      setStepIndex((prev) => {
        const next = prev + 1;
        if (next >= STEPS.length) {
          clearInterval(interval);
          navigation.replace('Result', {
            projectData,
            leadData,
            resultData: route?.params?.resultData ?? null
          });
          return prev;
        }
        return next;
      });
    }, 1100);

    return () => {
      animation.stop();
      clearInterval(interval);
    };
  }, [navigation, projectData, leadData, route?.params?.resultData, spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} />
        <Text style={styles.title}>{STEPS[stepIndex]}</Text>
        <Text style={styles.subtitle}>Please wait while the analysis pipeline prepares your estimate.</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((stepIndex + 1) / STEPS.length) * 100}%` }]} />
        </View>
        <Text style={styles.stepCounter}>
          Step {stepIndex + 1} of {STEPS.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#111A2E',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: '#24324A',
    alignItems: 'center'
  },
  spinner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 8,
    borderColor: '#2A3A56',
    borderTopColor: '#4DA3FF',
    marginBottom: 20
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    color: '#B7C4D9',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: '#1A2740',
    overflow: 'hidden',
    marginBottom: 10
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4DA3FF'
  },
  stepCounter: {
    color: '#7F93B0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8
  }
});

export default LoadingScreen;
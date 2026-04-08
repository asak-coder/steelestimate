import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import FullScreenLoader from '../components/FullScreenLoader';

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
      <FullScreenLoader
        title={STEPS[stepIndex]}
        subtitle="Please wait while the analysis pipeline prepares your estimate."
        message="The estimate is being generated in the background."
        progress={((stepIndex + 1) / STEPS.length) * 100}
        progressLabel={`Step ${stepIndex + 1} of ${STEPS.length}`}
      />
      <Animated.View style={[styles.hiddenSpinner, { transform: [{ rotate }] }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220'
  },
  hiddenSpinner: {
    position: 'absolute',
    opacity: 0
  }
});

export default LoadingScreen;
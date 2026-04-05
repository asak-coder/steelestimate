import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const pulse = new Animated.Value(0.7);
  const shimmer = new Animated.Value(0);

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.7, duration: 900, useNativeDriver: true })
      ])
    );

    const shimmerLoop = Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 1800, useNativeDriver: true })
    );

    pulseLoop.start();
    shimmerLoop.start();

    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 1800);

    return () => {
      pulseLoop.stop();
      shimmerLoop.stop();
      clearTimeout(timer);
    };
  }, [navigation, pulse, shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width]
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Animated.View style={[styles.accentBar, { transform: [{ scaleX: pulse }] }]} />
        <Text style={styles.brand}>TEKLA AI</Text>
        <Text style={styles.title}>PEB Estimation</Text>
        <Text style={styles.subtitle}>Industrial design intelligence for faster project quoting</Text>
        <View style={styles.loaderTrack}>
          <Animated.View style={[styles.loaderGlow, { transform: [{ translateX }] }]} />
        </View>
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
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8
  },
  accentBar: {
    width: 64,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#4DA3FF',
    marginBottom: 18
  },
  brand: {
    color: '#8FB8FF',
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 8
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 10
  },
  subtitle: {
    color: '#B7C4D9',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28
  },
  loaderTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#1A2740',
    overflow: 'hidden'
  },
  loaderGlow: {
    width: '40%',
    height: '100%',
    backgroundColor: '#4DA3FF',
    opacity: 0.8
  }
});

export default SplashScreen;
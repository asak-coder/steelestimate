import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SplashScreen,
  HomeScreen,
  CalculatorSelectionScreen,
  SteelWeightCalculatorScreen,
  PEBEstimatorScreen,
  EstimateSummaryScreen,
  LeadCaptureScreen,
  SavedProjectsScreen,
  SettingsScreen,
} from './screens';
import { RootStackRoutes } from './navigation/types';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={RootStackRoutes.Splash}>
        <Stack.Screen name={RootStackRoutes.Splash} component={SplashScreen} />
        <Stack.Screen name={RootStackRoutes.HomeDashboard} component={HomeScreen} />
        <Stack.Screen name={RootStackRoutes.CalculatorSelection} component={CalculatorSelectionScreen} />
        <Stack.Screen name={RootStackRoutes.SteelWeightCalculator} component={SteelWeightCalculatorScreen} />
        <Stack.Screen name={RootStackRoutes.PEBEstimator} component={PEBEstimatorScreen} />
        <Stack.Screen name={RootStackRoutes.EstimateSummary} component={EstimateSummaryScreen} />
        <Stack.Screen name={RootStackRoutes.LeadCapture} component={LeadCaptureScreen} />
        <Stack.Screen name={RootStackRoutes.SavedProjects} component={SavedProjectsScreen} />
        <Stack.Screen name={RootStackRoutes.Settings} component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
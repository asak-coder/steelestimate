import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import LeadCaptureScreen from '../screens/LeadCaptureScreen';
import LeadFormScreen from '../screens/LeadFormScreen';
import LeadQuoteModal from '../components/LeadQuoteModal';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="LeadCapture" component={LeadCaptureScreen} />
        <Stack.Screen name="LeadForm" component={LeadFormScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import LeadFormScreen from '../screens/LeadFormScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EditLeadScreen from '../screens/EditLeadScreen';
import EstimateScreen from '../screens/EstimateScreen';
import { theme } from '../theme/theme';
import { Lead } from '../services/api';

export type RootStackParamList = {
  Home: undefined;
  LeadForm: undefined;
  Estimate: undefined;
  Dashboard: undefined;
  EditLead: { leadId: string; lead?: Lead };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.text },
        headerTintColor: theme.colors.surface,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="LeadForm"
        component={LeadFormScreen}
        options={{ title: 'Create Lead' }}
      />
      <Stack.Screen
        name="Estimate"
        component={EstimateScreen}
        options={{ title: 'Estimate' }}
      />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen
        name="EditLead"
        component={EditLeadScreen}
        options={{ title: 'Edit Lead' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
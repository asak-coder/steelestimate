const React = require('react');
const { NavigationContainer, DefaultTheme } = require('@react-navigation/native');
const { createNativeStackNavigator } = require('@react-navigation/native-stack');
const { createBottomTabNavigator } = require('@react-navigation/bottom-tabs');
const HomeScreen = require('../screens/HomeScreen');
const SteelCalculatorScreen = require('../screens/SteelCalculatorScreen');
const PEBEstimatorScreen = require('../screens/PEBEstimatorScreen');
const EstimateResultScreen = require('../screens/EstimateResultScreen');
const LeadFormScreen = require('../screens/LeadFormScreen');
const SavedProjectsScreen = require('../screens/SavedProjectsScreen');
const { APP_THEME } = require('../theme/appTheme');
const { ROUTES, TABS } = require('../constants/appConstants');

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: APP_THEME.colors.background,
    card: APP_THEME.colors.surface,
    text: APP_THEME.colors.text,
    border: APP_THEME.colors.border,
    primary: APP_THEME.colors.primary,
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: APP_THEME.colors.surface,
          borderTopColor: APP_THEME.colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: APP_THEME.colors.primary,
        tabBarInactiveTintColor: APP_THEME.colors.textMuted,
      }}
    >
      <Tab.Screen name={TABS.HOME} component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name={TABS.CALCULATOR} component={SteelCalculatorScreen} options={{ title: 'Steel' }} />
      <Tab.Screen name={TABS.ESTIMATES} component={PEBEstimatorScreen} options={{ title: 'PEB' }} />
      <Tab.Screen name={TABS.SAVED} component={SavedProjectsScreen} options={{ title: 'Saved' }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name={ROUTES.ROOT} component={MainTabs} />
        <RootStack.Screen name={ROUTES.RESULT} component={EstimateResultScreen} />
        <RootStack.Screen name={ROUTES.LEAD_FORM} component={LeadFormScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

module.exports = RootNavigator;
module.exports.default = RootNavigator;
module.exports.navTheme = navTheme;
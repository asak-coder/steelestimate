import React, { useEffect, useMemo, useState } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import EstimateInputScreen from './src/screens/EstimateInputScreen';
import LeadCaptureScreen from './src/screens/LeadCaptureScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import ResultScreen from './src/screens/ResultScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import authClient from './src/utils/authClient';
import authToken from './src/utils/authToken';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  EstimateInput: undefined;
  LeadCapture: { projectData: any };
  Loading: { projectData: any; leadData: any };
  Result: { result: any; projectData: any; leadData: any; resultData?: any };
  AdminDashboard: undefined;
};

type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const navigationRef = useNavigationContainerRef();
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const token = await authToken.get();
      if (!token) {
        setReady(true);
        return;
      }

      try {
        await authClient.me();
        setIsAuthenticated(true);
      } catch (error) {
        await authToken.clear();
        setIsAuthenticated(false);
      } finally {
        setReady(true);
      }
    };

    bootstrap();
  }, []);

  const handleAuthenticated = async () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await authToken.clear();
    setIsAuthenticated(false);
    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  const initialRouteName = useMemo(() => {
    if (!ready) {
      return 'Splash';
    }
    return isAuthenticated ? 'Home' : 'Login';
  }, [ready, isAuthenticated]);

  if (!ready) {
    return (
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
          <Stack.Screen name="Splash" component={SplashScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login">
              {(props: ScreenProps<'Login'>) => <LoginScreen {...props} onAuthenticated={handleAuthenticated} />}
            </Stack.Screen>
            <Stack.Screen name="Signup">
              {(props: ScreenProps<'Signup'>) => <SignupScreen {...props} onAuthenticated={handleAuthenticated} />}
            </Stack.Screen>
          </>
        ) : null}

        {isAuthenticated ? (
          <>
            <Stack.Screen name="Home">
              {(props: ScreenProps<'Home'>) => <HomeScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen name="EstimateInput">
              {(props: ScreenProps<'EstimateInput'>) => <EstimateInputScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen name="LeadCapture">
              {(props: ScreenProps<'LeadCapture'>) => <LeadCaptureScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen name="Loading">
              {(props: ScreenProps<'Loading'>) => <LoadingScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen name="Result">
              {(props: ScreenProps<'Result'>) => <ResultScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen name="AdminDashboard">
              {(props: ScreenProps<'AdminDashboard'>) => <AdminDashboardScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
          </>
        ) : null}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

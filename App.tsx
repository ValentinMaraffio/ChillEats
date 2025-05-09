import 'react-native-gesture-handler'; // 👈 Importalo arriba del todo, antes que nada
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types/navigation';
import MainScreen from './screens/main';
import LoginScreen from './screens/login';
import RegisterScreen from './screens/register';
import FavoritesScreen from './screens/favorites';
import VerificationScreen from './screens/verification';
import ProfileScreen from './screens/profile';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './context/authContext';


const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <AuthProvider>
          <Stack.Navigator initialRouteName="Main" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main" component={MainScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} />
            <Stack.Screen name="Verification" component={VerificationScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </Stack.Navigator>
        </AuthProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
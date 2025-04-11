import 'react-native-gesture-handler'; // 👈 Importalo arriba del todo, antes que nada
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainScreen from './screens/main';
import LoginScreen from './screens/login';
import RegisterScreen from './screens/register';
import FavoritesScreen from './screens/favorites';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Favorites: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Register" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Favorites" component={FavoritesScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

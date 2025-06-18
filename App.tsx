"use client"

import "react-native-gesture-handler"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"
import type { RootStackParamList, TabParamList } from "./types/navigation"
import MainScreen from "./screens/Main/mainScreen"
import LoginScreen from "./screens/Login/loginScreen"
import RegisterScreen from "./screens/Register/registerScreen"
import FavoritesScreen from "./screens/Favorites/favoritesScreen"
import VerificationScreen from "./screens/Verification/verificationScreen"
import ProfileScreen from "./screens/Profile/profileScreen"
import WelcomeScreen from "./screens/Welcome/welcomeScreen"
import ForgotPasswordScreen from "./screens/ForgotPassword/ForgotPasswordScreen"
import ResetPasswordScreen from "./screens/ResetPassword/ResetPasswordScreen"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { AuthProvider, useAuth } from "./context/authContext"
import { FavoritesProvider } from "./context/favoritesContext"
import { useKeyboardVisibility } from "./hooks/useKeyboardVisibility"

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

function UserTabScreen() {
  const { user } = useAuth()
  return user ? <ProfileScreen /> : <WelcomeScreen />
}

function MainTabs() {
  const isKeyboardVisible = useKeyboardVisibility()

  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: { name: keyof TabParamList } }) => ({
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Favorites") {
            iconName = focused ? "heart" : "heart-outline"
          } else if (route.name === "User") {
            iconName = focused ? "person" : "person-outline"
          } else {
            iconName = "home-outline"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#FF6B35",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1a1a1a",
          borderTopColor: "#333",
          height: 60,
          paddingTop: 4,
          // Ocultar cuando aparece el teclado
          display: isKeyboardVisible ? "none" : "flex",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      })}
    >
      <Tab.Screen name="Home" component={MainScreen} options={{ tabBarLabel: "Inicio" }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ tabBarLabel: "Favoritos" }} />
      <Tab.Screen name="User" component={UserTabScreen} options={{ tabBarLabel: "Usuario" }} />
    </Tab.Navigator>
  )
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <AuthProvider>
          <FavoritesProvider>
            <Stack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false }}>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="Verification" component={VerificationScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
            </Stack.Navigator>
          </FavoritesProvider>
        </AuthProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  )
}

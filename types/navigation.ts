export type RootStackParamList = {
  MainTabs: {screen?: keyof TabParamList}
  Login: undefined
  Register: undefined
  Verification: { email: string }
  Profile: {
    name: string
    email: string
  }
  ForgotPassword: undefined
  ResetPassword: { email: string }
  Welcome: undefined
}

export type TabParamList = {
  Map: undefined
  Home: undefined
  Favorites: undefined
  User: undefined
}

// Tipos de navegación para usar en los componentes
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>
export type TabNavigationProp = BottomTabNavigationProp<TabParamList>

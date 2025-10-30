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
import { useEffect, useState } from "react"
import { View, Text, Pressable, Platform, type LayoutChangeEvent, StyleSheet } from "react-native"
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from "react-native-reanimated"
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs"
import { FiltersProvider } from "./context/filtersContext"

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

function UserTabScreen() {
  const { user } = useAuth()
  return user ? <ProfileScreen /> : <WelcomeScreen />
}

// --- ÍTEM INDIVIDUAL (animación suave al enfocarse; sin feedback de "pressed") ---
function TabItem({
  label,
  iconName,
  isFocused,
  onPress,
  onLayout,
  iconActiveColor,
  iconInactiveColor,
  textActiveColor,
  textInactiveColor,
}: {
  label: string
  iconName: keyof typeof Ionicons.glyphMap
  isFocused: boolean
  onPress: () => void
  onLayout: (e: LayoutChangeEvent) => void
  iconActiveColor: string
  iconInactiveColor: string
  textActiveColor: string
  textInactiveColor: string
}) {
  const s = useSharedValue(isFocused ? 1 : 0)
  useEffect(() => {
    s.value = withTiming(isFocused ? 1 : 0, { duration: 200, easing: Easing.out(Easing.cubic) })
  }, [isFocused])

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: 0.98 + s.value * 0.04 }], // 0.98 → 1.02
    opacity: 0.9 + s.value * 0.1, // 0.9 → 1
  }))

  return (
    <Pressable onPress={onPress} onLayout={onLayout} style={styles.item}>
      <Animated.View style={[styles.itemInner, anim]}>
        <Ionicons
          name={iconName}
          size={isFocused ? 30 : 26}
          color={isFocused ? iconActiveColor : iconInactiveColor}
          style={{ marginBottom: 2 }}
        />
        <Text
          numberOfLines={1}
          style={{
            fontSize: 12,
            fontWeight: isFocused ? "800" : "700",
            letterSpacing: 0.2,
            color: isFocused ? textActiveColor : textInactiveColor,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

// --- TAB BAR COMPLETA (tema único para todas las pantallas) ---
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const ORANGE = "#FF9500"
  const ORANGE_DARK = "#E67E00"
  const WHITE = "#FFFFFF"

  const isInvertedTheme = true

  // Colores
  const BAR_BG = isInvertedTheme ? ORANGE : ORANGE
  const ICON_INACTIVE = isInvertedTheme ? "#FFF" : WHITE
  const ICON_ACTIVE = isInvertedTheme ? WHITE : WHITE
  const TEXT_INACTIVE = isInvertedTheme ? "#FFF" : "#fff"
  const TEXT_ACTIVE = isInvertedTheme ? WHITE : WHITE
  const ITEM_ACTIVE_BG = isInvertedTheme ? "#E67E00" : ORANGE_DARK

  // Backdrop animado
  const [layouts, setLayouts] = useState<{ x: number; width: number }[]>(
    Array(state.routes.length).fill({ x: 0, width: 0 }),
  )
  const backX = useSharedValue(0)
  const backW = useSharedValue(0)

  const onItemLayout = (index: number) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout
    setLayouts((prev) => {
      const next = [...prev]
      next[index] = { x, width }
      return next
    })
  }

  useEffect(() => {
    const L = layouts[state.index]
    if (L && L.width > 0) {
      backX.value = withTiming(L.x, { duration: 260, easing: Easing.out(Easing.cubic) })
      backW.value = withTiming(L.width, { duration: 260, easing: Easing.out(Easing.cubic) })
    }
  }, [state.index, layouts])

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: backX.value }],
    width: backW.value,
  }))

  return (
    <View
      style={{
        backgroundColor: BAR_BG,
        borderTopWidth: 0,
        height: 66,
        ...(Platform.OS === "android"
          ? { elevation: 12 }
          : {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -6 },
              shadowOpacity: 0.14,
              shadowRadius: 10,
            }),
      }}
    >
      {/* wrapper con esquinas y bisel */}
      <View style={{ flex: 1, overflow: "hidden", borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
        <View
          style={{
            height: 2,
            width: "100%",
            backgroundColor: isInvertedTheme ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.22)",
          }}
        />
        <View
          style={{
            height: 1,
            width: "100%",
            backgroundColor: isInvertedTheme ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.10)",
          }}
        />

        <View style={{ flex: 1, position: "relative" }}>
          {/* Backdrop activo */}
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                backgroundColor: ITEM_ACTIVE_BG,
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
              },
              backStyle,
            ]}
          />

          {/* Fila de tabs */}
          <View style={{ flexDirection: "row", flex: 1 }}>
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key]
              const label =
                options.tabBarLabel !== undefined
                  ? (options.tabBarLabel as string)
                  : options.title !== undefined
                    ? (options.title as string)
                    : (route.name as string)

              const isFocused = state.index === index

              let iconName: keyof typeof Ionicons.glyphMap = "ellipse-outline"
              switch (route.name) {
                case "Home":
                  iconName = isFocused ? "home" : "home-outline"
                  break
                case "Map":
                  iconName = isFocused ? "map" : "map-outline"
                  break
                case "Favorites":
                  iconName = isFocused ? "heart" : "heart-outline"
                  break
                case "User":
                  iconName = isFocused ? "person" : "person-outline"
                  break
              }

              const onPress = () => {
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true })
                if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name)
              }

              return (
                <TabItem
                  key={route.key}
                  label={label}
                  iconName={iconName}
                  isFocused={isFocused}
                  onPress={onPress}
                  onLayout={onItemLayout(index)}
                  iconActiveColor={ICON_ACTIVE}
                  iconInactiveColor={ICON_INACTIVE}
                  textActiveColor={TEXT_ACTIVE}
                  textInactiveColor={TEXT_INACTIVE}
                />
              )
            })}
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  itemInner: {
    alignItems: "center",
    justifyContent: "center",
  },
})

function MainTabs() {
  const isKeyboardVisible = useKeyboardVisibility()

  return (
    <Tab.Navigator
      tabBar={(props) => (isKeyboardVisible ? null : <CustomTabBar {...props} />)}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={MainScreen} options={{ tabBarLabel: "Inicio" }} />
      <Tab.Screen name="Map" component={MainScreen} options={{ tabBarLabel: "Mapa" }} />
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
            <FiltersProvider>
              <Stack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="Verification" component={VerificationScreen} />
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
              </Stack.Navigator>
            </FiltersProvider>
          </FavoritesProvider>
        </AuthProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  )
}

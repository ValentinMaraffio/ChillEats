"use client"

import React, { useState, useRef, useEffect } from "react"
import { View, TouchableOpacity, Animated } from "react-native"
import { FontAwesome } from "@expo/vector-icons"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../types/navigation"
import { useAuth } from "../context/authContext"
import { styles } from "../screens/Main/mainStyles"

export default function BottomNavBar() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState("Main")

  // Animated values for each tab
  const homeScale = useRef(new Animated.Value(1.2)).current
  const favoritesScale = useRef(new Animated.Value(1)).current
  const profileScale = useRef(new Animated.Value(1)).current

  // Function to animate tab selection
  const animateTab = (tabName: string) => {
    // Reset all scales to normal
    Animated.spring(homeScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start()

    Animated.spring(favoritesScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start()

    Animated.spring(profileScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start()

    // Animate selected tab
    let selectedScale = homeScale
    if (tabName === "Favorites") {
      selectedScale = favoritesScale
    } else if (["Profile", "Register", "Login"].includes(tabName)) {
      selectedScale = profileScale
    }

    Animated.spring(selectedScale, {
      toValue: 1.2,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start()
  }

  // Initialize on mount
  useEffect(() => {
    animateTab("Main")
  }, [])

  // Listen to navigation state changes
  useFocusEffect(
    React.useCallback(() => {
      const state = navigation.getState()
      const routeName = state.routes[state.index].name
      setActiveTab(routeName)
      animateTab(routeName)
    }, []),
  )

  const handleTabPress = (tabName: string, navigateAction: () => void) => {
    setActiveTab(tabName)
    animateTab(tabName)

    setTimeout(() => {
      navigateAction()
    }, 100)
  }

  // Función para obtener el color del icono - SIN usar opacity animada
  const getIconColor = (tabName: string) => {
    const isActive =
      activeTab === tabName ||
      (["Profile", "Register", "Login"].includes(tabName) && ["Profile", "Register", "Login"].includes(activeTab))

    return isActive ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)"
  }

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        onPress={() => handleTabPress("Main", () => navigation.navigate("Main"))}
        style={{ alignItems: "center", justifyContent: "center" }}
      >
        <Animated.View
          style={{
            transform: [{ scale: homeScale }],
          }}
        >
          <FontAwesome name="home" size={28} color={getIconColor("Main")} />
        </Animated.View>
        {activeTab === "Main" && (
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: "#FFFFFF",
              marginTop: 4,
            }}
          />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleTabPress("Favorites", () => navigation.navigate("Favorites"))}
        style={{ alignItems: "center", justifyContent: "center" }}
      >
        <Animated.View
          style={{
            transform: [{ scale: favoritesScale }],
          }}
        >
          <FontAwesome name="heart" size={28} color={getIconColor("Favorites")} />
        </Animated.View>
        {activeTab === "Favorites" && (
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: "#FFFFFF",
              marginTop: 4,
            }}
          />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          const targetTab = user ? "Profile" : "Login"
          handleTabPress(targetTab, () => {
            if (user) {
              navigation.navigate("Profile", {
                username: user.username,
                email: user.email,
              })
            } else {
              navigation.navigate("Login")
            }
          })
        }}
        style={{ alignItems: "center", justifyContent: "center" }}
      >
        <Animated.View
          style={{
            transform: [{ scale: profileScale }],
          }}
        >
          <FontAwesome name="user" size={28} color={getIconColor(user ? "Profile" : "Login")} />
        </Animated.View>
        {(activeTab === "Profile" || activeTab === "Login" || activeTab === "Register") && (
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: "#FFFFFF",
              marginTop: 4,
            }}
          />
        )}
      </TouchableOpacity>
    </View>
  )
}

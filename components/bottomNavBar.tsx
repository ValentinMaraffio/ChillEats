import React from "react"
import { View, TouchableOpacity } from "react-native"
import { FontAwesome } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../types/navigation"
import { useAuth } from "../context/authContext"
import { styles } from "../screens/Main/mainStyles"

export default function BottomNavBar() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { user } = useAuth()

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity onPress={() => navigation.navigate("Main")}>
        <FontAwesome name="home" size={28} color="white" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Favorites")}>
        <FontAwesome name="heart" size={28} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          if (user) {
            navigation.navigate("Profile", {
              username: user.username,
              email: user.email,
            })
          } else {
            navigation.navigate("Login")
          }
        }}
      >
        <FontAwesome name="user" size={28} color="white" />
      </TouchableOpacity>
    </View>
  )
}

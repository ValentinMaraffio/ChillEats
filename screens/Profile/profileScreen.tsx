"use client"
import { View, Text, TouchableOpacity } from "react-native"
import { FontAwesome } from "@expo/vector-icons"
import { widthPercentageToDP as wp } from "react-native-responsive-screen"
import { useAuth } from "../../context/authContext"
import { styles } from "./profileStyles"

export default function ProfileScreen() {
  const { logout, user } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <FontAwesome name="user-circle" size={wp("30%")} color="white" style={styles.avatar} />
        <Text style={styles.title}>Perfil de Usuario</Text>
        <Text style={styles.info}>
          👤 Usuario: <Text style={styles.infoValue}>{user?.username || "Usuario"}</Text>
        </Text>
        <Text style={styles.info}>
          📧 Email: <Text style={styles.infoValue}>{user?.email || "email@ejemplo.com"}</Text>
        </Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

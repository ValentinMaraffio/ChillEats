"use client"

import { StatusBar } from "expo-status-bar"
import { Text, View, ImageBackground, SafeAreaView, TouchableOpacity, ScrollView, Alert } from "react-native"
import { FontAwesome } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../../context/authContext"
import type { NavigationProp } from "./favoritesBackend"
import { styles, tagStyle } from "./favoritesStyles"
import { useFavorites } from "../../context/favoritesContext"
import { calculateDistance } from "../Main/mainBackend"
import * as Location from "expo-location"
import { useEffect, useState } from "react"
import BottomNavBar from "../../components/bottomNavBar"
import { useKeyboardVisibility } from "../../hooks/useKeyboardVisibility"

const Tag = ({ label }: { label: string }) => (
  <View style={tagStyle.container}>
    <Text style={tagStyle.text}>{label}</Text>
  </View>
)

export default function FavoritesScreen() {
  const navigation = useNavigation<NavigationProp>()
  const { user } = useAuth()
  const { favorites, removeFavorite } = useFavorites()
  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null)
  const isKeyboardVisible = useKeyboardVisibility()

  // Obtener la ubicación del usuario al cargar la pantalla
  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({})
          setUserLocation(location.coords)
        }
      } catch (error) {
        console.error("Error al obtener la ubicación:", error)
      }
    }

    getLocation()
  }, [])

  // Manejar la eliminación de un favorito
  const handleRemoveFavorite = (place: any) => {
    Alert.alert("Eliminar favorito", "¿Estás seguro de que quieres eliminar este lugar de tus favoritos?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Eliminar",
        onPress: () => {
          removeFavorite(place)
        },
        style: "destructive",
      },
    ])
  }

  // Si no hay favoritos, mostrar un mensaje
  if (favorites.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ImageBackground
          source={require("../../assets/img/fast-food-bg.jpg")}
          style={styles.background}
          resizeMode="repeat"
          imageStyle={{ opacity: 0.3 }}
        >
          <View style={styles.filters}>
            {["Localidad", "Limitación", "Precio", "Local"].map((filter, index) => (
              <TouchableOpacity key={index} style={styles.filterButton}>
                <Text style={styles.filterText}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tienes lugares favoritos</Text>
            <Text style={styles.emptySubtext}>Agrega lugares a tus favoritos desde el mapa para verlos aquí</Text>
          </View>

          {!isKeyboardVisible && <BottomNavBar />}
        </ImageBackground>
        <StatusBar style="light" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require("../../assets/img/fast-food-bg.jpg")}
        style={styles.background}
        resizeMode="repeat"
        imageStyle={{ opacity: 0.3 }}
      >
        <View style={styles.filters}>
          {["Localidad", "Limitación", "Precio", "Local"].map((filter, index) => (
            <TouchableOpacity key={index} style={styles.filterButton}>
              <Text style={styles.filterText}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {favorites.map((place, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardContent}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{place.name}</Text>
                  <Text style={styles.subtext}>
                    ⭐ {place.rating} ({place.user_ratings_total} reseñas)
                  </Text>
                  {userLocation && (
                    <Text style={styles.subtext}>
                      🚶{" "}
                      {calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        place.geometry.location.lat,
                        place.geometry.location.lng,
                      ).toFixed(1)}{" "}
                      km
                    </Text>
                  )}
                  <View style={styles.tagsRow}>
                    <Tag label="Celíaco" />
                    <Tag label="Vegetariano" />
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleRemoveFavorite(place)} style={styles.favoriteButton}>
                  <FontAwesome name="heart" size={24} color="#ff9500" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {!isKeyboardVisible && <BottomNavBar />}
      </ImageBackground>
      <StatusBar style="light" />
    </SafeAreaView>
  )
}

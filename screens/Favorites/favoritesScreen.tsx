"use client";


import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/authContext";
import { useFavorites } from "../../context/favoritesContext";
import type { NavigationProp } from "./favoritesBackend";
import { styles, tagStyle } from "./favoritesStyles";
import { calculateDistance } from "../Main/mainBackend";
import { useKeyboardVisibility } from "../../hooks/useKeyboardVisibility";


type Place = any;


const Tag = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    style={[
      tagStyle.container,
      selected ? tagStyle.containerSelected : undefined,
    ]}
  >
    <Text style={[tagStyle.text, selected ? tagStyle.textSelected : undefined]}>
      {label}
    </Text>
  </TouchableOpacity>
);


// fallback rápido para mostrar imagen si el lugar no trae foto conocida
const getPlaceImage = (place: Place) => {
  return (
    place?.image ||
    place?.photoUrl ||
    place?.photos?.[0]?.url ||
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop"
  );
};


export default function FavoritesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { favorites, removeFavorite } = useFavorites();
  const [userLocation, setUserLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const isKeyboardVisible = useKeyboardVisibility();


  // búsqueda por nombre
  const [searchText, setSearchText] = useState("");


  // chips visuales
  const [chips, setChips] = useState({
    celiaco: false,
    vegetariano: false,
    vegano: false,
  });


  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          setUserLocation(loc.coords);
        }
      } catch (e) {
        console.log("Error ubicacion:", e);
      }
    })();
  }, []);


  const handleRemoveFavorite = (place: Place) => {
    Alert.alert(
      "Eliminar favorito",
      "¿Estás seguro de eliminar este lugar de tus favoritos?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => removeFavorite(place),
        },
      ]
    );
  };


  const filteredFavorites = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return favorites;
    return favorites.filter((p: Place) =>
      (p?.name ?? "").toLowerCase().includes(q)
    );
  }, [favorites, searchText]);


  return (
    <SafeAreaView style={styles.safeAreaV2}>
      {/* Header + Search */}
      <View style={styles.header}>
        <Text style={styles.helloText}>
          Hola <Text style={styles.wave}>👋</Text>
        </Text>


        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre…"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchText("")}
              accessibilityLabel="Borrar búsqueda"
            >
              <Ionicons name="close" size={18} />
            </TouchableOpacity>
          )}
        </View>


        {/* Chips (solo visuales) */}
        <View style={styles.chipsRow}>
          <Tag
            label="Celíaco"
            selected={chips.celiaco}
            onPress={() => setChips((s) => ({ ...s, celiaco: !s.celiaco }))}
          />
          <Tag
            label="Vegetariano"
            selected={chips.vegetariano}
            onPress={() =>
              setChips((s) => ({ ...s, vegetariano: !s.vegetariano }))
            }
          />
          <Tag
            label="Vegano"
            selected={chips.vegano}
            onPress={() => setChips((s) => ({ ...s, vegano: !s.vegano }))}
          />
        </View>
      </View>


      {/* Lista */}
      {filteredFavorites.length === 0 ? (
        <View style={styles.emptyContainerV2}>
          <Text style={styles.emptyTitle}>No hay favoritos</Text>
          <Text style={styles.emptySubtitle}>
            Agrega lugares desde el mapa o quita el filtro de búsqueda.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: isKeyboardVisible ? 220 : 120 }}
          showsVerticalScrollIndicator={false}
        >
          {filteredFavorites.map((place: Place, idx: number) => {
            const distance =
              userLocation &&
              calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                place?.geometry?.location?.lat ?? place?.latitude ?? 0,
                place?.geometry?.location?.lng ?? place?.longitude ?? 0
              );


            return (
              <View key={`${place?.id ?? idx}`} style={styles.cardV2}>
                <Image
                  source={{ uri: getPlaceImage(place) }}
                  style={styles.cardImage}
                />


                <View style={styles.cardInfo}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{place?.name}</Text>


                    <View style={styles.metaRow}>
                      <Ionicons name="star" size={14} />
                      <Text style={styles.metaText}>
                        {Number(place?.rating ?? 0).toFixed(1)}
                        {place?.user_ratings_total
                          ? ` • ${place.user_ratings_total} reseñas`
                          : ""}
                      </Text>
                      {typeof distance === "number" && (
                        <>
                          <Text style={styles.dot}>•</Text>
                          <Ionicons name="walk" size={14} />
                          <Text style={styles.metaText}>
                            {distance.toFixed(1)} km
                          </Text>
                        </>
                      )}
                    </View>
                  </View>


                  <TouchableOpacity
                    onPress={() => handleRemoveFavorite(place)}
                    style={styles.heartBtn}
                    accessibilityLabel="Quitar de favoritos"
                  >
                    <FontAwesome name="heart" size={22} color="#ff9500" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}


      <StatusBar style="dark" />
    </SafeAreaView>
  );
}
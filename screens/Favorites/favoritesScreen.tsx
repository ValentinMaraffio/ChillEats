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
import { getPrimaryPhotoUrl, AVAILABLE_FILTERS, matchesSelectedFilters, } from "./favoritesBackend"; // <<< nuevo helper
import { styles, tagStyle } from "./favoritesStyles";
import { calculateDistance } from "../Main/mainBackend";
import { useKeyboardVisibility } from "../../hooks/useKeyboardVisibility";
import { getPhotoUrl } from "../Main/mainBackend";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { TabParamList } from "../../types/navigation"; // el mismo que usa tu Main

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

export default function FavoritesScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<any>>();
  const { user } = useAuth();
  const { favorites, removeFavorite } = useFavorites();
  const [userLocation, setUserLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const isKeyboardVisible = useKeyboardVisibility();

  // búsqueda por nombre
  const [searchText, setSearchText] = useState("");

const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
const toggleFilter = (label: string) => {
  setSelectedFilters((prev) =>
    prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
  );
};

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

  // Ordena por distancia (cerca → lejos)
const sortedByDistance = (list: any[]) => {
  if (!userLocation) return list;
  return [...list].sort((a, b) => {
    const da =
      calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        a?.geometry?.location?.lat,
        a?.geometry?.location?.lng
      ) ?? Number.POSITIVE_INFINITY;

    const db =
      calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        b?.geometry?.location?.lat,
        b?.geometry?.location?.lng
      ) ?? Number.POSITIVE_INFINITY;

    return da - db;
  });
};

// Navegar a Main en “modo carrusel de favoritos”
const onPressCard = (place: any) => {
  // Tomamos la lista ya filtrada y la ordenamos por distancia
  const ordered = sortedByDistance(filteredFavorites);
  // Armamos sólo los IDs en el orden cerca→lejos
  const favoriteIds = ordered
    .map((p) => p.place_id ?? p.id)
    .filter(Boolean);

  navigation.navigate("Map", {
    carouselSource: "favorites",
    initialPlaceId: place.place_id ?? place.id,
    favoriteIds,
    showDietBadge: selectedFilters.length > 0,
    badgeFilters: selectedFilters.length > 0 ? [...selectedFilters] : [],
  });
};


const filteredFavorites = useMemo(() => {
  let list = Array.isArray(favorites) ? [...favorites] : [];

  // 1) por nombre
  const q = searchText.trim().toLowerCase();
  if (q) {
    list = list.filter((p: any) => (p?.name ?? "").toLowerCase().includes(q));
  }

  // 2) por filtros dietarios
  if (selectedFilters.length > 0) {
    list = list.filter((p: any) => matchesSelectedFilters(p, selectedFilters));
  }
  
   if (userLocation) {
     list.sort((a: any, b: any) => {
       const da = calculateDistance(
         userLocation.latitude, userLocation.longitude,
         a?.geometry?.location?.lat, a?.geometry?.location?.lng
       ) ?? Number.POSITIVE_INFINITY;
       const db = calculateDistance(
        userLocation.latitude, userLocation.longitude,
         b?.geometry?.location?.lat, b?.geometry?.location?.lng
       ) ?? Number.POSITIVE_INFINITY;
       return da - db;
     });
   }

  return list;
}, [favorites, searchText, selectedFilters, userLocation]);


  return (
    <SafeAreaView style={styles.safeAreaV2}>
      {/* Header + Search */}
      <View style={styles.header}>
        <Text style={styles.helloText}>
           <Text style={styles.wave}></Text>
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
        <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.chipsRow}
>
  {[
    { key: "Recomendados", label: "Recomendados" },
    { key: "sin tacc", label: "Sin TACC" },
    { key: "vegano", label: "Vegano" },
    { key: "vegetariano", label: "Vegetariano" },
    { key: "kosher", label: "Kosher" },
    { key: "halal", label: "Halal" },
    { key: "keto", label: "Keto" },
    { key: "paleo", label: "Paleo" },
  ].map((filter) => {
    const active = selectedFilters.includes(filter.key);
    return (
      <TouchableOpacity
        key={filter.key}
        onPress={() => toggleFilter(filter.key)}
        style={[
          tagStyle.container,
          active && tagStyle.containerSelected,
        ]}
      >
        <Text
          style={[
            tagStyle.text,
            active && tagStyle.textSelected,
          ]}
        >
          {filter.label}
        </Text>
      </TouchableOpacity>
    );
  })}
</ScrollView>


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

            const imageUri = getPrimaryPhotoUrl(place); // <<< usa el helper

            return (
              <TouchableOpacity
                key={`${place?.place_id ?? place?.id ?? idx}`}
                style={styles.cardV2}
                activeOpacity={0.9}
                onPress={() => onPressCard(place)}
              >
                <Image source={{ uri: imageUri }} style={styles.cardImage} />

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
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

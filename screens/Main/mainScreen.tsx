"use client"

import "react-native-get-random-values"
import { useEffect, useState, useRef, useCallback } from "react"
import {
  Dimensions,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
  Animated,
  StyleSheet,
  PanResponder,
  Alert,
} from "react-native"
import MapView, { PROVIDER_GOOGLE, Marker, type Camera } from "react-native-maps"
import type * as Location from "expo-location"
import { FontAwesome, Ionicons } from "@expo/vector-icons"
import { useAuth } from "../../context/authContext"
import { v4 as uuidv4 } from "uuid"
import { styles } from "./mainStyles"
import {
  getCurrentLocation,
  searchPlaces,
  getPlaceAutocomplete,
  getPlaceDetails,
  sortPlacesByDistance,
  calculateDistance,
  type Place,
} from "./mainBackend"
import { useFavorites } from "../../context/favoritesContext"
import BottomNavBar from "../../components/bottomNavBar"
import { useKeyboardVisibility } from "../../hooks/useKeyboardVisibility"

const { width, height } = Dimensions.get("window")

export default function MainScreen() {
  const scrollX = useRef(new Animated.Value(0)).current
  const flatListRef = useRef<FlatList>(null)
  const isKeyboardVisible = useKeyboardVisibility()
  const { user } = useAuth()
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites()
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null)
  const [places, setPlaces] = useState<Place[]>([])
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [searchText, setSearchText] = useState("")
  const [predictions, setPredictions] = useState<any[]>([])
  const [selectedDistance, setSelectedDistance] = useState<number | null>(null)
  const [hasSelectedPrediction, setHasSelectedPrediction] = useState(false)
  const mapRef = useRef<MapView>(null)
  const markerPressRef = useRef(false)
  const isScrollingRef = useRef(false)

  // Nuevo estado para controlar si la card es deslizable o no
  const [isCardScrollable, setIsCardScrollable] = useState(true)

  // Carousel configuration with proper centering
  const ITEM_WIDTH = width * 0.75
  const SPACING = 20
  const TOTAL_ITEM_WIDTH = ITEM_WIDTH + SPACING
  const SIDE_SPACING = (width - ITEM_WIDTH) / 2 // This ensures proper centering

  const [nearbyPlacesList, setNearbyPlacesList] = useState<Place[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const bottomSheetPosition = useRef(new Animated.Value(height)).current
  const currentPositionRef = useRef(height)
  const bottomSheetHeight = height * 0.6
  const snapPoints = {
    top: height * 0.2,
    bottom: height,
  }

  // Función unificada para centrar el carrusel con padding lateral
  const scrollToIndex = useCallback(
    (index: number, animated = false) => {
      if (!flatListRef.current || nearbyPlacesList.length === 0) return

      // Calcular el offset para centrar perfectamente cada card
      const offsetX = index * TOTAL_ITEM_WIDTH

      flatListRef.current.scrollToOffset({
        offset: offsetX,
        animated,
      })
    },
    [nearbyPlacesList, TOTAL_ITEM_WIDTH],
  )

  // Actualizar el scroll cuando cambia el índice actual
  useEffect(() => {
    if (nearbyPlacesList.length > 0 && !isScrollingRef.current && isCardScrollable) {
      const timer = setTimeout(() => {
        scrollToIndex(currentIndex, true)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [currentIndex, nearbyPlacesList, scrollToIndex, isCardScrollable])

  // Centrado adicional cuando se crea la lista por primera vez
  useEffect(() => {
    if (nearbyPlacesList.length > 0 && currentIndex === 0) {
      const timer = setTimeout(() => {
        scrollToIndex(0, false)
      }, 200)

      return () => clearTimeout(timer)
    }
  }, [nearbyPlacesList.length, scrollToIndex])

  // Set up a listener for the animated value
  useEffect(() => {
    const id = bottomSheetPosition.addListener(({ value }) => {
      currentPositionRef.current = value
    })

    return () => {
      bottomSheetPosition.removeListener(id)
    }
  }, [])

  // Pan responder for the bottom sheet
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newPosition = snapPoints.top + gestureState.dy
        if (newPosition >= snapPoints.top && newPosition <= snapPoints.bottom) {
          bottomSheetPosition.setValue(newPosition)
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.vy > 0.5 || (gestureState.dy > 50 && gestureState.vy > 0)) {
          closeBottomSheet()
        } else if (gestureState.vy < -0.5 || (gestureState.dy < -50 && gestureState.vy < 0)) {
          expandBottomSheet()
        } else {
          const currentPosition = currentPositionRef.current
          if (currentPosition > snapPoints.top + (snapPoints.bottom - snapPoints.top) / 2) {
            closeBottomSheet()
          } else {
            expandBottomSheet()
          }
        }
      },
    }),
  ).current

  const showAndExpandBottomSheet = () => {
    setShowBottomSheet(true)
    Animated.spring(bottomSheetPosition, {
      toValue: snapPoints.top,
      useNativeDriver: true,
      bounciness: 4,
    }).start()
  }

  const expandBottomSheet = () => {
    Animated.spring(bottomSheetPosition, {
      toValue: snapPoints.top,
      useNativeDriver: true,
      bounciness: 4,
    }).start()
  }

  const closeBottomSheet = () => {
    Animated.timing(bottomSheetPosition, {
      toValue: snapPoints.bottom,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowBottomSheet(false)
    })
  }

  useEffect(() => {
    ;(async () => {
      const coords = await getCurrentLocation()
      setLocation(coords)
    })()
  }, [])

  const centerMapOnUser = async () => {
    const currentLocation = await getCurrentLocation()
    if (currentLocation) {
      setLocation(currentLocation)
      mapRef.current?.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      })
    }
  }

  const faceNorth = () => {
    if (!location || !mapRef.current) return
    const camera: Partial<Camera> = { heading: 0 }
    mapRef.current.animateCamera(camera as Camera, { duration: 1000 })
  }

  const centerMapOnPlace = (place: Place) => {
    mapRef.current?.animateToRegion(
      {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      1000,
    )
  }

  // Función para ocultar las cards
  const hideCards = () => {
    setSelectedPlace(null)
  }

  const resetMap = () => {
    setPlaces([])
    setSelectedPlace(null)
    setNearbyPlacesList([])
    setPredictions([])
    setShowBottomSheet(false)
    setCurrentIndex(0)
    setIsCardScrollable(true) // Resetear el estado de scrollable

    if (location) {
      mapRef.current?.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      })
    }
  }

  const handleSearch = async () => {
    if (!searchText || !searchText.trim()) {
      resetMap()
      return
    }

    if (!location) return

    if (hasSelectedPrediction) {
      setHasSelectedPrediction(false)
      return
    }

    setPredictions([])

    const results = await searchPlaces(searchText, location)

    if (showBottomSheet) {
      closeBottomSheet()
    }

    setPlaces(results)
    const sortedPlaces = sortPlacesByDistance(results, location)
    setNearbyPlacesList(sortedPlaces)
    setIsCardScrollable(true) // Búsqueda normal permite scroll

    if (sortedPlaces.length > 0) {
      setCurrentIndex(0)
      setSelectedPlace(sortedPlaces[0])
      centerMapOnPlace(sortedPlaces[0])

      setTimeout(() => {
        scrollToIndex(0, false)
      }, 300)
    }
  }

  const handleAutocomplete = async (query: string) => {
    if (!query) {
      setPredictions([])
      return
    }

    if (!location) return

    const predictions = await getPlaceAutocomplete(query, location)
    setPredictions(predictions)
  }

  const handleSelectPlace = (place: Place) => {
    markerPressRef.current = true

    if (showBottomSheet) {
      closeBottomSheet()
    }

    // Si hay múltiples lugares, mostrar el carrusel normal
    if (places.length > 1) {
      const sortedPlaces = sortPlacesByDistance(places, location)
      const index = sortedPlaces.findIndex(
        (p: Place) =>
          p.geometry.location.lat === place.geometry.location.lat &&
          p.geometry.location.lng === place.geometry.location.lng,
      )

      if (index >= 0) {
        setNearbyPlacesList(sortedPlaces)
        setCurrentIndex(index)
        setSelectedPlace(place)
        centerMapOnPlace(place)
        setIsCardScrollable(true) // Permitir scroll para múltiples lugares
      }
    } else {
      // Si solo hay un lugar (desde predicción), mostrar solo ese lugar sin scroll
      setNearbyPlacesList([place])
      setCurrentIndex(0)
      setSelectedPlace(place)
      centerMapOnPlace(place)
      setIsCardScrollable(false) // No permitir scroll para un solo lugar
    }
  }

  const handleSelectPrediction = async (prediction: any) => {
    setSearchText(prediction.description)
    setPredictions([])
    setHasSelectedPrediction(true)

    const place = await getPlaceDetails(prediction.place_id)

    if (place) {
      // Para predicciones, solo mostrar ese lugar específico
      setPlaces([place])
      setNearbyPlacesList([place])
      setCurrentIndex(0)
      setSelectedPlace(place)
      setIsCardScrollable(false) // No permitir scroll para predicciones

      centerMapOnPlace(place)
    }
  }

  const handleSelectedCardPress = () => {
    if (selectedPlace) {
      showAndExpandBottomSheet()
    }
  }

  const toggleFavorite = (place: Place) => {
    if (isFavorite(place)) {
      removeFavorite(place)
      Alert.alert("Eliminado", "El lugar ha sido eliminado de tus favoritos")
    } else {
      addFavorite(place)
      Alert.alert("Agregado", "El lugar ha sido agregado a tus favoritos")
    }
  }

  const handleScrollBegin = () => {
    if (!isCardScrollable) return // No permitir scroll si no es scrollable
    isScrollingRef.current = true
  }

  // Manejador de scroll mejorado para evitar la "corrección" posterior
  const handleScrollEnd = (event: any) => {
    if (nearbyPlacesList.length <= 1 || !isCardScrollable) return

    const offsetX = event.nativeEvent.contentOffset.x
    // Calculamos el índice teniendo en cuenta el padding lateral
    const index = Math.round(offsetX / TOTAL_ITEM_WIDTH)

    if (index !== currentIndex && index >= 0 && index < nearbyPlacesList.length) {
      // Actualizamos el estado sin animación adicional
      setCurrentIndex(index)
      const newPlace = nearbyPlacesList[index]
      setSelectedPlace(newPlace)
      centerMapOnPlace(newPlace)
    }

    isScrollingRef.current = false
  }

  // Renderizar el carrusel con padding lateral para centrado perfecto
  const renderCarousel = () => {
    if (!selectedPlace || isKeyboardVisible || showBottomSheet || nearbyPlacesList.length === 0) {
      return null
    }

    return (
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          horizontal
          data={nearbyPlacesList}
          keyExtractor={(item, index) =>
            `carousel-${index}-${item.geometry.location.lat}-${item.geometry.location.lng}`
          }
          getItemLayout={(data, index) => ({
            length: TOTAL_ITEM_WIDTH,
            offset: TOTAL_ITEM_WIDTH * index,
            index,
          })}
          renderItem={({ item, index }) => {
            const isSelected = index === currentIndex

            return (
              <View
                style={{
                  width: TOTAL_ITEM_WIDTH,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    if (index !== currentIndex && isCardScrollable) {
                      setCurrentIndex(index)
                      setSelectedPlace(nearbyPlacesList[index])
                      centerMapOnPlace(nearbyPlacesList[index])
                    } else {
                      handleSelectedCardPress()
                    }
                  }}
                  style={[
                    styles.carouselCard,
                    {
                      width: ITEM_WIDTH,
                      opacity: isSelected ? 1 : 0.7,
                      transform: [{ scale: isSelected ? 1 : 0.95 }],
                    },
                  ]}
                >
                  <Text style={styles.placeName}>{item.name}</Text>
                  <Text style={styles.placeRating}>
                    ⭐ {item.rating} ({item.user_ratings_total} reseñas)
                  </Text>
                  {location && (
                    <Text style={styles.placeDistance}>
                      🚶{" "}
                      {calculateDistance(
                        location.latitude,
                        location.longitude,
                        item.geometry.location.lat,
                        item.geometry.location.lng,
                      ).toFixed(1)}{" "}
                      km
                    </Text>
                  )}
                  <View style={styles.badges}>
                    <Text style={styles.badge}>Celiaco</Text>
                    <Text style={styles.badge}>Vegetariano</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )
          }}
          showsHorizontalScrollIndicator={false}
          snapToInterval={TOTAL_ITEM_WIDTH}
          snapToAlignment="center"
          decelerationRate={0.8}
          disableIntervalMomentum={true}
          snapToOffsets={nearbyPlacesList.map((_, index) => index * TOTAL_ITEM_WIDTH)}
          contentContainerStyle={{
            paddingHorizontal: SIDE_SPACING,
          }}
          scrollEnabled={isCardScrollable} // Controlar si se puede hacer scroll o no
          onScrollBeginDrag={handleScrollBegin}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollToIndexFailed={(info) => {
            const wait = new Promise((resolve) => setTimeout(resolve, 500))
            wait.then(() => {
              if (flatListRef.current) {
                scrollToIndex(info.index, false)
              }
            })
          }}
        />
      </View>
    )
  }

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff9500" />
        <Text style={{ marginTop: 10 }}>Cargando ubicación...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss()
            setPredictions([])
            // Si el bottomSheet está visible, solo cerrarlo sin ocultar las cards
            if (showBottomSheet) {
              closeBottomSheet()
            }
            // Si no hay bottomSheet pero hay cards visibles, ocultarlas
            else if (selectedPlace) {
              hideCards()
            }
          }}
        >
          <View style={{ flex: 1 }}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={StyleSheet.absoluteFill}
              showsUserLocation={true}
              showsMyLocationButton={false}
              showsCompass={false}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              mapPadding={{ top: 0, right: 0, bottom: 160, left: 0 }}
              onPress={() => {
                if (markerPressRef.current) {
                  markerPressRef.current = false
                } else {
                  if (showBottomSheet) {
                    // Solo cerrar el bottomSheet sin ocultar las cards
                    closeBottomSheet()
                  } else {
                    // Ocultar las cards cuando se toca el mapa (solo si no hay bottomSheet)
                    hideCards()
                  }
                }
              }}
            >
              {places.map((place) => (
                <Marker
                  key={uuidv4()}
                  coordinate={{
                    latitude: place.geometry.location.lat,
                    longitude: place.geometry.location.lng,
                  }}
                  title={place.name}
                  onPress={() => handleSelectPlace(place)}
                />
              ))}
            </MapView>

            {!isKeyboardVisible && !selectedPlace && (
              <View style={styles.floatingButtons}>
                <TouchableOpacity onPress={centerMapOnUser} style={styles.floatButton}>
                  <Ionicons name="locate" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={faceNorth} style={styles.floatButton}>
                  <Ionicons name="compass" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.searchContainer}>
              <View style={styles.searchBlock}>
                <View style={styles.searchBar}>
                  <FontAwesome name="search" size={18} color="gray" style={{ marginLeft: 10 }} />
                  <TextInput
                    placeholder="Buscar..."
                    placeholderTextColor="gray"
                    style={styles.searchInput}
                    value={searchText}
                    onChangeText={(text) => {
                      setSearchText(text)
                      if (!text || text.trim() === "") {
                        resetMap()
                        setPredictions([])
                      } else {
                        handleAutocomplete(text)
                      }
                    }}
                    onSubmitEditing={handleSearch}
                  />
                </View>

                {predictions.length > 0 && (
                  <FlatList
                    data={predictions}
                    renderItem={({ item }) => (
                      <TouchableOpacity style={styles.predictionItem} onPress={() => handleSelectPrediction(item)}>
                        <Text style={styles.predictionText}>{item.description}</Text>
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.place_id}
                    style={styles.predictionList}
                  />
                )}
              </View>

              <View style={styles.filters}>
                {["Localidad", "Limitación", "Precio", "Local"].map((filter) => (
                  <TouchableOpacity key={uuidv4()} style={styles.filterButton}>
                    <Text style={styles.filterText}>{filter}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {renderCarousel()}

            {/* Bottom Sheet */}
            {showBottomSheet && (
              <Animated.View
                style={[
                  styles.bottomSheet,
                  {
                    transform: [{ translateY: bottomSheetPosition }],
                    height: bottomSheetHeight,
                  },
                ]}
                {...panResponder.panHandlers}
              >
                <View style={styles.bottomSheetHandle} />
                <View style={styles.bottomSheetContent}>
                  {selectedPlace && (
                    <>
                      <View style={styles.bottomSheetHeader}>
                        <Text style={styles.bottomSheetTitle}>{selectedPlace.name}</Text>
                        <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(selectedPlace)}>
                          <FontAwesome
                            name={isFavorite(selectedPlace) ? "heart" : "heart-o"}
                            size={24}
                            color="#ff9500"
                          />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.bottomSheetRating}>
                        ⭐ {selectedPlace.rating} ({selectedPlace.user_ratings_total} reseñas)
                      </Text>
                      {location && (
                        <Text style={styles.bottomSheetDistance}>
                          🚶{" "}
                          {calculateDistance(
                            location.latitude,
                            location.longitude,
                            selectedPlace.geometry.location.lat,
                            selectedPlace.geometry.location.lng,
                          ).toFixed(1)}{" "}
                          km
                        </Text>
                      )}
                      <View style={styles.bottomSheetBadges}>
                        <Text style={styles.badge}>Celiaco</Text>
                        <Text style={styles.badge}>Vegetariano</Text>
                      </View>

                      <Text style={styles.bottomSheetDescription}>
                        Desliza hacia arriba para ver más información o hacia abajo para cerrar.
                      </Text>
                    </>
                  )}
                </View>
              </Animated.View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {!isKeyboardVisible && <BottomNavBar />}
    </SafeAreaView>
  )
}

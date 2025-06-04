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
  StyleSheet,
  Alert,
  Animated as RNAnimated,
  StatusBar,
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
  clamp,
} from "react-native-reanimated"
import { PanGestureHandler } from "react-native-gesture-handler"

const { width, height } = Dimensions.get("window")

export default function MainScreen() {
  const scrollX = useRef(new RNAnimated.Value(0)).current
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
  const SIDE_SPACING = (width - ITEM_WIDTH) / 2

  const [nearbyPlacesList, setNearbyPlacesList] = useState<Place[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const bottomSheetHeight = height // Cambiar de height * 0.9 a height completo

  // MEJORA: Ref para controlar cuando necesitamos reposicionar el carrusel
  const needsRepositioning = useRef(false)

  // MEJORA: Usando react-native-reanimated con límites más estrictos
  const translateY = useSharedValue(height)

  // Obtener la altura de la barra de estado
  const statusBarHeight = StatusBar.currentHeight || 0
  const safeAreaTop = Platform.OS === 'ios' ? 44 : statusBarHeight // iOS tiene notch/dynamic island

  // MEJORA: Snap points con límites más seguros - respetar área segura
  const snapPoints = {
    expanded: 0, // Permitir que vaya hasta arriba completamente
    middle: height * 0.4,
    closed: height,
  }

  // MEJORA: Límites absolutos para prevenir crashes - respetar área segura
  const ABSOLUTE_MIN = 0 // Permitir ir hasta arriba completamente
  const ABSOLUTE_MAX = height + 100

  // Función para obtener el snap point más cercano con validación
  const getClosestSnapPoint = (position: number) => {
    // Asegurar que la posición esté dentro de límites seguros
    const safePosition = Math.max(ABSOLUTE_MIN, Math.min(ABSOLUTE_MAX, position))

    const distances = [
      { point: snapPoints.expanded, distance: Math.abs(safePosition - snapPoints.expanded) },
      { point: snapPoints.middle, distance: Math.abs(safePosition - snapPoints.middle) },
      { point: snapPoints.closed, distance: Math.abs(safePosition - snapPoints.closed) },
    ]
    return distances.reduce((closest, current) => (current.distance < closest.distance ? current : closest)).point
  }

  // Función para cerrar el bottom sheet (llamada desde JS)
  const closeBottomSheetJS = () => {
    try {
      setShowBottomSheet(false)
      // MEJORA: Marcar que necesitamos reposicionar el carrusel
      needsRepositioning.current = true
    } catch (error) {
      console.log("Error closing bottom sheet:", error)
    }
  }

  // MEJORA: Gesture handler con límites más estrictos y validaciones
  const gestureHandler = useAnimatedGestureHandler<any, { y: number }>({
    onStart: (_, context) => {
      context.y = translateY.value
    },
    onActive: (event, context) => {
      // MEJORA: Validar que los valores sean números válidos
      if (typeof context.y !== "number" || typeof event.translationY !== "number") {
        return
      }

      const newPosition = context.y + event.translationY

      // MEJORA: Usar clamp para límites más estrictos
      let clampedPosition = clamp(newPosition, ABSOLUTE_MIN, ABSOLUTE_MAX)

      // MEJORA: Resistencia más suave y controlada
      if (newPosition < snapPoints.expanded) {
        const overscroll = snapPoints.expanded - newPosition
        clampedPosition = snapPoints.expanded - Math.min(overscroll * 0.2, 30) // Máximo 30px de overscroll
      } else if (newPosition > snapPoints.closed) {
        const overscroll = newPosition - snapPoints.closed
        clampedPosition = snapPoints.closed + Math.min(overscroll * 0.2, 50) // Máximo 50px de overscroll
      }

      // MEJORA: Validar el valor final antes de asignarlo
      if (typeof clampedPosition === "number" && !isNaN(clampedPosition)) {
        translateY.value = clampedPosition
      }
    },
    onEnd: (event) => {
      try {
        // MEJORA: Validar velocidad y posición
        const velocity = typeof event.velocityY === "number" ? event.velocityY : 0
        const currentPos = typeof translateY.value === "number" ? translateY.value : snapPoints.middle

        // MEJORA: Limitar velocidad extrema
        const clampedVelocity = clamp(velocity, -5000, 5000)

        let targetPosition: number

        // Lógica de snap mejorada con validaciones
        if (Math.abs(clampedVelocity) > 1200) {
          if (clampedVelocity > 0) {
            // Movimiento rápido hacia abajo
            if (currentPos < snapPoints.middle) {
              targetPosition = snapPoints.middle
            } else {
              targetPosition = snapPoints.closed
            }
          } else {
            // Movimiento rápido hacia arriba
            if (currentPos > snapPoints.middle) {
              targetPosition = snapPoints.middle
            } else {
              targetPosition = snapPoints.expanded
            }
          }
        } else {
          // Para velocidades normales, usar la posición más cercana
          targetPosition = getClosestSnapPoint(currentPos)
        }

        // MEJORA: Validar posición objetivo
        if (typeof targetPosition !== "number" || isNaN(targetPosition)) {
          targetPosition = snapPoints.middle
        }

        // Animación con configuración más conservadora
        if (targetPosition === snapPoints.closed) {
          translateY.value = withTiming(
            targetPosition,
            {
              duration: 300, // Duración un poco más larga para más estabilidad
            },
            (finished) => {
              if (finished) {
                runOnJS(closeBottomSheetJS)()
              }
            },
          )
        } else {
          translateY.value = withSpring(targetPosition, {
            damping: 25, // Más damping para más estabilidad
            stiffness: 250, // Menos stiffness para suavidad
            mass: 1, // Masa más alta para más estabilidad
          })
        }
      } catch (error) {
        // En caso de error, ir a posición segura
        translateY.value = withTiming(snapPoints.middle, { duration: 300 })
      }
    },
  })

  // MEJORA: Estilo animado con validaciones
  const bottomSheetStyle = useAnimatedStyle(() => {
    // Validar que translateY.value sea un número válido
    const translateValue =
      typeof translateY.value === "number" && !isNaN(translateY.value)
        ? clamp(translateY.value, ABSOLUTE_MIN, ABSOLUTE_MAX)
        : snapPoints.closed

    return {
      transform: [{ translateY: translateValue }],
    }
  })

  // MEJORA: Funciones de control más seguras
  const showAndExpandBottomSheet = () => {
    try {
      setShowBottomSheet(true)
      translateY.value = snapPoints.closed

      // Animación de entrada más segura
      setTimeout(() => {
        translateY.value = withSpring(snapPoints.middle, {
          damping: 25,
          stiffness: 250,
          mass: 1,
        })
      }, 50)
    } catch (error) {
      console.log("Error showing bottom sheet:", error)
    }
  }

  const snapToExpanded = () => {
    translateY.value = withSpring(snapPoints.expanded, {
      damping: 25,
      stiffness: 250,
      mass: 1,
    })
  }

  const snapToMiddle = () => {
    translateY.value = withSpring(snapPoints.middle, {
      damping: 25,
      stiffness: 250,
      mass: 1,
    })
  }

  const closeBottomSheet = () => {
    translateY.value = withTiming(
      snapPoints.closed,
      {
        duration: 300,
      },
      (finished) => {
        if (finished) {
          runOnJS(closeBottomSheetJS)()
        }
      },
    )
  }

  // MEJORA: Función unificada para centrar el carrusel con mejor control
  const scrollToIndex = useCallback(
    (index: number, animated = false) => {
      if (!flatListRef.current || nearbyPlacesList.length === 0) return

      const offsetX = index * TOTAL_ITEM_WIDTH

      flatListRef.current.scrollToOffset({
        offset: offsetX,
        animated,
      })
    },
    [nearbyPlacesList, TOTAL_ITEM_WIDTH],
  )

  // MEJORA: Effect para reposicionar el carrusel cuando se cierra el bottom sheet
  useEffect(() => {
    if (!showBottomSheet && needsRepositioning.current && nearbyPlacesList.length > 0) {
      // Pequeño delay para asegurar que el carrusel esté visible
      const timer = setTimeout(() => {
        scrollToIndex(currentIndex, false) // Sin animación para posicionamiento inmediato
        needsRepositioning.current = false
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [showBottomSheet, currentIndex, nearbyPlacesList, scrollToIndex])

  // Actualizar el scroll cuando cambia el índice actual (solo si no hay bottom sheet)
  useEffect(() => {
    if (nearbyPlacesList.length > 0 && !isScrollingRef.current && isCardScrollable && !showBottomSheet) {
      const timer = setTimeout(() => {
        scrollToIndex(currentIndex, true)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [currentIndex, nearbyPlacesList, scrollToIndex, isCardScrollable, showBottomSheet])

  // Centrado adicional cuando se crea la lista por primera vez
  useEffect(() => {
    if (nearbyPlacesList.length > 0 && currentIndex === 0 && !showBottomSheet) {
      const timer = setTimeout(() => {
        scrollToIndex(0, false)
      }, 200)

      return () => clearTimeout(timer)
    }
  }, [nearbyPlacesList.length, scrollToIndex, showBottomSheet])

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
    setNearbyPlacesList([])
    setCurrentIndex(0)
  }

  // MEJORA: Función de reset más específica que no afecta el carrusel innecesariamente
  const resetMapForNewSearch = () => {
    setPlaces([])
    setSelectedPlace(null)
    setNearbyPlacesList([])
    setPredictions([])
    setShowBottomSheet(false)
    setCurrentIndex(0)
    setIsCardScrollable(true)
    needsRepositioning.current = false // Reset del flag

    // Reset seguro del bottom sheet
    translateY.value = snapPoints.closed

    if (location) {
      mapRef.current?.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      })
    }
  }

  // MEJORA: Función para cerrar solo el bottom sheet sin afectar el carrusel
  const closeBottomSheetOnly = () => {
    if (showBottomSheet) {
      closeBottomSheet()
    }
  }

  const handleSearch = async () => {
    if (!searchText || !searchText.trim()) {
      resetMapForNewSearch()
      return
    }

    if (!location) return

    if (hasSelectedPrediction) {
      setHasSelectedPrediction(false)
      return
    }

    setPredictions([])

    const results = await searchPlaces(searchText, location)

    closeBottomSheetOnly()

    setPlaces(results)
    const sortedPlaces = sortPlacesByDistance(results, location)
    setNearbyPlacesList(sortedPlaces)
    setIsCardScrollable(true)

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

    closeBottomSheetOnly()

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
        setIsCardScrollable(true)
      }
    } else {
      setNearbyPlacesList([place])
      setCurrentIndex(0)
      setSelectedPlace(place)
      centerMapOnPlace(place)
      setIsCardScrollable(false)
    }
  }

  const handleSelectPrediction = async (prediction: any) => {
    setSearchText(prediction.description)
    setPredictions([])
    setHasSelectedPrediction(true)

    const place = await getPlaceDetails(prediction.place_id)

    if (place) {
      setPlaces([place])
      setNearbyPlacesList([place])
      setCurrentIndex(0)
      setSelectedPlace(place)
      setIsCardScrollable(false)

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
    if (!isCardScrollable) return
    isScrollingRef.current = true
  }

  const handleScrollEnd = (event: any) => {
    if (nearbyPlacesList.length <= 1 || !isCardScrollable) return

    const offsetX = event.nativeEvent.contentOffset.x
    const index = Math.round(offsetX / TOTAL_ITEM_WIDTH)

    if (index !== currentIndex && index >= 0 && index < nearbyPlacesList.length) {
      setCurrentIndex(index)
      const newPlace = nearbyPlacesList[index]
      setSelectedPlace(newPlace)
      centerMapOnPlace(newPlace)
    }

    isScrollingRef.current = false
  }

  // MEJORA: Renderizar el carrusel con mejor control de posicionamiento
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
          scrollEnabled={isCardScrollable}
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
          // MEJORA: Asegurar que el carrusel mantenga su posición inicial
          initialScrollIndex={currentIndex}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
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
            if (showBottomSheet) {
              closeBottomSheetOnly()
            } else if (selectedPlace) {
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
                    closeBottomSheetOnly()
                  } else {
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
                        resetMapForNewSearch()
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

            {/* MEJORA: Bottom Sheet con protección contra crashes */}
            {showBottomSheet && (
              <PanGestureHandler onGestureEvent={gestureHandler}>
                <Animated.View
                  style={[
                    styles.bottomSheet,
                    bottomSheetStyle,
                    {
                      height: bottomSheetHeight,
                    },
                  ]}
                >
                  <View style={styles.bottomSheetHandle} />
                  <View style={[styles.bottomSheetContent, { paddingTop: safeAreaTop + 20 }]}>
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
                          Desliza hacia arriba para expandir completamente o hacia abajo para cerrar.
                        </Text>

                        <View style={{ marginTop: 20 }}>
                          <Text style={styles.bottomSheetSectionTitle}>Información</Text>
                          <Text style={styles.bottomSheetText}>
                            asdasd
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </Animated.View>
              </PanGestureHandler>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {!isKeyboardVisible && <BottomNavBar />}
    </SafeAreaView>
  )
}
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
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
  StyleSheet,
  Alert,
  Animated as RNAnimated,
  Share,
  Image,
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
  getPhotoUrl,
} from "./mainBackend"
import { useFavorites } from "../../context/favoritesContext"
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
import ImageViewer from "../../components/imageViewer"
import { StatusBar } from 'expo-status-bar';


const { width, height } = Dimensions.get("window")

export default function MainScreen() {
  // Estado para el visor de imágenes
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [viewerPhotos, setViewerPhotos] = useState<
    Array<{
      photo_reference: string
      height: number
      width: number
    }>
  >([])

  // Resto del código existente...
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
  const isDraggingMapRef = useRef(false)


  // Estado para indicar que se están cargando detalles
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // Estado para las pestañas del bottom sheet
  const [activeTab, setActiveTab] = useState<"info" | "reviews">("info")

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
      setActiveTab("info") // Reset a la pestaña de información
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

  // Función para compartir
  const handleShare = async () => {
    if (!selectedPlace) return

    try {
      await Share.share({
        message: `¡Mira este lugar que encontré! ${selectedPlace.name} - Rating: ${selectedPlace.rating}⭐`,
        title: selectedPlace.name,
      })
    } catch (error) {
      console.error("Error al compartir:", error)
    }
  }

  // Función para abrir direcciones
  const handleDirections = () => {
    if (!selectedPlace) return
    // Aquí puedes implementar la navegación con Google Maps o Apple Maps
    Alert.alert("Direcciones", `Abriendo direcciones para ${selectedPlace.name}`)
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

  const [isLoadingLocation, setIsLoadingLocation] = useState(true)

  useEffect(() => {
    ;(async () => {
      setIsLoadingLocation(true)
      const coords = await getCurrentLocation()
      setLocation(coords)
      setIsLoadingLocation(false)
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
    setActiveTab("info")
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

  // Nueva función para obtener detalles completos de un lugar
  const fetchFullPlaceDetails = async (place: Place): Promise<Place> => {
    if (!place.place_id || (place.photos && place.photos.length >= 3)) {
      return place // Ya tiene detalles completos o no tiene place_id
    }

    try {
      setIsLoadingDetails(true)
      const fullDetails = await getPlaceDetails(place.place_id)
      setIsLoadingDetails(false)

      if (fullDetails) {
        return fullDetails
      }
    } catch (error) {
      console.error("Error fetching place details:", error)
      setIsLoadingDetails(false)
    }

    return place // Devuelve el lugar original si hay error
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

      // Obtener detalles completos del primer lugar
      const detailedPlace = await fetchFullPlaceDetails(sortedPlaces[0])
      setSelectedPlace(detailedPlace)

      // Actualizar la lista con el lugar detallado
      if (detailedPlace !== sortedPlaces[0]) {
        const updatedPlaces = [...sortedPlaces]
        updatedPlaces[0] = detailedPlace
        setNearbyPlacesList(updatedPlaces)
      }

      centerMapOnPlace(detailedPlace)

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

  // Función modificada para obtener detalles completos al seleccionar un lugar
  const handleSelectPlace = async (place: Place) => {
    markerPressRef.current = true
    closeBottomSheetOnly()

    // Obtener detalles completos del lugar
    const detailedPlace = await fetchFullPlaceDetails(place)

    if (places.length > 1) {
      const sortedPlaces = sortPlacesByDistance(places, location)
      const index = sortedPlaces.findIndex(
        (p: Place) =>
          p.geometry.location.lat === place.geometry.location.lat &&
          p.geometry.location.lng === place.geometry.location.lng,
      )

      if (index >= 0) {
        // Reemplazar el lugar en la lista con la versión detallada
        const updatedPlaces = [...sortedPlaces]
        updatedPlaces[index] = detailedPlace

        setNearbyPlacesList(updatedPlaces)
        setCurrentIndex(index)
        setSelectedPlace(detailedPlace)
        centerMapOnPlace(detailedPlace)
        setIsCardScrollable(true)
      }
    } else {
      setNearbyPlacesList([detailedPlace])
      setCurrentIndex(0)
      setSelectedPlace(detailedPlace)
      centerMapOnPlace(detailedPlace)
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

  // Obtener info completa al cambiar de lugar en el carrusel
  const handleScrollEnd = async (event: any) => {
    if (nearbyPlacesList.length <= 1 || !isCardScrollable) return

    const offsetX = event.nativeEvent.contentOffset.x
    const index = Math.round(offsetX / TOTAL_ITEM_WIDTH)

    if (index !== currentIndex && index >= 0 && index < nearbyPlacesList.length) {
      setCurrentIndex(index)
      const newPlace = nearbyPlacesList[index]

      // Obtener info completa del lugar seleccionado
      const detailedPlace = await fetchFullPlaceDetails(newPlace)

      // Si hay info nueva, actualizar la lista
      if (detailedPlace !== newPlace) {
        const updatedPlaces = [...nearbyPlacesList]
        updatedPlaces[index] = detailedPlace
        setNearbyPlacesList(updatedPlaces)
      }

      setSelectedPlace(detailedPlace)
      centerMapOnPlace(detailedPlace)
    }

    isScrollingRef.current = false
  }

  // Función modificada para manejar la apertura del visor de imágenes
  const handleOpenImageViewer = (index: number) => {
    if (selectedPlace?.photos && selectedPlace.photos.length > 0) {
      // Guardar las fotos en el estado para que el visor las use
      setViewerPhotos(selectedPlace.photos)
      setSelectedImageIndex(index)

      // Mostrar el visor de imágenes
      setShowImageViewer(true)
    }
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
                  {/* Sección de imágenes */}
                  <View style={styles.cardImageSection}>
                    {/* Imagen principal */}
                    <View style={styles.cardMainImageContainer}>
                      {item.photos && item.photos.length > 0 ? (
                        <Image
                          source={{ uri: getPhotoUrl(item.photos[0].photo_reference, 400) }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.cardImagePlaceholder}>Foto Principal</Text>
                      )}
                    </View>

                    {/* Imágenes laterales */}
                    <View style={styles.cardSideImagesContainer}>
                      {/* Imagen 2 */}
                      <View style={styles.cardSideImageContainer}>
                        {item.photos && item.photos.length > 1 ? (
                          <Image
                            source={{ uri: getPhotoUrl(item.photos[1].photo_reference, 200) }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={styles.cardImagePlaceholder}>Foto 2</Text>
                        )}
                      </View>

                      {/* Imagen 3 */}
                      <View style={styles.cardSideImageContainer}>
                        {item.photos && item.photos.length > 2 ? (
                          <Image
                            source={{ uri: getPhotoUrl(item.photos[2].photo_reference, 200) }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={styles.cardImagePlaceholder}>Foto 3</Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Sección de información */}
                  <View style={styles.cardInfoSection}>
                    {/* Izquierda: nombre y etiquetas */}
                    <View style={styles.cardLeftInfo}>
                      <Text style={styles.placeName}>{item.name}</Text>
                      <View style={styles.badges}>
                        <Text style={styles.badge}>Celiaco</Text>
                        <Text style={styles.badge}>Vegetariano</Text>
                        <Text style={styles.badge}>Vegano</Text>
                      </View>
                    </View>

                    {/* Derecha: calificación y distancia */}
                    <View style={styles.cardRightInfo}>
                      <Text style={styles.placeRating}>⭐ {item.rating}</Text>
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
                    </View>
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

  if (isLoadingLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff9500" />
        <Text style={{ marginTop: 10 }}>Cargando ubicación...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a1a1a" />
      <TouchableWithoutFeedback
        onPress={(event) => {
          // No cerrar si el usuario presiona en el carrusel
          const touchY = event.nativeEvent.pageY
          if (touchY > height * 0.6) return

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
          {location && (
            <MapView
              onPanDrag={() => {isDraggingMapRef.current = true}}
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={StyleSheet.absoluteFill}
              showsUserLocation={true}
              showsMyLocationButton={false}
              showsCompass={false}
              initialRegion={
                location
                  ? {
                      latitude: location.latitude,
                      longitude: location.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }
                  : undefined
              }
              mapPadding={{
                top: 0,
                right: 0,
                bottom: isKeyboardVisible ? 0 : height * 0.3, // Menos padding y dinámico
                left: 0,
              }} // Ajustado para dar más espacio a las tarjetas
              onPress={() => {
                if (isDraggingMapRef.current) {
                  isDraggingMapRef.current = false
                  return // 👈 No cerrar si se está arrastrando
                }

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
          )}

          {!isKeyboardVisible && !selectedPlace && (
            <View style={styles.floatingButtons}>
              <TouchableOpacity onPress={centerMapOnUser} style={styles.floatButton}>
                <Ionicons name="locate" size={24} color="#FF6B35" />
              </TouchableOpacity>
              <TouchableOpacity onPress={faceNorth} style={styles.floatButton}>
                <Ionicons name="compass" size={24} color="#FF6B35" />
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

            {!isKeyboardVisible && (
              <View style={styles.filters}>
                {["Localidad", "Limitación", "Precio", "Local"].map((filter) => (
                  <TouchableOpacity key={uuidv4()} style={styles.filterButton}>
                    <Text style={styles.filterText}>{filter}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {renderCarousel()}

          {/* Bottom Sheet nuevo */}
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
                <View style={[styles.bottomSheetContent, { paddingTop: 10 }]}>
                  {isLoadingDetails ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                      <ActivityIndicator size="large" color="#ff9500" />
                      <Text style={{ marginTop: 10 }}>Cargando detalles...</Text>
                    </View>
                  ) : selectedPlace ? (
                    <>
                      {/* Sección de imágenes */}
                      <View style={[styles.imageSection, { marginTop: 15 }]}>
                        {/* Imagen principal */}
                        <TouchableOpacity
                          style={styles.mainImageContainer}
                          onPress={() => handleOpenImageViewer(0)}
                          activeOpacity={0.8}
                        >
                          {selectedPlace.photos && selectedPlace.photos.length > 0 ? (
                            <Image
                              source={{ uri: getPhotoUrl(selectedPlace.photos[0].photo_reference, 800) }}
                              style={{ width: "100%", height: "100%", borderRadius: 12 }}
                              resizeMode="cover"
                            />
                          ) : (
                            <Text style={styles.imagePlaceholder}>Foto Principal</Text>
                          )}
                        </TouchableOpacity>

                        {/* Imágenes laterales */}
                        <View style={styles.sideImagesContainer}>
                          {/* Imagen 2 */}
                          <TouchableOpacity
                            style={styles.sideImageContainer}
                            onPress={() => {
                              if (selectedPlace.photos && selectedPlace.photos.length > 1) {
                                handleOpenImageViewer(1)
                              }
                            }}
                            activeOpacity={0.8}
                          >
                            {selectedPlace.photos && selectedPlace.photos.length > 1 ? (
                              <Image
                                source={{ uri: getPhotoUrl(selectedPlace.photos[1].photo_reference, 400) }}
                                style={{ width: "100%", height: "100%", borderRadius: 12 }}
                                resizeMode="cover"
                              />
                            ) : (
                              <Text style={styles.sideImagePlaceholder}>Foto 2</Text>
                            )}
                          </TouchableOpacity>

                          {/* "Ver todo" en la Foto 3 */}
                          <TouchableOpacity
                            style={styles.sideImageContainer}
                            onPress={() => {
                              if (selectedPlace.photos && selectedPlace.photos.length > 2) {
                                handleOpenImageViewer(2)
                              }
                            }}
                            activeOpacity={0.8}
                          >
                            {selectedPlace.photos && selectedPlace.photos.length > 2 ? (
                              <View style={{ width: "100%", height: "100%" }}>
                                <Image
                                  source={{ uri: getPhotoUrl(selectedPlace.photos[2].photo_reference, 400) }}
                                  style={{ width: "100%", height: "100%", borderRadius: 12 }}
                                  resizeMode="cover"
                                />
                                {selectedPlace.photos && selectedPlace.photos.length > 3 && (
                                  <View
                                    style={{
                                      position: "absolute",
                                      width: "100%",
                                      height: "100%",
                                      backgroundColor: "rgba(0,0,0,0.4)",
                                      justifyContent: "center",
                                      alignItems: "center",
                                      borderRadius: 12,
                                    }}
                                  >
                                    <Text style={{ color: "white", fontWeight: "bold" }}>Ver todo</Text>
                                  </View>
                                )}
                              </View>
                            ) : (
                              <Text style={styles.sideImagePlaceholder}>Foto 3</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Información del lugar */}
                      <View style={{ marginBottom: 15 }}>
                        <View
                          style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: width * 0.06, fontWeight: "bold" }}>{selectedPlace.name}</Text>
                          </View>
                          <View style={{ alignItems: "flex-end" }}>
                            <Text style={{ fontSize: width * 0.04, color: "#333", fontWeight: "600" }}>
                              ⭐ {selectedPlace.rating}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginTop: 10,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                              <Text
                                style={{
                                  backgroundColor: "#eee",
                                  paddingHorizontal: 10,
                                  paddingVertical: 6,
                                  borderRadius: 12,
                                  fontSize: width * 0.038,
                                }}
                              >
                                Celiaco
                              </Text>
                              <Text
                                style={{
                                  backgroundColor: "#eee",
                                  paddingHorizontal: 10,
                                  paddingVertical: 6,
                                  borderRadius: 12,
                                  fontSize: width * 0.038,
                                }}
                              >
                                Vegetariano
                              </Text>
                              <Text
                                style={{
                                  backgroundColor: "#eee",
                                  paddingHorizontal: 10,
                                  paddingVertical: 6,
                                  borderRadius: 12,
                                  fontSize: width * 0.038,
                                }}
                              >
                                Vegano
                              </Text>
                            </View>
                          </View>
                          <View style={{ alignItems: "flex-end" }}>
                            {location && (
                              <Text style={{ fontSize: width * 0.04, color: "#333" }}>
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
                          </View>
                        </View>
                      </View>

                      {/* Pestañas */}
                      <View style={[styles.tabContainer, { marginBottom: 10 }]}>
                        <TouchableOpacity
                          style={[styles.tab, activeTab === "info" && styles.activeTab]}
                          onPress={() => setActiveTab("info")}
                        >
                          <Text style={[styles.tabText, activeTab === "info" && styles.activeTabText]}>
                            Información
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.tab, activeTab === "reviews" && styles.activeTab]}
                          onPress={() => setActiveTab("reviews")}
                        >
                          <Text style={[styles.tabText, activeTab === "reviews" && styles.activeTabText]}>Reseñas</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Contenido de las pestañas */}
                      <View style={[styles.tabContent, { paddingTop: 5 }]}>
                        {activeTab === "info" ? (
                          <View style={[styles.infoTabContent, { justifyContent: "flex-start", paddingTop: 20 }]}>
                            {/* Botones de acción para la pestaña de información */}
                            <View style={[styles.infoActionButtons, { marginTop: 10 }]}>
                              <TouchableOpacity
                                style={styles.infoActionButton}
                                onPress={() => toggleFavorite(selectedPlace)}
                              >
                                <FontAwesome
                                  name={isFavorite(selectedPlace) ? "heart" : "heart-o"}
                                  size={20}
                                  color="#ff9500"
                                />
                              </TouchableOpacity>

                              <TouchableOpacity style={styles.infoActionButton} onPress={handleDirections}>
                                <Ionicons name="navigate" size={20} color="#ff9500" />
                              </TouchableOpacity>

                              <TouchableOpacity style={styles.infoActionButton} onPress={handleShare}>
                                <Ionicons name="share-social" size={20} color="#ff9500" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <View>
                            <Text style={styles.bottomSheetText}>Reseñas de {selectedPlace.name}.</Text>
                          </View>
                        )}
                      </View>
                    </>
                  ) : null}
                </View>
              </Animated.View>
            </PanGestureHandler>
          )}

          {/* Visor de imágenes*/}
          {showImageViewer && viewerPhotos.length > 0 && (
            <View style={StyleSheet.absoluteFillObject}>
              <ImageViewer
                photos={viewerPhotos}
                visible={showImageViewer}
                onClose={() => setShowImageViewer(false)}
                initialIndex={selectedImageIndex}
              />
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  )
}

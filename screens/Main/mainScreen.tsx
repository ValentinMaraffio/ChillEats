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
  searchFilteredRestaurants,
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
import { StatusBar } from "expo-status-bar"

const { width, height } = Dimensions.get("window")

// OPTIMIZACIÓN: Constantes para límites
const MAX_PLACES_LIMIT = 15 // Reducido de 20 a 15
const INFINITE_COPIES = 2 // Reducido de 3 a 2 copias para menos memoria

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

  // Estados para el carrusel infinito
  const [infiniteData, setInfiniteData] = useState<Place[]>([])
  const [realCurrentIndex, setRealCurrentIndex] = useState(0)
  const isInfiniteScrolling = useRef(false)

  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const bottomSheetHeight = height

  const needsRepositioning = useRef(false)
  const translateY = useSharedValue(height)

  // Snap points con límites más seguros
  const snapPoints = {
    expanded: 0,
    middle: height * 0.4,
    closed: height,
  }

  const ABSOLUTE_MIN = 0
  const ABSOLUTE_MAX = height + 100

  // Estados para filtros dietéticos
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [isFilterActive, setIsFilterActive] = useState(false)

  // OPTIMIZACIÓN: Función mejorada para crear datos infinitos con menos copias
  const createInfiniteData = useCallback((data: Place[]) => {
    if (data.length === 0) return []
    if (data.length === 1) return data // Si solo hay un elemento, no necesitamos duplicar

    // OPTIMIZACIÓN: Usar menos copias para reducir memoria
    const copies = INFINITE_COPIES
    const infiniteArray: Place[] = []

    // Agregar copias al inicio
    for (let i = 0; i < copies; i++) {
      infiniteArray.push(
        ...data.map((place) => ({ ...place, _infiniteId: `start-${i}-${place.place_id || Math.random()}` })),
      )
    }

    // Agregar datos originales
    infiniteArray.push(
      ...data.map((place) => ({ ...place, _infiniteId: `original-${place.place_id || Math.random()}` })),
    )

    // Agregar copias al final
    for (let i = 0; i < copies; i++) {
      infiniteArray.push(
        ...data.map((place) => ({ ...place, _infiniteId: `end-${i}-${place.place_id || Math.random()}` })),
      )
    }

    return infiniteArray
  }, [])

  // Función para obtener el índice real basado en el índice infinito
  const getRealIndex = useCallback((infiniteIndex: number, dataLength: number) => {
    if (dataLength === 0) return 0
    return infiniteIndex % dataLength
  }, [])

  // OPTIMIZACIÓN: Función mejorada para obtener el índice inicial
  const getInitialInfiniteIndex = useCallback((realIndex: number, dataLength: number) => {
    if (dataLength === 0) return 0
    if (dataLength === 1) return 0

    const copies = INFINITE_COPIES
    return copies * dataLength + realIndex
  }, [])

  // Función para obtener el snap point más cercano con validación
  const getClosestSnapPoint = (position: number) => {
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
      needsRepositioning.current = true
    } catch (error) {
      console.log("Error closing bottom sheet:", error)
    }
  }

  // Gesture handler con límites más estrictos y validaciones
  const gestureHandler = useAnimatedGestureHandler<any, { y: number }>({
    onStart: (_, context) => {
      context.y = translateY.value
    },
    onActive: (event, context) => {
      if (typeof context.y !== "number" || typeof event.translationY !== "number") {
        return
      }

      const newPosition = context.y + event.translationY
      let clampedPosition = clamp(newPosition, ABSOLUTE_MIN, ABSOLUTE_MAX)

      if (newPosition < snapPoints.expanded) {
        const overscroll = snapPoints.expanded - newPosition
        clampedPosition = snapPoints.expanded - Math.min(overscroll * 0.2, 30)
      } else if (newPosition > snapPoints.closed) {
        const overscroll = newPosition - snapPoints.closed
        clampedPosition = snapPoints.closed + Math.min(overscroll * 0.2, 50)
      }

      if (typeof clampedPosition === "number" && !isNaN(clampedPosition)) {
        translateY.value = clampedPosition
      }
    },
    onEnd: (event) => {
      try {
        const velocity = typeof event.velocityY === "number" ? event.velocityY : 0
        const currentPos = typeof translateY.value === "number" ? translateY.value : snapPoints.middle
        const clampedVelocity = clamp(velocity, -5000, 5000)

        let targetPosition: number

        if (Math.abs(clampedVelocity) > 1200) {
          if (clampedVelocity > 0) {
            if (currentPos < snapPoints.middle) {
              targetPosition = snapPoints.middle
            } else {
              targetPosition = snapPoints.closed
            }
          } else {
            if (currentPos > snapPoints.middle) {
              targetPosition = snapPoints.middle
            } else {
              targetPosition = snapPoints.expanded
            }
          }
        } else {
          targetPosition = getClosestSnapPoint(currentPos)
        }

        if (typeof targetPosition !== "number" || isNaN(targetPosition)) {
          targetPosition = snapPoints.middle
        }

        if (targetPosition === snapPoints.closed) {
          translateY.value = withTiming(
            targetPosition,
            {
              duration: 300,
            },
            (finished) => {
              if (finished) {
                runOnJS(closeBottomSheetJS)()
              }
            },
          )
        } else {
          translateY.value = withSpring(targetPosition, {
            damping: 25,
            stiffness: 250,
            mass: 1,
          })
        }
      } catch (error) {
        translateY.value = withTiming(snapPoints.middle, { duration: 300 })
      }
    },
  })

  // Estilo animado con validaciones
  const bottomSheetStyle = useAnimatedStyle(() => {
    const translateValue =
      typeof translateY.value === "number" && !isNaN(translateY.value)
        ? clamp(translateY.value, ABSOLUTE_MIN, ABSOLUTE_MAX)
        : snapPoints.closed

    return {
      transform: [{ translateY: translateValue }],
    }
  })

  // Funciones de control más seguras
  const showAndExpandBottomSheet = () => {
    try {
      setShowBottomSheet(true)
      setActiveTab("info")
      translateY.value = snapPoints.closed

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
    Alert.alert("Direcciones", `Abriendo direcciones para ${selectedPlace.name}`)
  }

  // Función unificada para centrar el carrusel con mejor control
  const scrollToIndex = useCallback(
    (index: number, animated = false) => {
      if (!flatListRef.current || infiniteData.length === 0 || isInfiniteScrolling.current) return

      const offsetX = index * TOTAL_ITEM_WIDTH

      flatListRef.current.scrollToOffset({
        offset: offsetX,
        animated,
      })
    },
    [infiniteData, TOTAL_ITEM_WIDTH],
  )

  // Effect para reposicionar el carrusel cuando se cierra el bottom sheet
  useEffect(() => {
    if (!showBottomSheet && needsRepositioning.current && infiniteData.length > 0) {
      const timer = setTimeout(() => {
        scrollToIndex(currentIndex, false)
        needsRepositioning.current = false
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [showBottomSheet, currentIndex, infiniteData, scrollToIndex])

  // Actualizar datos infinitos cuando cambia nearbyPlacesList
  useEffect(() => {
    const newInfiniteData = createInfiniteData(nearbyPlacesList)
    setInfiniteData(newInfiniteData)

    if (nearbyPlacesList.length > 0) {
      const initialInfiniteIndex = getInitialInfiniteIndex(realCurrentIndex, nearbyPlacesList.length)
      setCurrentIndex(initialInfiniteIndex)

      // Solo hacer scroll inicial si no hay bottom sheet y es la primera vez
      if (!showBottomSheet && realCurrentIndex === 0) {
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToOffset({
              offset: initialInfiniteIndex * TOTAL_ITEM_WIDTH,
              animated: false,
            })
          }
        }, 100)
      }
    }
  }, [
    nearbyPlacesList,
    createInfiniteData,
    getInitialInfiniteIndex,
    realCurrentIndex,
    showBottomSheet,
    TOTAL_ITEM_WIDTH,
  ])

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
    setInfiniteData([])
    setCurrentIndex(0)
    setRealCurrentIndex(0)
  }

  // Función de reset más específica que no afecta el carrusel innecesariamente
  const resetMapForNewSearch = () => {
    setPlaces([])
    setSelectedPlace(null)
    setNearbyPlacesList([])
    setInfiniteData([])
    setPredictions([])
    setShowBottomSheet(false)
    setCurrentIndex(0)
    setRealCurrentIndex(0)
    setIsCardScrollable(true)
    setActiveTab("info")
    setSelectedFilters([]) // Reset filters
    setIsFilterActive(false) // Reset filter state
    needsRepositioning.current = false

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

  // Función para cerrar solo el bottom sheet sin afectar el carrusel
  const closeBottomSheetOnly = () => {
    if (showBottomSheet) {
      closeBottomSheet()
    }
  }

  // Nueva función para obtener detalles completos de un lugar
  const fetchFullPlaceDetails = async (place: Place): Promise<Place> => {
    if (!place.place_id || (place.photos && place.photos.length >= 3)) {
      return place
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

    return place
  }

  // OPTIMIZACIÓN: Función de búsqueda mejorada con límite de 15
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

    // OPTIMIZACIÓN: Limitar a 15 lugares máximo
    const limitedPlaces = sortedPlaces.slice(0, MAX_PLACES_LIMIT)
    setNearbyPlacesList(limitedPlaces)
    setIsCardScrollable(true)

    if (limitedPlaces.length > 0) {
      setRealCurrentIndex(0)

      // Obtener detalles completos del primer lugar
      const detailedPlace = await fetchFullPlaceDetails(limitedPlaces[0])
      setSelectedPlace(detailedPlace)

      // Actualizar la lista con el lugar detallado
      if (detailedPlace !== limitedPlaces[0]) {
        const updatedPlaces = [...limitedPlaces]
        updatedPlaces[0] = detailedPlace
        setNearbyPlacesList(updatedPlaces)
      }

      centerMapOnPlace(detailedPlace)
    }
  }

  // Nueva función para manejar búsquedas por filtros dietéticos
  const handleDietaryFilterSearch = async (filterType: string) => {
    if (!location) return

    closeBottomSheetOnly()

    // Toggle filter selection
    let newFilters: string[]
    if (selectedFilters.includes(filterType)) {
      newFilters = selectedFilters.filter((f) => f !== filterType)
    } else {
      newFilters = [...selectedFilters, filterType]
    }

    setSelectedFilters(newFilters)

    if (newFilters.length === 0) {
      // Si no hay filtros, resetear
      resetMapForNewSearch()
      setIsFilterActive(false)
      return
    }

    setIsFilterActive(true)

    // Buscar con los filtros seleccionados
    const results = await searchFilteredRestaurants(newFilters, location.latitude, location.longitude)

    setPlaces(results)
    const sortedPlaces = sortPlacesByDistance(results, location)

    // Limitar a 15 lugares máximo
    const limitedPlaces = sortedPlaces.slice(0, MAX_PLACES_LIMIT)
    setNearbyPlacesList(limitedPlaces)
    setIsCardScrollable(true)

    if (limitedPlaces.length > 0) {
      setRealCurrentIndex(0)

      // Obtener detalles completos del primer lugar
      const detailedPlace = await fetchFullPlaceDetails(limitedPlaces[0])
      setSelectedPlace(detailedPlace)

      // Actualizar la lista con el lugar detallado
      if (detailedPlace !== limitedPlaces[0]) {
        const updatedPlaces = [...limitedPlaces]
        updatedPlaces[0] = detailedPlace
        setNearbyPlacesList(updatedPlaces)
      }

      centerMapOnPlace(detailedPlace)
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
      // OPTIMIZACIÓN: Aplicar límite también aquí
      const limitedPlaces = sortedPlaces.slice(0, MAX_PLACES_LIMIT)

      const index = limitedPlaces.findIndex(
        (p: Place) =>
          p.geometry.location.lat === place.geometry.location.lat &&
          p.geometry.location.lng === place.geometry.location.lng,
      )

      if (index >= 0) {
        // Reemplazar el lugar en la lista con la versión detallada
        const updatedPlaces = [...limitedPlaces]
        updatedPlaces[index] = detailedPlace

        setNearbyPlacesList(updatedPlaces)
        setRealCurrentIndex(index)
        setSelectedPlace(detailedPlace)
        centerMapOnPlace(detailedPlace)
        setIsCardScrollable(true)
      }
    } else {
      setNearbyPlacesList([detailedPlace])
      setRealCurrentIndex(0)
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
      setRealCurrentIndex(0)
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

  // OPTIMIZACIÓN: Función de scroll mejorada con menos cálculos
  const handleScrollEnd = async (event: any) => {
    if (nearbyPlacesList.length <= 1 || !isCardScrollable || isInfiniteScrolling.current) {
      isScrollingRef.current = false
      return
    }

    const offsetX = event.nativeEvent.contentOffset.x
    const newInfiniteIndex = Math.round(offsetX / TOTAL_ITEM_WIDTH)
    const newRealIndex = getRealIndex(newInfiniteIndex, nearbyPlacesList.length)

    // Solo actualizar el estado si realmente cambió
    if (newRealIndex !== realCurrentIndex) {
      setRealCurrentIndex(newRealIndex)
      setCurrentIndex(newInfiniteIndex)

      const newPlace = nearbyPlacesList[newRealIndex]
      if (newPlace) {
        // Obtener detalles completos del lugar seleccionado
        const detailedPlace = await fetchFullPlaceDetails(newPlace)

        // Si hay info nueva, actualizar la lista
        if (detailedPlace !== newPlace) {
          const updatedPlaces = [...nearbyPlacesList]
          updatedPlaces[newRealIndex] = detailedPlace
          setNearbyPlacesList(updatedPlaces)
        }

        setSelectedPlace(detailedPlace)
        centerMapOnPlace(detailedPlace)
      }
    }

    // OPTIMIZACIÓN: Reposicionar con menos copias
    const dataLength = nearbyPlacesList.length
    const totalLength = infiniteData.length

    if (newInfiniteIndex <= dataLength || newInfiniteIndex >= totalLength - dataLength) {
      isInfiniteScrolling.current = true
      const newPosition = getInitialInfiniteIndex(newRealIndex, dataLength)

      // Reposicionar sin animación para mantener el efecto infinito
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToOffset({
            offset: newPosition * TOTAL_ITEM_WIDTH,
            animated: false,
          })
          setCurrentIndex(newPosition)
        }
        isInfiniteScrolling.current = false
      }, 50)
    }

    isScrollingRef.current = false
  }

  // Función modificada para manejar la apertura del visor de imágenes
  const handleOpenImageViewer = (index: number) => {
    if (selectedPlace?.photos && selectedPlace.photos.length > 0) {
      setViewerPhotos(selectedPlace.photos)
      setSelectedImageIndex(index)
      setShowImageViewer(true)
    }
  }

  // OPTIMIZACIÓN: Renderizar el carrusel con configuraciones mejoradas
  const renderCarousel = () => {
    if (!selectedPlace || isKeyboardVisible || showBottomSheet || infiniteData.length === 0) {
      return null
    }

    return (
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          horizontal
          data={infiniteData}
          keyExtractor={(item, index) => `carousel-${index}-${item._infiniteId || item.place_id || Math.random()}`}
          getItemLayout={(data, index) => ({
            length: TOTAL_ITEM_WIDTH,
            offset: TOTAL_ITEM_WIDTH * index,
            index,
          })}
          renderItem={({ item, index }) => {
            const realIndex = getRealIndex(index, nearbyPlacesList.length)
            const isSelected = realIndex === realCurrentIndex

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
                    if (realIndex !== realCurrentIndex && isCardScrollable) {
                      // NO hacer scroll automático, solo actualizar el estado
                      setRealCurrentIndex(realIndex)
                      setCurrentIndex(index)
                      setSelectedPlace(nearbyPlacesList[realIndex])
                      centerMapOnPlace(nearbyPlacesList[realIndex])
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
          // OPTIMIZACIÓN: snapToOffsets calculado más eficientemente
          snapToOffsets={infiniteData.map((_, index) => index * TOTAL_ITEM_WIDTH)}
          contentContainerStyle={{
            paddingLeft: SIDE_SPACING,
            paddingRight: SIDE_SPACING,
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
          // OPTIMIZACIÓN: Configuraciones mejoradas para 15 elementos
          initialScrollIndex={currentIndex}
          removeClippedSubviews={true} // Activado para mejor rendimiento con menos elementos
          windowSize={8} // Reducido para 15 elementos
          maxToRenderPerBatch={4} // Reducido
          updateCellsBatchingPeriod={100} // Aumentado para menos actualizaciones
          pagingEnabled={false}
          bounces={false}
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
              onPanDrag={() => {
                isDraggingMapRef.current = true
              }}
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
                bottom: isKeyboardVisible ? 0 : height * 0.3,
                left: 0,
              }}
              onPress={() => {
                if (isDraggingMapRef.current) {
                  isDraggingMapRef.current = false
                  return
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
              {/* OPTIMIZACIÓN: Solo mostrar los primeros 15 marcadores */}
              {places.slice(0, MAX_PLACES_LIMIT).map((place) => (
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
                <TouchableOpacity
                  style={[styles.filterButton, selectedFilters.includes("sin tacc") && styles.activeFilterButton]}
                  onPress={() => handleDietaryFilterSearch("sin tacc")}
                >
                  <Text style={[styles.filterText, selectedFilters.includes("sin tacc") && styles.activeFilterText]}>
                    Sin TACC
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterButton, selectedFilters.includes("vegano") && styles.activeFilterButton]}
                  onPress={() => handleDietaryFilterSearch("vegano")}
                >
                  <Text style={[styles.filterText, selectedFilters.includes("vegano") && styles.activeFilterText]}>
                    Vegano
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterButton, selectedFilters.includes("vegetariano") && styles.activeFilterButton]}
                  onPress={() => handleDietaryFilterSearch("vegetariano")}
                >
                  <Text style={[styles.filterText, selectedFilters.includes("vegetariano") && styles.activeFilterText]}>
                    Vegetariano
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterButton, selectedFilters.includes("kosher") && styles.activeFilterButton]}
                  onPress={() => handleDietaryFilterSearch("kosher")}
                >
                  <Text style={[styles.filterText, selectedFilters.includes("kosher") && styles.activeFilterText]}>
                    Kosher
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {isFilterActive && selectedFilters.length > 0 && (
            <View>
            
                
                <View style={styles.activeFiltersList}>
                  {selectedFilters.map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      
                      onPress={() => handleDietaryFilterSearch(filter)}
                    >
                      
                      <Text style={styles.activeFilterChipRemove}>×</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={() => {
                    setSelectedFilters([])
                    setIsFilterActive(false)
                    resetMapForNewSearch()
                  }}
                >
                
                </TouchableOpacity>
              
            </View>
          )}

          {renderCarousel()}

          {/* Bottom Sheet */}
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

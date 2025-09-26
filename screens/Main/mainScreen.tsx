"use client"

import "react-native-get-random-values"
import { useEffect, useRef, useState, useCallback } from "react"
import {
  View,
  Text,
  SafeAreaView,
  Dimensions,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  Linking,
} from "react-native"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import { Ionicons, FontAwesome } from "@expo/vector-icons"
import type * as Location from "expo-location"
import { v4 as uuidv4 } from "uuid"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  clamp,
  useAnimatedGestureHandler,
} from "react-native-reanimated"
import { PanGestureHandler } from "react-native-gesture-handler"
import { StatusBar } from "expo-status-bar"
import { useFocusEffect, useRoute } from "@react-navigation/native"
import { useFavorites } from "../../context/favoritesContext"
import { useAuth } from "../../context/authContext"
import { useKeyboardVisibility } from "../../hooks/useKeyboardVisibility"
import { useFilters } from "../../context/filtersContext"
import { useNavigation } from "@react-navigation/native"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import type { TabParamList } from "../../types/navigation"

// backend existente
import {
  getCurrentLocation,
  searchPlaces,
  searchFilteredRestaurants,
  getPlaceAutocomplete,
  getPlaceDetails,
  sortPlacesByDistance,
  calculateDistance,
  getPhotoUrl,
  getDietaryDisplayLabel,
  type Place,
} from "./mainBackend"

// estilos ORIGINALES para bottom sheet + carousel
import { styles as baseStyles } from "./mainStyles"

const { width, height } = Dimensions.get("window")
const MAX_PLACES_LIMIT = 15
const INFINITE_COPIES = 2

function CustomPin({ highlighted = false }: { highlighted?: boolean }) {
  const size = highlighted ? 34 : 28
  const tip = Math.round(size * 0.36)
  const circle = size

  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={{
          width: circle,
          height: circle,
          borderRadius: circle / 2,
          backgroundColor: "#FF9500", // naranja
          borderWidth: 2,
          borderColor: "#000", // borde negro
        }}
      />
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: tip / 2,
          borderRightWidth: tip / 2,
          borderTopWidth: tip,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: "#FF9500", // punta naranja
          transform: [{ translateY: -1 }],
        }}
      />
    </View>
  )
}

export default function MainScreenV2() {
  const singlePlaceLock = useRef(false)
  const route = useRoute() as any
  const nav = useNavigation<BottomTabNavigationProp<TabParamList>>()
  const goToMap = useCallback(() => {
    nav.navigate("Map")
  }, [nav])

  const { user } = useAuth()
  const { addFavorite, removeFavorite, isFavorite } = useFavorites()

  //Estilo mapa
  const ONLY_BUSINESS_STYLE = [
    { featureType: "poi.attraction", stylers: [{ visibility: "off" }] },
    { featureType: "poi.government", stylers: [{ visibility: "off" }] },
    { featureType: "poi.medical", stylers: [{ visibility: "off" }] },
    { featureType: "poi.park", stylers: [{ visibility: "off" }] },
    { featureType: "poi.place_of_worship", stylers: [{ visibility: "off" }] },
    { featureType: "poi.school", stylers: [{ visibility: "off" }] },
    { featureType: "poi.sports_complex", stylers: [{ visibility: "off" }] },
    { featureType: "poi.business", stylers: [{ visibility: "on" }] }, // 👈 dejamos solo negocios
  ]

  // ubicación
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)

  // modos
  const [mode, setMode] = useState<"feed" | "map">("feed")

  // forzar modo según la tab activa
  useFocusEffect(
    useCallback(() => {
      const name = route?.name as string
      setMode(name === "Map" ? "map" : "feed")
    }, [route?.name]),
  )

  // buscador / predicciones
  const [searchText, setSearchText] = useState("")
  const [predictions, setPredictions] = useState<any[]>([])

  // filtros
  const { selectedFilters, setSelectedFilters, toggleFilter, DEFAULT_FILTER_KEY } = useFilters()
  const onToggleFilter = (key: string) => {
    if (key === DEFAULT_FILTER_KEY) {
      setSelectedFilters([])
      return
    }

    // Toggle the filter - if it's selected, remove it; if not, add it
    setSelectedFilters((prev) => {
      const newFilters = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      return newFilters
    })
  }

  // data
  const [isFetching, setIsFetching] = useState(false)
  const [places, setPlaces] = useState<Place[]>([])
  const [recommended, setRecommended] = useState<Place[]>([])

  // mapa + carousel ORIGINALES
  const [nearbyPlacesList, setNearbyPlacesList] = useState<Place[]>([])
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [infiniteData, setInfiniteData] = useState<Place[]>([])
  const [realCurrentIndex, setRealCurrentIndex] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const isInfiniteScrolling = useRef(false)
  const [isCardScrollable, setIsCardScrollable] = useState(true)
  const flatListRef = useRef<FlatList<any>>(null)
  const ITEM_WIDTH = width * 0.75
  const SPACING = 20
  const TOTAL_ITEM_WIDTH = ITEM_WIDTH + SPACING
  const SIDE_SPACING = (width - ITEM_WIDTH) / 2
  const isKeyboardVisible = useKeyboardVisibility()

  // bottom sheet ORIG
  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const translateY = useSharedValue(height)
  const snapPoints = { expanded: 0, middle: height * 0.4, closed: height }
  const ABSOLUTE_MIN = 0
  const ABSOLUTE_MAX = height + 100
  const needsRepositioning = useRef(false)
  const [activeTab, setActiveTab] = useState<"info" | "reviews">("info")

  // visor de imágenes
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [viewerPhotos, setViewerPhotos] = useState<Array<{ photo_reference: string; height: number; width: number }>>(
    [],
  )

  const mapRef = useRef<MapView>(null)

  const flyTo = useCallback((lat: number, lng: number, fast = false) => {
    mapRef.current?.animateToRegion(
      {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      fast ? 250 : 600,
    )
  }, [])

  const focusFirst = useCallback(() => {
    const first = nearbyPlacesList[0]
    if (!first?.geometry?.location) return
    flyTo(first.geometry.location.lat, first.geometry.location.lng)
  }, [nearbyPlacesList, flyTo])

  useEffect(() => {
    // Cada vez que entro al mapa o cambian filtros,
    // aseguro que el mapa vea la colección correcta sin refrescar a mano.
    if (mode !== "map") return
    if (singlePlaceLock.current) return

    // Prioridad: resultados de búsqueda -> recomendados (que ya respetan selectedFilters)
    const collection = places.length > 0 ? places : recommended.length > 0 ? recommended : []

    if (collection.length > 0) {
      setNearbyPlacesList(collection.slice(0, MAX_PLACES_LIMIT))
      setSelectedPlace(collection[0])
      setIsCardScrollable(collection.length > 1)
      setRealCurrentIndex(0)
      // centrar cámara en la primera card
      setTimeout(() => {
        if (collection[0]?.geometry?.location) {
          flyTo(collection[0].geometry.location.lat, collection[0].geometry.location.lng, true)
        }
      }, 0)
    }
  }, [mode, selectedFilters, places, recommended])

  // =========================
  // Ubicación inicial
  // =========================
  useEffect(() => {
    ;(async () => {
      setIsLoadingLocation(true)
      const coords = await getCurrentLocation()
      setLocation(coords)
      setIsLoadingLocation(false)
    })()
  }, [])

  // =========================
  // Recomendados + filtros
  // =========================
  const fetchRecommended = useCallback(async () => {
    if (!location) return
    try {
      setIsFetching(true)

      let results: Place[] = []

      if (selectedFilters.length > 0) {
        // When filters are selected, only get filtered results
        console.log("[v0] Fetching filtered restaurants for filters:", selectedFilters)
        results = await searchFilteredRestaurants(selectedFilters, location.latitude, location.longitude)
      } else {
        // When no filters (Recomendados), get regular restaurants
        console.log("[v0] Fetching regular restaurants (Recomendados mode)")
        results = await searchPlaces("restaurant", location)
      }

      const ordered = sortPlacesByDistance(results, location)
      const shuffled = [...ordered].sort(() => Math.random() - 0.5)
      const take = shuffled.slice(0, 12)

      if (take[0]?.place_id) {
        const originalCategories = take[0].dietaryCategories
        const det = await getPlaceDetails(take[0].place_id)
        if (det) {
          take[0] = {
            ...det,
            dietaryCategories: originalCategories || det.dietaryCategories || [],
          }
        }
      }

      console.log(
        "[v0] Final results with dietary categories:",
        take.map((p) => ({ name: p.name, categories: p.dietaryCategories })),
      )

      setRecommended(take)
      // preparar mapa/carrusel
      setNearbyPlacesList(take.slice(0, MAX_PLACES_LIMIT))
      setSelectedPlace(take[0] || null)
      setRealCurrentIndex(0)
    } catch (error) {
      console.error("[v0] Error in fetchRecommended:", error)
    } finally {
      setIsFetching(false)
    }
  }, [location, selectedFilters])

  useEffect(() => {
    if (location) fetchRecommended()
  }, [location, selectedFilters])

  // =========================
  // Buscador + Autocompletado
  // =========================
  const onSearchSubmit = useCallback(async () => {
    if (!location) return
    if (!searchText.trim()) {
      setPlaces([])
      fetchRecommended()
      return
    }
    setIsFetching(true)
    const res = await searchPlaces(searchText, location)
    const ordered = sortPlacesByDistance(res, location).slice(0, 20)
    setPlaces(ordered)
    // general → mapa + carrusel
    setNearbyPlacesList(ordered.slice(0, MAX_PLACES_LIMIT))
    setSelectedPlace(ordered[0] || null)
    setRealCurrentIndex(0)
    setIsCardScrollable(ordered.length > 1)
    goToMap()
    setIsFetching(false)
  }, [location, searchText])

  const onChangeText = async (t: string) => {
    setSearchText(t)
    if (!t.trim()) {
      setPredictions([])
      return
    }
    if (location) {
      const preds = await getPlaceAutocomplete(t, location)
      setPredictions(preds)
    }
  }

  const onSelectPrediction = async (p: any) => {
    setSearchText(p.description)
    setPredictions([])
    if (!location) return
    const det = await getPlaceDetails(p.place_id)
    if (det) {
      singlePlaceLock.current = true
      setSearchText(det.name || p.description)
      setPredictions([])
      setPlaces([det])
      setNearbyPlacesList([det])
      setSelectedPlace(det)
      setRealCurrentIndex(0)
      setIsCardScrollable(false)
      goToMap()
      flyTo(det.geometry.location.lat, det.geometry.location.lng)
      setShowBottomSheet(false)
    }
  }

  // FILTROS
  const availableFilters = [
    { key: DEFAULT_FILTER_KEY, label: "Recomendados" },
    { key: "sin tacc", label: "Sin TACC" },
    { key: "vegano", label: "Vegano" },
    { key: "vegetariano", label: "Vegetariano" },
    { key: "kosher", label: "Kosher" },
    { key: "halal", label: "Halal" },
    { key: "keto", label: "Keto" },
    { key: "paleo", label: "Paleo" },
  ]

  const isActive = useCallback(
    (key: string) => {
      if (selectedFilters.length === 0) {
        return key === DEFAULT_FILTER_KEY
      }
      return selectedFilters.includes(key)
    },
    [selectedFilters, DEFAULT_FILTER_KEY],
  )

  // =========================
  // Helpers bottom sheet + carrusel (ORIG)
  // =========================
  const createInfiniteData = useCallback((data: Place[]) => {
    if (data.length <= 1) return data
    const copies = INFINITE_COPIES
    const inf: Place[] = []
    for (let i = 0; i < copies; i++)
      inf.push(...data.map((p) => ({ ...p, _infiniteId: `start-${i}-${p.place_id || Math.random()}` })))
    inf.push(...data.map((p) => ({ ...p, _infiniteId: `original-${p.place_id || Math.random()}` })))
    for (let i = 0; i < copies; i++)
      inf.push(...data.map((p) => ({ ...p, _infiniteId: `end-${i}-${p.place_id || Math.random()}` })))
    return inf
  }, [])

  const getRealIndex = useCallback((infiniteIndex: number, len: number) => (len === 0 ? 0 : infiniteIndex % len), [])

  const getInitialInfiniteIndex = useCallback(
    (realIndex: number, len: number) => (len <= 1 ? 0 : INFINITE_COPIES * len + realIndex),
    [],
  )

  const closeBottomSheetJS = () => {
    setShowBottomSheet(false)
    needsRepositioning.current = true
  }

  const gestureHandler = useAnimatedGestureHandler<any, { y: number }>({
    onStart: (_, ctx) => {
      ctx.y = translateY.value
    },
    onActive: (e, ctx) => {
      const newPos = (ctx.y as number) + e.translationY
      let clamped = clamp(newPos, ABSOLUTE_MIN, ABSOLUTE_MAX)
      if (newPos < snapPoints.expanded)
        clamped = snapPoints.expanded - Math.min((snapPoints.expanded - newPos) * 0.2, 30)
      if (newPos > snapPoints.closed) clamped = snapPoints.closed + Math.min((newPos - snapPoints.closed) * 0.2, 50)
      translateY.value = clamped
    },
    onEnd: (e) => {
      const v = clamp(e.velocityY ?? 0, -5000, 5000)
      const current = typeof translateY.value === "number" ? translateY.value : snapPoints.middle
      let target: number
      if (Math.abs(v) > 1200)
        target =
          v > 0
            ? current < snapPoints.middle
              ? snapPoints.middle
              : snapPoints.closed
            : current > snapPoints.middle
              ? snapPoints.middle
              : snapPoints.expanded
      else {
        const dExp = Math.abs(current - snapPoints.expanded)
        const dMid = Math.abs(current - snapPoints.middle)
        const dCls = Math.abs(current - snapPoints.closed)
        target = dExp < dMid && dExp < dCls ? snapPoints.expanded : dMid < dCls ? snapPoints.middle : snapPoints.closed
      }
      if (target === snapPoints.closed)
        translateY.value = withTiming(target, { duration: 300 }, (f) => {
          if (f) runOnJS(closeBottomSheetJS)()
        })
      else translateY.value = withSpring(target, { damping: 25, stiffness: 250 })
    },
  })

  const bottomSheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: clamp(
          typeof translateY.value === "number" ? translateY.value : snapPoints.closed,
          ABSOLUTE_MIN,
          ABSOLUTE_MAX,
        ),
      },
    ],
  }))

  const showAndExpandBottomSheet = () => {
    setShowBottomSheet(true)
    setActiveTab("info")
    translateY.value = snapPoints.closed
    setTimeout(() => {
      translateY.value = withSpring(snapPoints.middle, { damping: 25, stiffness: 250 })
    }, 50)
  }

  const closeBottomSheet = () =>
    (translateY.value = withTiming(snapPoints.closed, { duration: 300 }, (f) => {
      if (f) runOnJS(closeBottomSheetJS)()
    }))

  const handleShare = () => {
    if (selectedPlace) Alert.alert("Compartir", selectedPlace.name)
  }
  const handleDirections = () => {
    if (selectedPlace) Alert.alert("Direcciones", `Abriendo ${selectedPlace.name}`)
  }

  const handleWebsite = () => {
    if (selectedPlace?.website) {
      Linking.openURL(selectedPlace.website).catch((err) => Alert.alert("Error", "No se pudo abrir el sitio web"))
    }
  }

  const scrollToIndex = useCallback(
    (index: number, animated = false) => {
      if (!flatListRef.current || infiniteData.length === 0 || isInfiniteScrolling.current) return
      flatListRef.current.scrollToOffset({ offset: index * TOTAL_ITEM_WIDTH, animated })
    },
    [infiniteData],
  )

  useEffect(() => {
    const inf = createInfiniteData(nearbyPlacesList)
    setInfiniteData(inf)
    if (nearbyPlacesList.length > 0) {
      const initial = getInitialInfiniteIndex(realCurrentIndex, nearbyPlacesList.length)
      setCurrentIndex(initial)
      setTimeout(
        () => flatListRef.current?.scrollToOffset({ offset: initial * TOTAL_ITEM_WIDTH, animated: false }),
        100,
      )
    }
  }, [nearbyPlacesList])

  useEffect(() => {
    if (!showBottomSheet && needsRepositioning.current && infiniteData.length > 0) {
      const t = setTimeout(() => {
        scrollToIndex(currentIndex, false)
        needsRepositioning.current = false
      }, 100)
      return () => clearTimeout(t)
    }
  }, [showBottomSheet, currentIndex, infiniteData])

  const handleOpenImageViewer = (idx: number) => {
    if (selectedPlace?.photos?.length) {
      setViewerPhotos(selectedPlace.photos)
      setSelectedImageIndex(idx)
      setShowImageViewer(true)
    }
  }

  const toggleFavorite = (place: Place) => {
    isFavorite(place) ? removeFavorite(place) : addFavorite(place)
  }

  const handleScrollBegin = () => {
    if (!isCardScrollable) return
  }
  const handleScrollEnd = async (e: any) => {
    if (nearbyPlacesList.length <= 1 || !isCardScrollable || isInfiniteScrolling.current) return
    const offsetX = e.nativeEvent.contentOffset.x
    const newInfiniteIndex = Math.round(offsetX / TOTAL_ITEM_WIDTH)
    const newRealIndex = getRealIndex(newInfiniteIndex, nearbyPlacesList.length)
    if (newRealIndex !== realCurrentIndex) {
      setRealCurrentIndex(newRealIndex)
      setCurrentIndex(newInfiniteIndex)
      const newPlace = nearbyPlacesList[newRealIndex]
      if (newPlace) {
        const existingCategories = newPlace.dietaryCategories || []
        const detailedPlace = (await getPlaceDetails(newPlace.place_id)) || newPlace

        // Preserve the dietary categories from the original place
        if (existingCategories.length > 0) {
          detailedPlace.dietaryCategories = existingCategories
        }

        const updated = [...nearbyPlacesList]
        updated[newRealIndex] = detailedPlace
        setNearbyPlacesList(updated)
        setSelectedPlace(detailedPlace)
        flyTo(detailedPlace.geometry.location.lat, detailedPlace.geometry.location.lng)
      }
    }
    const len = nearbyPlacesList.length
    const total = infiniteData.length
    if (newInfiniteIndex <= len || newInfiniteIndex >= total - len) {
      isInfiniteScrolling.current = true
      const newPos = getInitialInfiniteIndex(newRealIndex, len)
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: newPos * TOTAL_ITEM_WIDTH, animated: false })
        setCurrentIndex(newPos)
        isInfiniteScrolling.current = false
      }, 50)
    }
  }

  const renderCarousel = () => {
    if (!selectedPlace || isKeyboardVisible || showBottomSheet || infiniteData.length === 0) return null
    return (
      <View style={baseStyles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          horizontal
          data={infiniteData}
          keyExtractor={(item, index) =>
            `carousel-${index}-${(item as any)._infiniteId || item.place_id || Math.random()}`
          }
          getItemLayout={(data, index) => ({ length: TOTAL_ITEM_WIDTH, offset: TOTAL_ITEM_WIDTH * index, index })}
          renderItem={({ item, index }) => {
            const realIdx = getRealIndex(index, nearbyPlacesList.length)
            const isSelected = realIdx === realCurrentIndex
            return (
              <View style={{ width: TOTAL_ITEM_WIDTH, justifyContent: "center", alignItems: "center" }}>
                <TouchableOpacity
                  onPress={() => {
                    if (realIdx !== realCurrentIndex && isCardScrollable) {
                      setRealCurrentIndex(realIdx)
                      setCurrentIndex(index)
                      setSelectedPlace(nearbyPlacesList[realIdx])
                      mapRef.current?.animateToRegion({
                        latitude: nearbyPlacesList[realIdx].geometry.location.lat,
                        longitude: nearbyPlacesList[realIdx].geometry.location.lng,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                      })
                    } else {
                      showAndExpandBottomSheet()
                    }
                  }}
                  style={[
                    baseStyles.carouselCard,
                    { width: ITEM_WIDTH, opacity: isSelected ? 1 : 0.7, transform: [{ scale: isSelected ? 1 : 0.95 }] },
                  ]}
                >
                  <View style={baseStyles.cardImageSection}>
                    <View style={baseStyles.cardMainImageContainer}>
                      {item.photos?.length ? (
                        <Image
                          source={{ uri: getPhotoUrl(item.photos[0].photo_reference, 400) }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={baseStyles.cardImagePlaceholder}>Foto Principal</Text>
                      )}
                    </View>
                    <View style={baseStyles.cardSideImagesContainer}>
                      <View style={baseStyles.cardSideImageContainer}>
                        {item.photos?.length > 1 ? (
                          <Image
                            source={{ uri: getPhotoUrl(item.photos[1].photo_reference, 200) }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={baseStyles.cardImagePlaceholder}>Foto 2</Text>
                        )}
                      </View>
                      <View style={baseStyles.cardSideImageContainer}>
                        {item.photos?.length > 2 ? (
                          <Image
                            source={{ uri: getPhotoUrl(item.photos[2].photo_reference, 200) }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={baseStyles.cardImagePlaceholder}>Foto 3</Text>
                        )}
                      </View>
                    </View>
                  </View>
                  <View style={baseStyles.cardInfoSection}>
                    <View style={baseStyles.cardLeftInfo}>
                      <Text style={baseStyles.placeName}>{item.name}</Text>

                      <View style={baseStyles.badges}>
                        {(() => {
                          console.log("[v0] Rendering badges for item:", item.name)
                          console.log("[v0] Item dietaryCategories:", item.dietaryCategories)
                          console.log("[v0] Current selectedFilters:", selectedFilters)

                          if (!item.dietaryCategories || item.dietaryCategories.length === 0) {
                            console.log("[v0] No dietary categories, showing default badge")
                            return <Text style={baseStyles.badge}>Restaurante</Text>
                          }

                          const filteredBadges = getFilteredBadges(item.dietaryCategories, selectedFilters)
                          console.log("[v0] Filtered badges result:", filteredBadges)

                          if (filteredBadges.length === 0) {
                            console.log("[v0] No matching badges after filtering")
                            return <Text style={baseStyles.badge}>Restaurante</Text>
                          }

                          return filteredBadges.slice(0, 3).map((category: string, index) => (
                            <Text
                              key={index}
                              style={{
                                backgroundColor: "#00b50677",
                                color: "#fff",
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 12,
                                fontSize: width * 0.038,
                                marginRight: 5,
                                marginBottom: 5,
                              }}
                            >
                              {getDietaryDisplayLabel(category)}
                            </Text>
                          ))
                        })()}
                      </View>
                    </View>
                    <View style={baseStyles.cardRightInfo}>
                      <Text style={baseStyles.placeRating}>⭐ {item.rating}</Text>
                      {location && (
                        <Text style={baseStyles.placeDistance}>
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
          disableIntervalMomentum
          snapToOffsets={infiniteData.map((_, i) => i * TOTAL_ITEM_WIDTH)}
          contentContainerStyle={{ paddingLeft: SIDE_SPACING, paddingRight: SIDE_SPACING }}
          scrollEnabled={isCardScrollable}
          onScrollBeginDrag={handleScrollBegin}
          onMomentumScrollEnd={handleScrollEnd}
          initialScrollIndex={currentIndex}
          removeClippedSubviews
          windowSize={8}
          maxToRenderPerBatch={4}
          updateCellsBatchingPeriod={100}
          pagingEnabled={false}
          bounces={false}
        />
      </View>
    )
  }

  // =========================
  // UI
  // =========================
  if (isLoadingLocation) {
    return (
      <SafeAreaView style={s.loadingScreen}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Obteniendo tu ubicación…</Text>
      </SafeAreaView>
    )
  }

  const dataToShow = places.length > 0 ? places : recommended

  return (
    <SafeAreaView style={s.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={s.header}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}></View>

              {/* Buscador */}
              <View style={s.searchWrap}>
                <View style={s.searchBar}>
                  <Ionicons name="search" size={18} />
                  <TextInput
                    style={s.searchInput}
                    placeholder="Buscá tu lugar ideal..."
                    value={searchText}
                    onChangeText={onChangeText} // 👈 tu handler actual (no tocamos lógica)
                    onSubmitEditing={onSearchSubmit} // 👈 tu submit actual
                    returnKeyType="search"
                  />
                  {searchText.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setSearchText("")
                        setPredictions([])
                        setPlaces([])
                      }}
                    >
                      <Ionicons name="close" size={18} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Autocompletado (dropdown superpuesto) */}
                {predictions.length > 0 && (
                  <View style={s.predictionsBox}>
                    <FlatList
                      keyboardShouldPersistTaps="always"
                      data={predictions}
                      keyExtractor={(it) => it.place_id}
                      renderItem={({ item }) => (
                        <TouchableOpacity style={s.predictionItem} onPress={() => onSelectPrediction(item)}>
                          <Ionicons name="location" size={16} />
                          <Text style={s.predictionText} numberOfLines={2}>
                            {item.description}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                )}
              </View>

              {/* Filtros: horizontal */}
              <View style={{ marginTop: 10 }}>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 8, gap: 8 }}
                  data={availableFilters}
                  keyExtractor={(f) => f.key}
                  renderItem={({ item: f }) => {
                    const active = isActive(f.key)

                    return (
                      <TouchableOpacity
                        style={[s.filterChip, active && s.filterChipActive]}
                        onPress={() => onToggleFilter(f.key)}
                      >
                        <Text style={[s.filterChipText, active && s.filterChipTextActive]}>{f.label}</Text>
                      </TouchableOpacity>
                    )
                  }}
                />
              </View>
            </View>

            {/* Contenido */}
            {mode === "feed" ? (
              <View style={{ flex: 1 }}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>{places.length > 0 ? "Resultados" : "Recomendados cerca"}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      singlePlaceLock.current = false
                      goToMap()
                    }}
                  >
                    <Text style={s.sectionAction}>Ver en mapa</Text>
                  </TouchableOpacity>
                </View>

                {isFetching ? (
                  <View style={s.loadingBlock}>
                    <ActivityIndicator size="large" />
                  </View>
                ) : (
                  <FlatList
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
                    data={dataToShow}
                    keyExtractor={(item) => item.place_id || uuidv4()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={s.card}
                        onPress={() => {
                          singlePlaceLock.current = true
                          goToMap()
                          const collection = places.length > 0 ? places : recommended
                          setNearbyPlacesList(collection.slice(0, MAX_PLACES_LIMIT))
                          setSelectedPlace(item)
                          setIsCardScrollable(collection.length > 1)
                          setRealCurrentIndex(
                            Math.max(
                              0,
                              collection.findIndex((p) => p.place_id === item.place_id),
                            ),
                          )
                          flyTo(item.geometry.location.lat, item.geometry.location.lng)
                          showAndExpandBottomSheet()
                        }}
                      >
                        <View style={s.cardImageWrap}>
                          {item.photos?.length ? (
                            <Image
                              source={{ uri: getPhotoUrl(item.photos[0].photo_reference, 600) }}
                              style={s.cardImage}
                            />
                          ) : (
                            <View style={s.cardImagePlaceholder}>
                              <Ionicons name="image" size={18} />
                              <Text style={{ marginTop: 6, color: "#777" }}>Sin foto</Text>
                            </View>
                          )}
                        </View>
                        <View style={s.cardBody}>
                          <View style={{ flex: 1 }}>
                            <Text numberOfLines={1} style={s.cardTitle}>
                              {item.name}
                            </Text>
                            <View style={s.metaRow}>
                              <Text style={s.metaText}>⭐ {item.rating ?? "-"}</Text>
                              {location && (
                                <Text style={s.metaText}>
                                  •{" "}
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
                            {item.dietaryCategories && item.dietaryCategories.length > 0 && (
                              <View style={s.badgesRow}>
                                {getFilteredBadges(item.dietaryCategories, selectedFilters)
                                  .slice(0, 3)
                                  .map((category: string, index) => (
                                    <Text key={index} style={s.badge}>
                                      {getDietaryDisplayLabel(category)}
                                    </Text>
                                  ))}
                              </View>
                            )}
                            {item.website && (
                              <TouchableOpacity
                                style={s.websiteButton}
                                onPress={() => {
                                  if (item.website) {
                                    Linking.openURL(item.website).catch(() =>
                                      Alert.alert("Error", "No se pudo abrir el sitio web"),
                                    )
                                  }
                                }}
                              >
                                <Ionicons name="globe-outline" size={16} color="#007AFF" />
                                <Text style={s.websiteButtonText}>Sitio Web Oficial</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          <TouchableOpacity onPress={() => toggleFavorite(item)}>
                            <FontAwesome name={isFavorite(item) ? "heart" : "heart-o"} size={18} color="#ff9500" />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                )}
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                {location && (
                  <MapView
                    customMapStyle={ONLY_BUSINESS_STYLE}
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={{ flex: 1 }}
                    showsUserLocation
                    initialRegion={{
                      latitude: location.latitude,
                      longitude: location.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    onPress={() => setShowBottomSheet(false)}
                  >
                    {nearbyPlacesList.slice(0, MAX_PLACES_LIMIT).map((p) => (
                      <Marker
                        key={p.place_id || uuidv4()}
                        coordinate={{
                          latitude: p.geometry.location.lat,
                          longitude: p.geometry.location.lng,
                        }}
                        title={p.name}
                        onPress={() => {
                          setSelectedPlace(p)
                          showAndExpandBottomSheet()
                        }}
                        pinColor="#FF9500"
                      />
                    ))}
                  </MapView>
                )}
                {renderCarousel()}
                <View style={s.mapOverlay}>
                  <TouchableOpacity
                    style={s.mapBackPill}
                    onPress={() => {
                      singlePlaceLock.current = false
                      nav.navigate("Home")
                    }}
                  >
                    <Ionicons name="chevron-back" size={16} />
                    <Text style={s.mapBackPillText}>Volver a la lista</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Bottom Sheet ORIGINAL */}
            {showBottomSheet && selectedPlace && (
              <PanGestureHandler onGestureEvent={gestureHandler}>
                <Animated.View style={[baseStyles.bottomSheet, bottomSheetStyle]}>
                  <View style={baseStyles.bottomSheetHandle} />
                  <View style={baseStyles.bottomSheetContent}>
                    {/* imágenes */}
                    <View style={baseStyles.imageSection}>
                      <TouchableOpacity
                        style={baseStyles.mainImageContainer}
                        onPress={() => handleOpenImageViewer(0)}
                        activeOpacity={0.8}
                      >
                        {selectedPlace.photos?.length ? (
                          <Image
                            source={{ uri: getPhotoUrl(selectedPlace.photos[0].photo_reference, 800) }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={baseStyles.imagePlaceholder}>Foto Principal</Text>
                        )}
                      </TouchableOpacity>
                      <View style={baseStyles.sideImagesContainer}>
                        <TouchableOpacity
                          style={baseStyles.sideImageContainer}
                          onPress={() => {
                            if (selectedPlace.photos && selectedPlace.photos.length > 1) handleOpenImageViewer(1)
                          }}
                          activeOpacity={0.8}
                        >
                          {selectedPlace.photos?.[1] ? (
                            <Image
                              source={{ uri: getPhotoUrl(selectedPlace.photos[1].photo_reference, 400) }}
                              style={{ width: "100%", height: "100%" }}
                              resizeMode="cover"
                            />
                          ) : (
                            <Text style={baseStyles.sideImagePlaceholder}>Foto 2</Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={baseStyles.sideImageContainer}
                          onPress={() => {
                            if (selectedPlace.photos && selectedPlace.photos.length > 2) handleOpenImageViewer(2)
                          }}
                          activeOpacity={0.8}
                        >
                          {selectedPlace.photos?.[2] ? (
                            <Image
                              source={{ uri: getPhotoUrl(selectedPlace.photos[2].photo_reference, 400) }}
                              style={{ width: "100%", height: "100%" }}
                              resizeMode="cover"
                            />
                          ) : (
                            <Text style={baseStyles.sideImagePlaceholder}>Foto 3</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* info + chips */}
                    <View style={{ marginBottom: 15 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
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
                            {selectedPlace.dietaryCategories && selectedPlace.dietaryCategories.length > 0 ? (
                              getFilteredBadges(selectedPlace.dietaryCategories, selectedFilters).map(
                                (category: string, index) => (
                                  <Text
                                    key={index}
                                    style={{
                                      backgroundColor: "#4CAF50",
                                      color: "#fff",
                                      paddingHorizontal: 10,
                                      paddingVertical: 6,
                                      borderRadius: 12,
                                      fontSize: width * 0.038,
                                    }}
                                  >
                                    {getDietaryDisplayLabel(category)}
                                  </Text>
                                ),
                              )
                            ) : (
                              <Text
                                style={{
                                  backgroundColor: "#eee",
                                  paddingHorizontal: 10,
                                  paddingVertical: 6,
                                  borderRadius: 12,
                                  fontSize: width * 0.038,
                                }}
                              >
                                Restaurante
                              </Text>
                            )}
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

                    {/* tabs */}
                    <View style={baseStyles.tabContainer}>
                      <TouchableOpacity
                        style={[baseStyles.tab, activeTab === "info" && baseStyles.activeTab]}
                        onPress={() => setActiveTab("info")}
                      >
                        <Text style={[baseStyles.tabText, activeTab === "info" && baseStyles.activeTabText]}>
                          Información
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[baseStyles.tab, activeTab === "reviews" && baseStyles.activeTab]}
                        onPress={() => setActiveTab("reviews")}
                      >
                        <Text style={[baseStyles.tabText, activeTab === "reviews" && baseStyles.activeTabText]}>
                          Reseñas
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={baseStyles.tabContent}>
                      {activeTab === "info" ? (
                        <View style={[baseStyles.infoTabContent, { justifyContent: "flex-start", paddingTop: 20 }]}>
                          {selectedPlace.website && (
                            <TouchableOpacity style={s.websiteButtonLarge} onPress={handleWebsite}>
                              <Ionicons name="globe-outline" size={20} color="#fff" />
                              <Text style={s.websiteButtonLargeText}>Visitar Sitio Web Oficial</Text>
                            </TouchableOpacity>
                          )}
                          <View style={[baseStyles.infoActionButtons, { marginTop: selectedPlace.website ? 20 : 10 }]}>
                            <TouchableOpacity
                              style={baseStyles.infoActionButton}
                              onPress={() => toggleFavorite(selectedPlace)}
                            >
                              <FontAwesome
                                name={isFavorite(selectedPlace) ? "heart" : "heart-o"}
                                size={20}
                                color="#ff9500"
                              />
                            </TouchableOpacity>
                            <TouchableOpacity style={baseStyles.infoActionButton} onPress={handleDirections}>
                              <Ionicons name="navigate" size={20} color="#ff9500" />
                            </TouchableOpacity>
                            <TouchableOpacity style={baseStyles.infoActionButton} onPress={handleShare}>
                              <Ionicons name="share-social" size={20} color="#ff9500" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <View>
                          <Text style={baseStyles.bottomSheetText}>Reseñas de {selectedPlace.name}.</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Animated.View>
              </PanGestureHandler>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// =========================
// Estilos locales para header/feed
// =========================
const s = StyleSheet.create({
  searchWrap: { marginTop: 10 },
  container: { flex: 1, backgroundColor: "#fff" },
  loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: "#fff" },
  hiTitle: { fontSize: 22, fontWeight: "800" },
  modeSwitch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f2f2f2",
  },
  modeSwitchText: { fontSize: 13, fontWeight: "600" },
  searchBar: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 16 },
  predictionsBox: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
    maxHeight: 220,
  },
  predictionItem: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f3f3",
  },
  predictionText: { flex: 1 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#eee",
    marginLeft: 8,
  },
  filterChipActive: { backgroundColor: "#ff9500", borderColor: "#ff9500" },
  filterChipText: { fontSize: 13, color: "#333", fontWeight: "600" },
  filterChipTextActive: { color: "#fff" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  sectionAction: { color: "#ff9500", fontWeight: "700" },
  loadingBlock: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardImageWrap: { height: 160, backgroundColor: "#f2f2f2" },
  cardImage: { width: "100%", height: "100%" },
  cardImagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  cardBody: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  metaRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  metaText: { color: "#666", fontWeight: "600" },
  mapOverlay: { position: "absolute", top: 12, left: 0, right: 0, alignItems: "center" },
  mapBackPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  mapBackPillText: { fontWeight: "700" },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  badge: {
    backgroundColor: "#00b50677",
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: "600",
  },
  websiteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#f0f8ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  websiteButtonText: {
    color: "#007AFF",
    fontSize: 12,
    fontWeight: "600",
  },
  websiteButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
  },
  websiteButtonLargeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})

const getFilteredBadges = (dietaryCategories: string[], selectedFilters: string[]) => {
  console.log("[v0] === getFilteredBadges DEBUG ===")
  console.log("[v0] Input dietaryCategories:", dietaryCategories)
  console.log("[v0] Input selectedFilters:", selectedFilters)

  // Always return something, never undefined or empty unexpectedly
  if (!dietaryCategories || dietaryCategories.length === 0) {
    console.log("[v0] No dietary categories available, returning empty array")
    return []
  }

  if (selectedFilters.length === 0) {
    console.log("[v0] No filters selected (Recomendados mode), showing all badges")
    return dietaryCategories
  }

  // Get categories that match selected filters
  const matchingCategories = dietaryCategories.filter((category) => {
    const categoryLower = category.toLowerCase()
    return selectedFilters.some((filter) => {
      const filterLower = filter.toLowerCase()

      // Check for matches - both direct and cross-category matches
      let matches = false

      // Direct matches
      if (categoryLower.includes(filterLower)) {
        matches = true
      }

      // Cross-category matches for Sin TACC/Celiaco
      if (
        (filterLower.includes("sin tacc") || filterLower.includes("tacc")) &&
        (categoryLower.includes("celiaco") || categoryLower.includes("celíaco"))
      ) {
        matches = true
      }

      if (
        (filterLower.includes("celiaco") || filterLower.includes("celíaco")) &&
        (categoryLower.includes("sin tacc") || categoryLower.includes("tacc"))
      ) {
        matches = true
      }

      // Vegano/Vegetariano matches
      if (filterLower.includes("vegano") && categoryLower.includes("vegano")) {
        matches = true
      }

      if (filterLower.includes("vegetariano") && categoryLower.includes("vegetariano")) {
        matches = true
      }

      console.log("[v0] Filter:", filter, "vs Category:", category, "-> Match:", matches)
      return matches
    })
  })

  console.log("[v0] Final result:", matchingCategories)
  console.log("[v0] === END DEBUG ===")
  return matchingCategories
}

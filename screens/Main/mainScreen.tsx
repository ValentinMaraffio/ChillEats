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
import { PanGestureHandler, ScrollView, NativeViewGestureHandler } from "react-native-gesture-handler"
import { StatusBar } from "expo-status-bar"
import { useFocusEffect, useRoute } from "@react-navigation/native"
import { useFavorites } from "../../context/favoritesContext"
import { useAuth } from "../../context/authContext"
import { useKeyboardVisibility } from "../../hooks/useKeyboardVisibility"
import { useFilters } from "../../context/filtersContext"
import { useNavigation } from "@react-navigation/native"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import type { TabParamList } from "../../types/navigation"
import { inferDietaryCategories } from "../Favorites/favoritesBackend"
import { getPrimaryPhotoUrl } from "../Favorites/favoritesBackend"
import axios from "axios"

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

declare const __DEV__: boolean

const VERBOSE = false
const logv = (...args: any[]) => {
  if (__DEV__ && VERBOSE) console.log(...args)
}

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
          backgroundColor: "#FF9500",
          borderWidth: 2,
          borderColor: "#000",
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
          borderTopColor: "#FF9500",
          transform: [{ translateY: -1 }],
        }}
      />
    </View>
  )
}

type Review = {
  id: string
  rating: number
  date: string
  text: string
  tags: string[]
  user: { name: string; profileImage: string | null }
}

export default function MainScreenV2() {
  const [mapReady, setMapReady] = useState(false)
  const singlePlaceLock = useRef(false)
  const route = useRoute() as any
  const nav = useNavigation<BottomTabNavigationProp<TabParamList>>()
  const goToMap = useCallback(() => {
    nav.navigate("Map")
  }, [nav])

  const lastProcessedPlaceId = useRef<string | null>(null)

  const { user, token } = useAuth()
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites()

  const ONLY_BUSINESS_STYLE = [
    { featureType: "poi.attraction", stylers: [{ visibility: "off" }] },
    { featureType: "poi.government", stylers: [{ visibility: "off" }] },
    { featureType: "poi.medical", stylers: [{ visibility: "off" }] },
    { featureType: "poi.park", stylers: [{ visibility: "off" }] },
    { featureType: "poi.place_of_worship", stylers: [{ visibility: "off" }] },
    { featureType: "poi.school", stylers: [{ visibility: "off" }] },
    { featureType: "poi.sports_complex", stylers: [{ visibility: "off" }] },
    { featureType: "poi.business", stylers: [{ visibility: "on" }] },
  ]

  const [badgeFiltersOverride, setBadgeFiltersOverride] = useState<string[] | null>(null)

  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [mode, setMode] = useState<"feed" | "map">("feed")

  useFocusEffect(
    useCallback(() => {
      const name = route?.name as string
      setMode(name === "Map" ? "map" : "feed")
    }, [route?.name]),
  )

  const [searchText, setSearchText] = useState("")
  const [predictions, setPredictions] = useState<any[]>([])

  const { selectedFilters, setSelectedFilters, toggleFilter, DEFAULT_FILTER_KEY } = useFilters()
  const onToggleFilter = (key: string) => {
    if (key === DEFAULT_FILTER_KEY) {
      setSelectedFilters([])
      return
    }
    setSelectedFilters((prev) => {
      const newFilters = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      return newFilters
    })
  }

  const [isFetching, setIsFetching] = useState(false)
  const [places, setPlaces] = useState<Place[]>([])
  const [recommended, setRecommended] = useState<Place[]>([])

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

  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const translateY = useSharedValue(height)
  const snapPoints = { expanded: 0, middle: height * 0.4, closed: height }
  const ABSOLUTE_MIN = 0
  const ABSOLUTE_MAX = height + 100
  const needsRepositioning = useRef(false)
  const pendingOpenSheet = useRef(false)
  const [activeTab, setActiveTab] = useState<"info" | "reviews">("info")

  const [showImageViewer, setShowImageViewer] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [viewerPhotos, setViewerPhotos] = useState<Array<{ photo_reference: string; height: number; width: number }>>(
    [],
  )

  const [placeReviews, setPlaceReviews] = useState<Review[]>([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(false)
  const [newReviewRating, setNewReviewRating] = useState<number>(0)
  const [newReviewText, setNewReviewText] = useState<string>("")
  const [newReviewTags, setNewReviewTags] = useState<string>("")
  const reviewsScrollRef = useRef(null)

  const lastHandledPlaceId = useRef<string | null>(null)

  const TAG_OPTIONS = ["SIN TACC", "Vegetariano", "Vegano"]
  const [selectedReviewTags, setSelectedReviewTags] = useState<string[]>([])

  const toggleReviewTag = (tag: string) => {
    setSelectedReviewTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }
  const mapRef = useRef<MapView>(null)

  const renderStars = (
    rating: number,
    onPressStar?: (n: number) => void,
    size = 18, // ⬅️ más grande por defecto
  ) => {
    const arr = []
    for (let i = 1; i <= 5; i++) {
      const filled = i <= rating
      arr.push(
        <TouchableOpacity
          key={i}
          activeOpacity={onPressStar ? 0.7 : 1}
          onPress={() => {
            if (!onPressStar) return
            // Toggle off: si tocás la misma estrella, vuelve a 0
            onPressStar(i === rating ? 0 : i)
          }}
          style={baseStyles.starTouchable} // ⬅️ área táctil más grande
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} // más perdón al dedo
        >
          <FontAwesome name={filled ? "star" : "star-o"} size={size} color={filled ? "#FFD700" : "#cfcfcf"} />
        </TouchableOpacity>,
      )
    }
    return <View style={baseStyles.starsRow}>{arr}</View>
  }

  const renderStarsStatic = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesome
          key={i}
          name={i <= rating ? "star" : "star-o"}
          size={16}
          color={i <= rating ? "#FFD700" : "#ccc"}
          style={{ marginRight: 2 }}
        />,
      )
    }
    return <View style={{ flexDirection: "row" }}>{stars}</View>
  }

  const fetchPlaceReviews = useCallback(async () => {
    if (!selectedPlace?.place_id) return
    try {
      setIsLoadingReviews(true)
      const res = await axios.get(`http://172.16.6.156:8000/api/reviews/place/${selectedPlace.place_id}`)
      const transformed = (res.data?.reviews ?? []).map((r: any) => ({
        id: r._id,
        rating: r.rating,
        date: new Date(r.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }),
        text: r.comment,
        tags: r.tags ?? [],
        user: {
          name: r.userId?.name || "Anónimo",
          profileImage: r.userId?.profileImage || null,
        },
      })) as Review[]
      setPlaceReviews(transformed)
    } catch (e) {
      console.error("Error cargando reseñas:", e)
    } finally {
      setIsLoadingReviews(false)
    }
  }, [selectedPlace])

  const submitReview = async () => {
    if (!selectedPlace?.place_id) return
    if (!user) {
      Alert.alert("Iniciá sesión", "Necesitás estar logueado para publicar una reseña.")
      return
    }
    if (newReviewRating === 0 || newReviewText.trim().length < 3) {
      Alert.alert("Faltan datos", "Elegí una puntuación y escribí un comentario.")
      return
    }
    try {
      const payload = {
        rating: newReviewRating,
        comment: newReviewText.trim(),
        tags: selectedReviewTags,
        placeId: selectedPlace.place_id,
        placeName: selectedPlace.name ?? "Lugar sin nombre",
        images: [],
      }
      await axios.post(`http://172.16.6.156:8000/api/reviews/create`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setNewReviewRating(0)
      setNewReviewText("")
      setSelectedReviewTags([])
      fetchPlaceReviews()
      Alert.alert("¡Gracias!", "Tu reseña fue publicada.")
    } catch (e) {
      console.error("Error publicando reseña:", e)
      Alert.alert("Error", "No se pudo publicar la reseña.")
    }
  }

  useEffect(() => {
    if (activeTab === "reviews") fetchPlaceReviews()
  }, [activeTab, selectedPlace, fetchPlaceReviews])

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
    if (mode !== "map") return
    if (singlePlaceLock.current) return // Este check debe prevenir la ejecución

    const collection = places.length > 0 ? places : recommended.length > 0 ? recommended : []

    if (collection.length > 0) {
      console.log("[v0] Auto-loading map with collection (not from feed)")
      setNearbyPlacesList(collection.slice(0, MAX_PLACES_LIMIT))
      setSelectedPlace(collection[0])
      setIsCardScrollable(collection.length > 1)
      setRealCurrentIndex(0)
      setTimeout(() => {
        if (collection[0]?.geometry?.location) {
          flyTo(collection[0].geometry.location.lat, collection[0].geometry.location.lng, true)
        }
      }, 0)
    }
  }, [mode, selectedFilters, places, recommended])

  useEffect(() => {
    ;(async () => {
      setIsLoadingLocation(true)
      const coords = await getCurrentLocation()
      setLocation(coords)
      setIsLoadingLocation(false)
    })()
  }, [])

  const fetchRecommended = useCallback(async () => {
    if (!location) return
    try {
      setIsFetching(true)

      let results: Place[] = []

      if (selectedFilters.length > 0) {
        logv("[v0] Fetching filtered restaurants for filters:", selectedFilters)
        results = await searchFilteredRestaurants(selectedFilters, location.latitude, location.longitude)
      } else {
        logv("[v0] Fetching regular restaurants (Recomendados mode)")
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

      setRecommended(take)
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
    setActiveTab("info")
    translateY.value = snapPoints.closed

    // Si ya estamos en el mapa, abrimos de inmediato
    if (mode === "map") {
      setShowBottomSheet(true)
      setTimeout(() => {
        translateY.value = withSpring(snapPoints.middle, { damping: 25, stiffness: 250 })
      }, 50)
      return
    }

    // Si no estamos en el mapa, marcamos la apertura pendiente.
    // La apertura real se hará cuando el modo cambie a 'map'.
    pendingOpenSheet.current = true
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

  const needsCarouselInit = useRef(false)
  const pendingCarouselIndex = useRef(0)
  const onCarouselInitComplete = useRef<(() => void) | null>(null)

  useEffect(() => {
    const inf = createInfiniteData(nearbyPlacesList)
    setInfiniteData(inf)
    if (nearbyPlacesList.length > 0) {
      const targetRealIndex = needsCarouselInit.current ? pendingCarouselIndex.current : realCurrentIndex
      const initial = getInitialInfiniteIndex(targetRealIndex, nearbyPlacesList.length)
      setCurrentIndex(initial)

      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: initial * TOTAL_ITEM_WIDTH, animated: false })

        if (needsCarouselInit.current && onCarouselInitComplete.current) {
          setTimeout(() => {
            onCarouselInitComplete.current?.()
            onCarouselInitComplete.current = null
          }, 150)
        }

        if (needsCarouselInit.current) {
          needsCarouselInit.current = false
        }
      }, 200)
    }
  }, [nearbyPlacesList])

  useEffect(() => {
    const params = (route?.params ?? {}) as {
      carouselSource?: "favorites"
      initialPlaceId?: string
      favoriteIds?: string[]
      showDietBadge?: boolean
      badgeFilters?: string[]
    }

    if (params.carouselSource === "favorites" && Array.isArray(params.favoriteIds) && params.favoriteIds.length > 0) {
      singlePlaceLock.current = true
      setMode("map")

      if (params.showDietBadge) {
        setBadgeFiltersOverride(params.badgeFilters ?? [])
      } else {
        setBadgeFiltersOverride([])
      }

      const favList = favorites.filter((p: any) => params.favoriteIds!.includes(p.place_id ?? p.id))
      const ordered = params
        .favoriteIds!.map((id) => favList.find((p: any) => (p.place_id ?? p.id) === id))
        .filter(Boolean) as Place[]

      const subset = ordered.slice(0, MAX_PLACES_LIMIT)
      setNearbyPlacesList(subset)

      const idx = Math.max(
        0,
        subset.findIndex((p) => (p.place_id ?? (p as any).id) === params.initialPlaceId),
      )
      setSelectedPlace(subset[idx] ?? subset[0] ?? null)
      setIsCardScrollable(subset.length > 1)
      setRealCurrentIndex(idx)

      const center = subset[idx]?.geometry?.location
      if (center?.lat && center?.lng) {
        setTimeout(() => {
          mapRef.current?.animateToRegion(
            {
              latitude: center.lat,
              longitude: center.lng,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            },
            300,
          )
        }, 0)
      }
    } else {
      setBadgeFiltersOverride(null)
    }
  }, [route?.params, favorites])

  useEffect(() => {
    if (!showBottomSheet && needsRepositioning.current && infiniteData.length > 0) {
      const t = setTimeout(() => {
        scrollToIndex(currentIndex, false)
        needsRepositioning.current = false
      }, 100)
      return () => clearTimeout(t)
    }
  }, [showBottomSheet, currentIndex, infiniteData])

  // Mantener el bottom sheet cerrado cuando estamos en 'feed' y
  // procesar aperturas pendientes cuando lleguemos a 'map'.
  useEffect(() => {
    if (mode !== "map") {
      // Si dejamos el mapa (ej: volvemos a la lista), cerramos el sheet
      pendingOpenSheet.current = false
      setShowBottomSheet(false)
      // opcional: reposicionar el carousel si hacía falta
      needsRepositioning.current = true
      return
    }

    // Si entramos al mapa y hay una apertura pendiente, abrimos
    if (pendingOpenSheet.current) {
      pendingOpenSheet.current = false
      setShowBottomSheet(true)
      setTimeout(() => {
        translateY.value = withSpring(snapPoints.middle, { damping: 25, stiffness: 250 })
      }, 80)
    }
  }, [mode])

  const params = route?.params as
    | {
        placeId?: string
        fromFeed?: boolean
        collection?: Place[]
        initialIndex?: number
      }
    | undefined

  useEffect(() => {
    console.log("[v0] Navigation params changed:", {
      placeId: params?.placeId,
      fromFeed: params?.fromFeed,
      mapReady,
      singlePlaceLock: singlePlaceLock.current,
    })

    // Check mapReady and params.placeId early
    if (!mapReady || !params?.placeId) {
      console.log("[v0] Map not ready or no placeId provided, returning.")
      return
    }

    if (lastProcessedPlaceId.current === params.placeId) {
      console.log("[v0] Already processed this placeId, skipping")
      return
    }

    lastProcessedPlaceId.current = params.placeId

    singlePlaceLock.current = true
    console.log("[v0] Set singlePlaceLock to true")

    setMode("map")

    if (params.fromFeed && params.collection) {
      const coll = params.collection
      const idx = params.initialIndex || 0
      const place = coll[idx]

      if (!place) {
        console.log("[v0] Place not found in collection, returning.")
        return
      }

      console.log("[v0] Loading from feed, index:", idx, "place:", place.name)

      needsCarouselInit.current = true
      pendingCarouselIndex.current = idx

      onCarouselInitComplete.current = () => {
        console.log("[v0] Carousel init complete, flying to location")
        flyTo(place.geometry.location.lat, place.geometry.location.lng, true)
        showAndExpandBottomSheet()
      }

      setNearbyPlacesList(coll)
      setSelectedPlace(place)
      setIsCardScrollable(coll.length > 1)
      setRealCurrentIndex(idx)
      return
    }

    // ✅ If coming from another screen (profile, etc.)
    if (params.placeId) {
      console.log("[v0] Loading single place:", params.placeId)
      ;(async () => {
        const det = await getPlaceDetails(params.placeId!)
        if (det) {
          setNearbyPlacesList([det])
          setSelectedPlace(det)
          setIsCardScrollable(false)
          setRealCurrentIndex(0)
          flyTo(det.geometry.location.lat, det.geometry.location.lng, true)
          showAndExpandBottomSheet()
        }
      })()
    }
  }, [params?.placeId, mapReady]) // Removed redundant dependencies

  const handleOpenImageViewer = (idx: number) => {
    if (selectedPlace?.photos?.length) {
      setViewerPhotos(selectedPlace.photos)
      setSelectedImageIndex(idx)
      setShowImageViewer(true)
    }
  }

  const buildFavoritePayload = (place: Place): Place => {
    const dietaryCategories = inferDietaryCategories(place)
    const primaryPhotoUrl = place?.photos?.[0]?.photo_reference
      ? getPhotoUrl(place.photos[0].photo_reference, 800)
      : getPrimaryPhotoUrl(place)
    return { ...place, dietaryCategories, primaryPhotoUrl }
  }

  const toggleFavorite = async (place: Place) => {
    if (isFavorite(place)) {
      removeFavorite(place)
      return
    }

    let base: Place = place
    let tags = inferDietaryCategories(base)

    if (!tags || tags.length === 0) {
      const det = await getPlaceDetails(place.place_id)
      if (det) {
        base = { ...det, rating: det.rating ?? place.rating, photos: det.photos ?? place.photos }
        tags = inferDietaryCategories(base)
      }
    }

    const enriched = buildFavoritePayload({ ...base, dietaryCategories: tags })
    addFavorite(enriched)
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
                          <Text style={baseStyles.cardImagePlaceholder}>Cargando...</Text>
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
                          <Text style={baseStyles.cardImagePlaceholder}>Cargando...</Text>
                        )}
                      </View>
                    </View>
                  </View>
                  <View style={baseStyles.cardInfoSection}>
                    <View style={baseStyles.cardLeftInfo}>
                      <Text style={baseStyles.placeName}>{item.name}</Text>

                      <View style={baseStyles.badges}>
                        {(() => {
                          const effectiveFilters =
                            badgeFiltersOverride !== null ? badgeFiltersOverride : selectedFilters

                          if (badgeFiltersOverride !== null && effectiveFilters.length === 0) {
                            return null
                          }

                          if (!item.dietaryCategories || item.dietaryCategories.length === 0) {
                            return <Text style={baseStyles.badge}>Restaurante</Text>
                          }

                          const filteredBadges =
                            effectiveFilters.length === 0
                              ? item.dietaryCategories
                              : getFilteredBadges(item.dietaryCategories, effectiveFilters)

                          if (filteredBadges.length === 0) {
                            return <Text style={baseStyles.badge}>Restaurante</Text>
                          }

                          return filteredBadges.slice(0, 3).map((category: string, index: number) => (
                            <Text
                              key={index}
                              style={{
                                backgroundColor: "#4CAF50",
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
            <View style={s.header}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}></View>
              <View style={s.searchWrap}>
                <View style={s.searchBar}>
                  <Ionicons name="search" size={18} />
                  <TextInput
                    style={s.searchInput}
                    placeholder="Buscá tu lugar ideal..."
                    value={searchText}
                    onChangeText={onChangeText}
                    onSubmitEditing={onSearchSubmit}
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

            {mode === "feed" ? (
              <View style={{ flex: 1 }}> {/*}
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
                </View>{*/}

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
                          const collection = places.length > 0 ? places : recommended
                          const idx = Math.max(
                            0,
                            collection.findIndex((p) => p.place_id === item.place_id),
                          )

                          nav.navigate("Map", {
                            placeId: item.place_id,
                            fromFeed: true,
                            collection: collection.slice(0, MAX_PLACES_LIMIT),
                            initialIndex: idx,
                          })
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
                    onMapReady={() => setMapReady(true)}
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
                      setShowBottomSheet(false) // <- forzamos cerrar si estaba abierto
                      pendingOpenSheet.current = false
                      nav.navigate("Home")
                    }}
                  >
                    <Ionicons name="chevron-back" size={16} />
                    <Text style={s.mapBackPillText}>Volver a la lista</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {showBottomSheet && selectedPlace && (
              <PanGestureHandler
                onGestureEvent={gestureHandler}
                waitFor={activeTab === "reviews" ? reviewsScrollRef : undefined}
                simultaneousHandlers={activeTab === "reviews" ? reviewsScrollRef : undefined}
                activeOffsetY={activeTab === "reviews" ? undefined : [-20, 20]}
              >
                <Animated.View style={[baseStyles.bottomSheet, { height }, bottomSheetStyle]}>
                  <View style={baseStyles.bottomSheetHandle} />
                  <View style={baseStyles.bottomSheetContent}>
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
                            <Text style={baseStyles.sideImagePlaceholder}>Cargando...</Text>
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
                            <Text style={baseStyles.sideImagePlaceholder}>Cargando...</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={{ marginBottom: 16 }}>
                      {/* Name */}
                      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 4 }}>
                        {selectedPlace.name}
                      </Text>

                      {/* Address */}
                      <Text style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
                        {selectedPlace.formatted_address || selectedPlace.vicinity || "Dirección no disponible"}
                      </Text>

                      {/* Rating and Review Count */}
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                        <FontAwesome name="star" size={16} color="#FFD700" />
                        <Text style={{ fontSize: 16, fontWeight: "bold", color: "#333", marginLeft: 4 }}>
                          {selectedPlace.rating || "N/A"}
                        </Text>
                        <Text style={{ fontSize: 14, color: "#666", marginLeft: 4 }}>
                          ({selectedPlace.user_ratings_total || 0} reseñas)
                        </Text>
                      </View>

                      {/* Tags/Badges */}
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {(() => {
                          const effectiveFilters =
                            badgeFiltersOverride !== null ? badgeFiltersOverride : selectedFilters

                          if (badgeFiltersOverride !== null && effectiveFilters.length === 0) {
                            return null
                          }

                          if (!selectedPlace.dietaryCategories || selectedPlace.dietaryCategories.length === 0) {
                            return (
                              <View
                                style={{
                                  backgroundColor: "#FFF3CD",
                                  paddingHorizontal: 12,
                                  paddingVertical: 6,
                                  borderRadius: 16,
                                }}
                              >
                                <Text style={{ color: "#856404", fontSize: 13, fontWeight: "600" }}>Restaurante</Text>
                              </View>
                            )
                          }

                          const filtered =
                            effectiveFilters.length === 0
                              ? selectedPlace.dietaryCategories
                              : getFilteredBadges(selectedPlace.dietaryCategories, effectiveFilters)

                          if (filtered.length === 0) {
                            return (
                              <View
                                style={{
                                  backgroundColor: "#FFF3CD",
                                  paddingHorizontal: 12,
                                  paddingVertical: 6,
                                  borderRadius: 16,
                                }}
                              >
                                <Text style={{ color: "#856404", fontSize: 13, fontWeight: "600" }}>Restaurante</Text>
                              </View>
                            )
                          }

                          return filtered.map((category: string, index: number) => (
                            <View
                              key={index}
                              style={{
                                backgroundColor: "#D4EDDA",
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 16,
                              }}
                            >
                              <Text style={{ color: "#155724", fontSize: 13, fontWeight: "600" }}>
                                {getDietaryDisplayLabel(category)}
                              </Text>
                            </View>
                          ))
                        })()}
                      </View>
                    </View>

                    <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 20 }}>
                      <TouchableOpacity
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 30,
                          backgroundColor: "#FF9500",
                          justifyContent: "center",
                          alignItems: "center",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.15,
                          shadowRadius: 3.84,
                          elevation: 3,
                        }}
                        onPress={() => toggleFavorite(selectedPlace)}
                      >
                        <FontAwesome name={isFavorite(selectedPlace) ? "heart" : "heart-o"} size={24} color="#fff" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 30,
                          backgroundColor: "#FFF",
                          justifyContent: "center",
                          alignItems: "center",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.15,
                          shadowRadius: 3.84,
                          elevation: 3,
                          borderWidth: 1,
                          borderColor: "#f0f0f0",
                        }}
                        onPress={handleDirections}
                      >
                        <Ionicons name="navigate" size={24} color="#FF9500" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 30,
                          backgroundColor: "#FFF",
                          justifyContent: "center",
                          alignItems: "center",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.15,
                          shadowRadius: 3.84,
                          elevation: 3,
                          borderWidth: 1,
                          borderColor: "#f0f0f0",
                        }}
                        onPress={handleShare}
                      >
                        <Ionicons name="share-social" size={24} color="#FF9500" />
                      </TouchableOpacity>
                    </View>

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
                        onPress={() => {
                          setActiveTab("reviews")
                          translateY.value = withSpring(snapPoints.expanded, { damping: 25, stiffness: 250 })
                        }}
                      >
                        <Text style={[baseStyles.tabText, activeTab === "reviews" && baseStyles.activeTabText]}>
                          Reseñas
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={[baseStyles.tabContent, { flex: 1 }]}>
                      {activeTab === "info" ? (
                        <ScrollView
                          style={{ flex: 1 }}
                          contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
                          showsVerticalScrollIndicator={false}
                        >
                          {/* Horarios Section */}
                          <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 20 }}>
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: "#FFF3E0",
                                justifyContent: "center",
                                alignItems: "center",
                                marginRight: 12,
                              }}
                            >
                              <Ionicons name="time-outline" size={22} color="#FF9500" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 4 }}>
                                Horarios
                              </Text>
                              <Text style={{ fontSize: 14, fontWeight: "600", color: "#28A745" }}>Abierto ahora</Text>
                            </View>
                          </View>

                          {/* Website Section */}
                          {selectedPlace.website && (
                            <TouchableOpacity
                              style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 20 }}
                              onPress={handleWebsite}
                            >
                              <View
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 20,
                                  backgroundColor: "#FFF3E0",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  marginRight: 12,
                                }}
                              >
                                <Ionicons name="globe-outline" size={22} color="#FF9500" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 4 }}>
                                  Sitio web
                                </Text>
                                <Text style={{ fontSize: 14, fontWeight: "600", color: "#FF9500" }}>
                                  Tocar para visitar
                                </Text>
                              </View>
                            </TouchableOpacity>
                          )}

                          {/* Distance Section */}
                          {location && (
                            <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 20 }}>
                              <View
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 20,
                                  backgroundColor: "#FFF3E0",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  marginRight: 12,
                                }}
                              >
                                <Ionicons name="walk-outline" size={22} color="#FF9500" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 4 }}>
                                  Distancia
                                </Text>
                                <Text style={{ fontSize: 14, color: "#666" }}>
                                  {calculateDistance(
                                    location.latitude,
                                    location.longitude,
                                    selectedPlace.geometry.location.lat,
                                    selectedPlace.geometry.location.lng,
                                  ).toFixed(1)}{" "}
                                  km
                                </Text>
                              </View>
                            </View>
                          )}

                          {/* Detailed Schedule Section */}
                          <View style={{ marginTop: 10 }}>
                            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 12 }}>
                              Horarios detallados
                            </Text>
                            <View style={{ backgroundColor: "#f8f8f8", borderRadius: 12, padding: 16 }}>
                              {[
                                { day: "Monday", label: "Lunes", hours: "10:00 AM – 11:00 PM" },
                                { day: "Tuesday", label: "Martes", hours: "10:00 AM – 11:00 PM" },
                                { day: "Wednesday", label: "Miércoles", hours: "10:00 AM – 11:00 PM" },
                                { day: "Thursday", label: "Jueves", hours: "10:00 AM – 11:00 PM" },
                                { day: "Friday", label: "Viernes", hours: "10:00 AM – 11:00 PM" },
                                { day: "Saturday", label: "Sábado", hours: "11:30 AM – 11:30 PM" },
                                { day: "Sunday", label: "Domingo", hours: "11:30 AM – 11:30 PM" },
                              ].map((schedule, index) => (
                                <View
                                  key={schedule.day}
                                  style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    paddingVertical: 8,
                                    borderBottomWidth: index < 6 ? 1 : 0,
                                    borderBottomColor: "#e0e0e0",
                                  }}
                                >
                                  <Text style={{ fontSize: 14, color: "#666" }}>{schedule.label}:</Text>
                                  <Text style={{ fontSize: 14, color: "#333", fontWeight: "500" }}>
                                    {schedule.hours}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        </ScrollView>
                      ) : (
                        <View style={{ flex: 1 }}>
                          <NativeViewGestureHandler ref={reviewsScrollRef} disallowInterruption>
                            <ScrollView
                              nestedScrollEnabled
                              keyboardShouldPersistTaps="handled"
                              keyboardDismissMode="on-drag"
                              contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                              showsVerticalScrollIndicator={false}
                            >
                              <View style={baseStyles.addReviewCard}>
                                <Text style={baseStyles.addReviewTitle}>Añadí tu reseña</Text>

                                <View style={baseStyles.addReviewStarsRow}>
                                  {renderStars(newReviewRating, setNewReviewRating, 32)}
                                  <Text style={baseStyles.addReviewHint}>{newReviewRating}/5</Text>
                                </View>

                                <TextInput
                                  placeholder="Contanos tu experiencia…"
                                  value={newReviewText}
                                  onChangeText={setNewReviewText}
                                  multiline
                                  style={baseStyles.addReviewInput}
                                />

                                {/* Etiquetas predefinidas (chips) */}
                                <View style={baseStyles.tagButtonsRow}>
                                  {TAG_OPTIONS.map((tag) => {
                                    const active = selectedReviewTags.includes(tag)
                                    return (
                                      <TouchableOpacity
                                        key={tag}
                                        onPress={() => toggleReviewTag(tag)}
                                        style={[baseStyles.tagChip, active && baseStyles.tagChipActive]}
                                        activeOpacity={0.8}
                                      >
                                        <Text
                                          style={[baseStyles.tagChipText, active && baseStyles.tagChipTextActive]}
                                          numberOfLines={1} // evita cortar en 2 líneas
                                          ellipsizeMode="clip"
                                        >
                                          {tag}
                                        </Text>
                                      </TouchableOpacity>
                                    )
                                  })}
                                </View>

                                <TouchableOpacity onPress={submitReview} style={baseStyles.addReviewButton}>
                                  <Text style={baseStyles.addReviewButtonText}>Publicar reseña</Text>
                                </TouchableOpacity>
                              </View>

                              {isLoadingReviews ? (
                                <View style={{ padding: 16, alignItems: "center" }}>
                                  <ActivityIndicator size="small" />
                                  <Text style={{ marginTop: 8, color: "#666" }}>Cargando reseñas…</Text>
                                </View>
                              ) : placeReviews.length === 0 ? (
                                <View style={baseStyles.emptyReviews}>
                                  <Ionicons name="document-text-outline" size={60} color="#ccc" />
                                  <Text style={baseStyles.emptyReviewsText}>Este lugar aún no tiene reseñas.</Text>
                                </View>
                              ) : (
                                <>
                                  {placeReviews.map((review) => (
                                    <View key={review.id} style={baseStyles.reviewCard}>
                                      <View style={baseStyles.reviewHeader}>
                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                          <Image
                                            source={{
                                              uri:
                                                review.user.profileImage ||
                                                "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                                            }}
                                            style={{ width: 36, height: 36, borderRadius: 18, marginRight: 8 }}
                                          />
                                          <View>
                                            <Text style={{ fontWeight: "bold", color: "#333" }}>
                                              {review.user.name}
                                            </Text>
                                            <Text style={{ fontSize: 12, color: "#999" }}>{review.date}</Text>
                                          </View>
                                        </View>
                                      </View>

                                      <View style={baseStyles.reviewRatingContainer}>
                                        {renderStarsStatic(review.rating)}
                                      </View>

                                      <Text style={baseStyles.reviewText}>{review.text}</Text>

                                      {review.tags?.length > 0 && (
                                        <View style={baseStyles.reviewTags}>
                                          {review.tags.map((tag, i) => (
                                            <View key={`${review.id}-tag-${i}`} style={baseStyles.reviewTag}>
                                              <Text style={baseStyles.reviewTagText}>{tag}</Text>
                                            </View>
                                          ))}
                                        </View>
                                      )}
                                    </View>
                                  ))}
                                </>
                              )}
                            </ScrollView>
                          </NativeViewGestureHandler>
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

const s = StyleSheet.create({
  searchWrap: { marginTop: 10 },
  container: { flex: 1, backgroundColor: "#feead8", marginTop: 0, },
  loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#feead8", color: "#fff" },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, backgroundColor: "#feead8", color: "#fff" },
  hiTitle: { fontSize: 22, fontWeight: "800", color: "#fff",},
  modeSwitch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: "#f2f2f2",
  },
  modeSwitchText: { fontSize: 13, fontWeight: "600" },
  searchBar: {
    marginTop: 30,
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
    marginTop:5,
    marginBottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#eee",
    marginLeft: 5,
  },
  filterChipActive: { backgroundColor: "#ff9500", borderColor: "#ff9500" },
  filterChipText: { fontSize: 13, color: "#333", fontWeight: "600" },
  filterChipTextActive: { color: "#fff" },
  /*sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 8,
  },*/
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  sectionAction: { color: "#ff9500", fontWeight: "700" },
  loadingBlock: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    marginTop: 15,
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
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
  logv("[v0] === getFilteredBadges DEBUG ===")
  logv("[v0] Input dietaryCategories:", dietaryCategories)
  logv("[v0] Input selectedFilters:", selectedFilters)

  if (!dietaryCategories || dietaryCategories.length === 0) {
    logv("[v0] No dietary categories available, returning empty array")
    return []
  }

  if (selectedFilters.length === 0) {
    logv("[v0] No filters selected (Recomendados mode), showing all badges")
    return dietaryCategories
  }

  const matchingCategories = dietaryCategories.filter((category) => {
    const categoryLower = category.toLowerCase()
    return selectedFilters.some((filter) => {
      const filterLower = filter.toLowerCase()
      let matches = false

      if (categoryLower.includes(filterLower)) {
        matches = true
      }

      if (
        (filterLower.includes("sin tacc") || filterLower.includes("tacc")) &&
        (categoryLower.includes("celiaco") || categoryLower.includes("celíaco"))
      ) {
        matches = true
      }

      if (
        (filterLower.includes("celiaco") || filterLower.includes("celíaco")) &&
        (categoryLower.includes("sin tacc") || filterLower.includes("tacc"))
      ) {
        matches = true
      }

      if (filterLower.includes("vegano") && categoryLower.includes("vegano")) {
        matches = true
      }

      if (filterLower.includes("vegetariano") && categoryLower.includes("vegetariano")) {
        matches = true
      }

      logv("[v0] Filter:", filter, "vs Category:", category, "-> Match:", matches)
      return matches
    })
  })

  logv("[v0] Final result:", matchingCategories)
  logv("[v0] === END DEBUG ===")
  return matchingCategories
}

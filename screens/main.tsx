import "react-native-get-random-values"
import { useEffect, useState, useRef } from "react"
import { Dimensions, StyleSheet, View,
  Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, FlatList, Animated,
} from "react-native"
import MapView, { PROVIDER_GOOGLE, Marker, type Camera } from "react-native-maps"
import * as Location from "expo-location"
import { FontAwesome, Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../types/navigation"
import { useAuth } from "../context/authContext"
import { v4 as uuidv4 } from "uuid"
import axios from "axios"

const { width, height } = Dimensions.get("window")
const GOOGLE_API_KEY = "AIzaSyAY3mAN-5CBIY6P68oJmXrGm0lx_Sawrb4"

interface Place {
  name: string
  rating: number
  user_ratings_total: number
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
}

export default function MainScreen() {
  const scrollX = useRef(new Animated.Value(0)).current
  const flatListRef = useRef<FlatList>(null)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { user } = useAuth()
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null)
  const [places, setPlaces] = useState<Place[]>([])
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [searchText, setSearchText] = useState("")
  const [predictions, setPredictions] = useState<any[]>([])
  const [selectedDistance, setSelectedDistance] = useState<number | null>(null)
  const [hasSelectedPrediction, setHasSelectedPrediction] = useState(false)
  const mapRef = useRef<MapView>(null)
  const markerPressRef = useRef(false)
  const ITEM_WIDTH = Dimensions.get("window").width * 0.8
  const SPACING = 10
  const [nearbyPlacesList, setNearbyPlacesList] = useState<Place[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const swipeStartX = useRef(0)
  const [visibleCards, setVisibleCards] = useState<Place[]>([])
  const isFirstSelectionRef = useRef(true)

  // Sort places by distance from user's location
  const getSortedPlacesByUserLocation = (): Place[] => {
    if (!places.length || !location) return []

    return [...places].sort((a, b) => {
      const distA = calculateDistance(
        location.latitude,
        location.longitude,
        a.geometry.location.lat,
        a.geometry.location.lng,
      )
      const distB = calculateDistance(
        location.latitude,
        location.longitude,
        b.geometry.location.lat,
        b.geometry.location.lng,
      )
      return distA - distB
    })
  }

  useEffect(() => {
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Se necesita acceso a la ubicación para usar esta función.")
        return
      }
      const currentLocation = await Location.getCurrentPositionAsync({})
      setLocation(currentLocation.coords)
    })()

    const showSubscription = Keyboard.addListener("keyboardDidShow", () => setIsKeyboardVisible(true))
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => setIsKeyboardVisible(false))

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

  // Update visible cards whenever the current index changes
  useEffect(() => {
    if (nearbyPlacesList.length > 0) {
      updateVisibleCards(currentIndex)
    }
  }, [currentIndex, nearbyPlacesList])

  // Function to update the three visible cards
  const updateVisibleCards = (index: number) => {
    if (nearbyPlacesList.length === 0) return

    const totalPlaces = nearbyPlacesList.length

    // Calculate previous index with loop
    const prevIndex = index === 0 ? totalPlaces - 1 : index - 1

    // Calculate next index with loop
    const nextIndex = index === totalPlaces - 1 ? 0 : index + 1

    // Create array with previous, current, and next places
    const cards = [nearbyPlacesList[prevIndex], nearbyPlacesList[index], nearbyPlacesList[nextIndex]]

    setVisibleCards(cards)
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (value: number) => (value * Math.PI) / 180
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const centerMapOnUser = async () => {
    const currentLocation = await Location.getCurrentPositionAsync({})
    setLocation(currentLocation.coords)
    mapRef.current?.animateToRegion({
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    })
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
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000,
    )
  }

  // Reset the map to initial state
  const resetMap = () => {
    setPlaces([])
    setSelectedPlace(null)
    setNearbyPlacesList([])
    setVisibleCards([])
    setPredictions([]) // Clear predictions when resetting the map

    // Center map on user's location
    if (location) {
      mapRef.current?.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      })
    }
  }

  // Navigate to the next or previous place
  const navigateToPlace = (direction: "next" | "prev") => {
    if (!nearbyPlacesList.length || isScrolling) return

    setIsScrolling(true)

    let newIndex = currentIndex

    if (direction === "next") {
      // If at the end, go to the beginning (closest place)
      newIndex = currentIndex === nearbyPlacesList.length - 1 ? 0 : currentIndex + 1
    } else {
      // If at the beginning, go to the end (furthest place)
      newIndex = currentIndex === 0 ? nearbyPlacesList.length - 1 : currentIndex - 1
    }

    setCurrentIndex(newIndex)
    const place = nearbyPlacesList[newIndex]
    setSelectedPlace(place)
    centerMapOnPlace(place)

    // Reset the FlatList to show the middle card with a consistent position
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: 1,
        animated: false,
        viewPosition: 0.5,
      })

      // Reset scrolling state after animation completes
      setTimeout(() => {
        setIsScrolling(false)
      }, 200)
    }, 50)
  }

  const handleScrollBegin = (event: any) => {
    swipeStartX.current = event.nativeEvent.contentOffset.x
  }

  const handleScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x
    const viewSize = ITEM_WIDTH + SPACING * 2
    const index = Math.round(offsetX / viewSize)

    // Determine if we need to navigate
    if (index === 0) {
      // Swiped to previous
      navigateToPlace("prev")
    } else if (index === 2) {
      // Swiped to next
      navigateToPlace("next")
    }

    // Always reset to center position after scrolling
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: 1,
        animated: false,
        viewPosition: 0.5,
      })
    }, 10)
  }

  const handleSearch = async () => {
    // If search text is empty, reset the map to initial state
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
    isFirstSelectionRef.current = true

    try {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/place/textsearch/json`, {
        params: {
          query: searchText,
          location: `${location.latitude},${location.longitude}`,
          radius: 5000,
          key: GOOGLE_API_KEY,
        },
      })

      // Clear any previously selected place
      setSelectedPlace(null)

      // Set the places from search results
      setPlaces(response.data.results)

      // Sort places by distance from user and set the list
      const sortedPlaces = getSortedPlacesByUserLocation()
      setNearbyPlacesList(sortedPlaces)

      // If we have results, adjust the map to show all markers
      if (sortedPlaces.length > 0) {
        // Don't automatically select the first place
        // Just center the map to show all markers
        if (location && sortedPlaces.length > 0) {
          // Find the average position of all places to center the map
          let sumLat = 0
          let sumLng = 0
          let maxDist = 0

          sortedPlaces.forEach((place) => {
            sumLat += place.geometry.location.lat
            sumLng += place.geometry.location.lng

            // Calculate distance from user to determine zoom level
            const dist = calculateDistance(
              location.latitude,
              location.longitude,
              place.geometry.location.lat,
              place.geometry.location.lng,
            )

            if (dist > maxDist) maxDist = dist
          })

          const avgLat = sumLat / sortedPlaces.length
          const avgLng = sumLng / sortedPlaces.length

          // Adjust delta based on the maximum distance
          const delta = Math.min(0.05, Math.max(0.01, maxDist * 0.05))

          mapRef.current?.animateToRegion({
            latitude: avgLat,
            longitude: avgLng,
            latitudeDelta: delta,
            longitudeDelta: delta,
          })
        }
      }
    } catch (error) {
      Alert.alert("Error", "No se pudieron obtener los resultados de búsqueda")
    }
  }

  const handleAutocomplete = async (query: string) => {
    if (!query) {
      setPredictions([])
      return
    }
    const { latitude, longitude } = location || { latitude: 0, longitude: 0 }
    try {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/place/autocomplete/json`, {
        params: {
          input: query,
          location: `${latitude},${longitude}`,
          radius: 5000,
          key: GOOGLE_API_KEY,
        },
      })
      setPredictions(response.data.predictions)
    } catch (error) {
      Alert.alert("Error", "No se pudieron obtener las predicciones")
    }
  }

  const handleSelectPlace = (place: Place) => {
    markerPressRef.current = true
    setSelectedPlace(place)

    // Sort places by distance from user's location
    const sortedPlaces = getSortedPlacesByUserLocation()
    setNearbyPlacesList(sortedPlaces)
    centerMapOnPlace(place)

    // Find the index of the selected place in the sorted list
    const index = sortedPlaces.findIndex(
      (p: Place) =>
        p.geometry.location.lat === place.geometry.location.lat &&
        p.geometry.location.lng === place.geometry.location.lng,
    )

    if (index >= 0) {
      setCurrentIndex(index)

      // Use a longer delay for the first selection
      const delay = isFirstSelectionRef.current ? 300 : 50

      // Wait for the visible cards to update before scrolling
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: 1, // Always scroll to the middle card
          animated: false,
          viewPosition: 0.5,
        })

        // Try a second scroll after a short delay to ensure it's centered
        if (isFirstSelectionRef.current) {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: 1,
              animated: false,
              viewPosition: 0.5,
            })
            isFirstSelectionRef.current = false
          }, 200)
        }
      }, delay)
    }
  }

  const handleSelectPrediction = async (prediction: any) => {
    setSearchText(prediction.description)
    setPredictions([])
    setHasSelectedPrediction(true)

    try {
      const detailResponse = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json`, {
        params: {
          place_id: prediction.place_id,
          key: GOOGLE_API_KEY,
        },
      })

      const result = detailResponse.data.result
      const place: Place = {
        name: result.name,
        rating: result.rating || 0,
        user_ratings_total: result.user_ratings_total || 0,
        geometry: {
          location: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
          },
        },
      }

      setPlaces([place])
      handleSelectPlace(place)

      mapRef.current?.animateToRegion({
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      })
    } catch (error) {
      Alert.alert("Error", "No se pudo obtener la información del lugar")
    }
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={StyleSheet.absoluteFillObject}
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
                  setSelectedPlace(null)
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
              <View style={styles.searchBar}>
                <FontAwesome name="search" size={18} color="gray" style={{ marginLeft: 10 }} />
                <TextInput
                  placeholder="Buscar..."
                  placeholderTextColor="gray"
                  style={styles.searchInput}
                  value={searchText}
                  onChangeText={(text) => {
                    setSearchText(text)

                    // If text is cleared, reset the map and clear predictions
                    if (!text || text.trim() === "") {
                      resetMap()
                      setPredictions([]) // Explicitly clear predictions
                    } else {
                      // Only fetch autocomplete if there's text
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

              <View style={styles.filters}>
                {["Localidad", "Limitación", "Precio", "Local"].map((filter) => (
                  <TouchableOpacity key={uuidv4()} style={styles.filterButton}>
                    <Text style={styles.filterText}>{filter}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedPlace && !isKeyboardVisible && (
              <View style={styles.carouselContainer}>
                {visibleCards.length > 0 && (
                  <FlatList
                    ref={flatListRef}
                    horizontal
                    data={visibleCards}
                    keyExtractor={(item, index) =>
                      `${item.geometry.location.lat}-${item.geometry.location.lng}-${index}`
                    }
                    initialScrollIndex={1}
                    getItemLayout={(data, index) => ({
                      length: ITEM_WIDTH + SPACING * 2,
                      offset: (ITEM_WIDTH + SPACING * 2) * index,
                      index,
                    })}
                    renderItem={({ item, index }) => {
                      const isSelected = index === 1 // Middle card is selected
                      return (
                        <TouchableOpacity
                          onPress={() => {
                            if (index === 0) {
                              // Left card - navigate to previous
                              navigateToPlace("prev")
                            } else if (index === 2) {
                              // Right card - navigate to next
                              navigateToPlace("next")
                            }
                          }}
                          style={[
                            styles.carouselCard,
                            isSelected ? styles.carouselCardSelected : styles.carouselCardNotSelected,
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
                      )
                    }}
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={ITEM_WIDTH + SPACING * 2}
                    snapToAlignment="center"
                    decelerationRate="fast"
                    contentContainerStyle={{
                      paddingHorizontal: (width - ITEM_WIDTH) / 2 - SPACING, // This centers the cards properly
                    }}
                    onScrollBeginDrag={handleScrollBegin}
                    onMomentumScrollEnd={handleScrollEnd}
                    pagingEnabled={true}
                    onScrollToIndexFailed={(info) => {
                      const wait = new Promise((resolve) => setTimeout(resolve, 500))
                      wait.then(() => {
                        flatListRef.current?.scrollToIndex({
                          index: 1,
                          animated: false,
                          viewPosition: 0.5,
                        })
                      })
                    }}
                  />
                )}

                {/* Navigation buttons for the carousel */}
                <View style={styles.carouselNavigation}>
                  <TouchableOpacity style={styles.carouselNavButton} onPress={() => navigateToPlace("prev")}>
                    <Ionicons name="chevron-back" size={24} color="#ff9500" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.carouselNavButton} onPress={() => navigateToPlace("next")}>
                    <Ionicons name="chevron-forward" size={24} color="#ff9500" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {!isKeyboardVisible && (
        <View style={styles.bottomNav}>
          <TouchableOpacity onPress={() => navigation.navigate("Main")}>
            <FontAwesome name="home" size={28} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Favorites")}>
            <FontAwesome name="heart" size={28} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (user) {
                navigation.navigate("Profile", {
                  username: user.username,
                  email: user.email,
                })
              } else {
                navigation.navigate("Login")
              }
            }}
          >
            <FontAwesome name="user" size={28} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ff9500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    position: "absolute",
    top: height * 0.07,
    width: "100%",
    alignItems: "center",
  },
  searchBar: {
    backgroundColor: "white",
    borderRadius: width * 0.03,
    flexDirection: "row",
    alignItems: "center",
    width: width * 0.9,
    height: height * 0.05,
    marginBottom: height * 0.01,
  },
  searchInput: {
    flex: 1,
    marginLeft: width * 0.02,
    color: "#000",
  },
  filters: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    paddingHorizontal: width * 0.025,
  },
  filterButton: {
    backgroundColor: "white",
    borderRadius: width * 0.03,
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.008,
    marginHorizontal: width * 0.01,
  },
  filterText: {
    fontSize: width * 0.032,
    color: "#000",
  },
  shadowOverlay: {
    position: "absolute",
    bottom: height * 0.074,
    width: "100%",
    height: height * 0.004,
    backgroundColor: "#000",
    opacity: 0.5,
    zIndex: 9,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    height: height * 0.075,
    width: "100%",
    backgroundColor: "#ff9500",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderColor: "#eee",
    zIndex: 10,
  },
  predictionList: {
    backgroundColor: "white",
    width: width * 0.9,
    maxHeight: height * 0.25,
    borderRadius: width * 0.02,
    marginTop: height * 0.01,
    marginBottom: height * 0.01,
    position: "absolute",
    top: height * 0.12,
    zIndex: 999,
    elevation: 5,
  },
  predictionItem: {
    padding: height * 0.013,
  },
  predictionText: {
    fontSize: width * 0.042,
    color: "#000",
  },
  floatingButtons: {
    position: "absolute",
    bottom: height * 0.1,
    right: width * 0.05,
    flexDirection: "column",
    alignItems: "flex-end",
    gap: height * 0.015,
  },
  floatButton: {
    backgroundColor: "#ff9500",
    padding: height * 0.012,
    borderRadius: 50,
    elevation: 3,
  },
  placeCard: {
    position: "absolute",
    height: height * 0.15,
    bottom: height * 0.115,
    left: width * 0.1,
    right: width * 0.1,
    backgroundColor: "white",
    borderRadius: width * 0.04,
    padding: width * 0.04,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10,
  },
  placeName: {
    fontSize: width * 0.045,
    fontWeight: "bold",
    marginTop: height * -0.006,
    marginBottom: height * 0.004,
  },
  placeRating: {
    fontSize: width * 0.035,
    color: "#333",
    marginBottom: height * 0.001,
  },
  placeDistance: {
    fontSize: width * 0.035,
    color: "#333",
    marginBottom: height * 0.01,
  },
  carouselContainer: {
    position: "absolute",
    bottom: height * 0.115,
    height: height * 0.18,
    width: "100%",
    alignItems: "center", // Add this to center the FlatList
  },
  carouselCard: {
    width: width * 0.75,
    backgroundColor: "white",
    marginHorizontal: 8,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    justifyContent: "center",
  },
  carouselCardSelected: {
    borderColor: "#ff9500",
    borderWidth: 2,
  },
  carouselCardNotSelected: {
    borderWidth: 0,
    transform: [{ scale: 1 }],
  },
  badges: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  carouselNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    top: height * 0.07,
    left: width * 0.05,
    right: width * 0.05,
    zIndex: 10,
  },
  carouselNavButton: {
    backgroundColor: "white",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  badge: {
    backgroundColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
  },
})

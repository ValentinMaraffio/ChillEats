"use client"

import "react-native-get-random-values"
import { useEffect, useState, useRef } from "react"
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
import { useKeyboardVisibility } from "../../hooks/useKeyboardVisibility" //Agregar esto cuando se use el teclado

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
  const ITEM_WIDTH = Dimensions.get("window").width * 0.8
  const SPACING = 10
  const [nearbyPlacesList, setNearbyPlacesList] = useState<Place[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const swipeStartX = useRef(0)
  const [visibleCards, setVisibleCards] = useState<Place[]>([])
  const isFirstSelectionRef = useRef(true)

  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const bottomSheetPosition = useRef(new Animated.Value(height)).current
  const currentPositionRef = useRef(height)
  const bottomSheetHeight = height * 0.6 
  const snapPoints = {
    top: height * 0.2, 
    bottom: height, 
  }
  


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
        // Only allow dragging down from the expanded position or up from the collapsed position
        const newPosition = snapPoints.top + gestureState.dy
        if (newPosition >= snapPoints.top && newPosition <= snapPoints.bottom) {
          bottomSheetPosition.setValue(newPosition)
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Determine whether to snap to top or bottom
        if (gestureState.vy > 0.5 || (gestureState.dy > 50 && gestureState.vy > 0)) {
          // Swipe down - close the sheet
          closeBottomSheet()
        } else if (gestureState.vy < -0.5 || (gestureState.dy < -50 && gestureState.vy < 0)) {
          // Swipe up - expand the sheet
          expandBottomSheet()
        } else {
          // Based on current position
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

  // Function to show and expand the bottom sheet
  const showAndExpandBottomSheet = () => {
    setShowBottomSheet(true)
    Animated.spring(bottomSheetPosition, {
      toValue: snapPoints.top,
      useNativeDriver: true,
      bounciness: 4,
    }).start()
  }

  // Function to expand the bottom sheet
  const expandBottomSheet = () => {
    Animated.spring(bottomSheetPosition, {
      toValue: snapPoints.top,
      useNativeDriver: true,
      bounciness: 4,
    }).start()
  }

  // Function to close the bottom sheet
  const closeBottomSheet = () => {
    Animated.timing(bottomSheetPosition, {
      toValue: snapPoints.bottom,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowBottomSheet(false)
    })
  }

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
    setShowBottomSheet(false) // Close bottom sheet when resetting

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

    const results = await searchPlaces(searchText, location)

    // Clear any previously selected place
    setSelectedPlace(null)

    // Close bottom sheet if open
    if (showBottomSheet) {
      closeBottomSheet()
    }

    // Set the places from search results
    setPlaces(results)

    // Sort places by distance from user and set the list
    const sortedPlaces = sortPlacesByDistance(results, location)
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
    setSelectedPlace(place)

    // Close bottom sheet if open
    if (showBottomSheet) {
      closeBottomSheet()
    }

    // Sort places by distance from user's location
    const sortedPlaces = sortPlacesByDistance(places, location)
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

    const place = await getPlaceDetails(prediction.place_id)

    if (place) {
      setPlaces([place])
      handleSelectPlace(place)

      mapRef.current?.animateToRegion({
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      })
    }
  }

  // Handle tap on the selected card (middle card)
  const handleSelectedCardPress = () => {
    if (selectedPlace) {
      showAndExpandBottomSheet()
    }
  }

  // Toggle favorite status for a place
  const toggleFavorite = (place: Place) => {
    if (isFavorite(place)) {
      removeFavorite(place)
      Alert.alert("Eliminado", "El lugar ha sido eliminado de tus favoritos")
    } else {
      addFavorite(place)
      Alert.alert("Agregado", "El lugar ha sido agregado a tus favoritos")
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
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setPredictions([]); }}>
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
                  setSelectedPlace(null)
                  if (showBottomSheet) {
                    closeBottomSheet()
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

            {selectedPlace && !isKeyboardVisible && !showBottomSheet && (
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
                            } else if (isSelected) {
                              // Middle card - show bottom sheet
                              handleSelectedCardPress()
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

                      {/* Additional content can be added here */}
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

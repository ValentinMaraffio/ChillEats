import 'react-native-get-random-values';
import React, { useEffect, useState, useRef } from 'react';
import { Dimensions } from 'react-native';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, FlatList, 
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Camera } from 'react-native-maps';
import * as Location from 'expo-location';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const { width, height } = Dimensions.get('window');
const GOOGLE_API_KEY = 'AIzaSyAY3mAN-5CBIY6P68oJmXrGm0lx_Sawrb4';

interface Place {
  name: string;
  rating: number;
  user_ratings_total: number;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export default function MainScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [searchText, setSearchText] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [selectedDistance, setSelectedDistance] = useState<number | null>(null);
  const [hasSelectedPrediction, setHasSelectedPrediction] = useState(false);
  const mapRef = useRef<MapView>(null);
  const markerPressRef = useRef(false); 

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación para usar esta función.');
        return;
      }
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
    })();
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const centerMapOnUser = async () => {
    let currentLocation = await Location.getCurrentPositionAsync({});
    setLocation(currentLocation.coords);
    mapRef.current?.animateToRegion({
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const faceNorth = () => {
    if (!location || !mapRef.current) return;
    const camera: Partial<Camera> = { heading: 0 };
    mapRef.current.animateCamera(camera as Camera, { duration: 1000 });
  };

  const handleSearch = async () => {
    if (!searchText || !location) return;
    if (hasSelectedPrediction) {
      setHasSelectedPrediction(false);
      return;
    }

    try {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/place/textsearch/json`, {
        params: {
          query: searchText,
          location: `${location.latitude},${location.longitude}`,
          radius: 5000,
          key: GOOGLE_API_KEY,
        },
      });
      setPlaces(response.data.results);
      setSelectedPlace(null);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron obtener los resultados de búsqueda');
    }
  };

  const handleAutocomplete = async (query: string) => {
    if (!query) {
      setPredictions([]);
      return;
    }
    const { latitude, longitude } = location || { latitude: 0, longitude: 0 };
    try {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/place/autocomplete/json`, {
        params: {
          input: query,
          location: `${latitude},${longitude}`,
          radius: 5000,
          key: GOOGLE_API_KEY,
        },
      });
      setPredictions(response.data.predictions);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron obtener las predicciones');
    }
  };

  const handleSelectPrediction = async (prediction: any) => {
    setSearchText(prediction.description);
    setPredictions([]);
    setHasSelectedPrediction(true);

    try {
      const detailResponse = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json`, {
        params: {
          place_id: prediction.place_id,
          key: GOOGLE_API_KEY,
        },
      });

      const result = detailResponse.data.result;
      const place: Place = {
        name: result.name,
        rating: result.rating,
        user_ratings_total: result.user_ratings_total,
        geometry: {
          location: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
          },
        },
      };

      setPlaces([place]);
      setSelectedPlace(place);

      mapRef.current?.animateToRegion({
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la información del lugar');
    }
  };

  const handleSelectPlace = (place: Place) => {
    markerPressRef.current = true; // <- NUEVO

    if (location) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        place.geometry.location.lat,
        place.geometry.location.lng
      );
      setSelectedDistance(distance);
    }
    setSelectedPlace(place);
  };

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff9500" />
        <Text style={{ marginTop: 10 }}>Cargando ubicación...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
                  markerPressRef.current = false;
                } else {
                  setSelectedPlace(null); // <- Oculta la tarjeta
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

            <View style={styles.floatingButtons}>
              <TouchableOpacity onPress={centerMapOnUser} style={styles.floatButton}>
                <Ionicons name="locate" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={faceNorth} style={styles.floatButton}>
                <Ionicons name="compass" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <FontAwesome name="search" size={18} color="gray" style={{ marginLeft: 10 }} />
                <TextInput
                  placeholder="Buscar..."
                  placeholderTextColor="gray"
                  style={styles.searchInput}
                  value={searchText}
                  onChangeText={(text) => {
                    setSearchText(text);
                    handleAutocomplete(text);
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
                {['Localidad', 'Limitación', 'Precio', 'Local'].map((filter) => (
                  <TouchableOpacity key={uuidv4()} style={styles.filterButton}>
                    <Text style={styles.filterText}>{filter}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedPlace && (
              <View style={styles.placeCard}>
                <Text style={styles.placeName}>{selectedPlace.name}</Text>
                <Text style={styles.placeRating}>⭐ {selectedPlace.rating} ({selectedPlace.user_ratings_total} reseñas)</Text>
                {selectedDistance && (
                  <Text style={styles.placeDistance}>🚶 {selectedDistance.toFixed(1)} km</Text>
                )}
                <View style={styles.badges}>
                  <Text style={styles.badge}>Celiaco</Text>
                  <Text style={styles.badge}>Vegetariano</Text>
                </View>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <View style={styles.shadowOverlay} />

      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <FontAwesome name="home" size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Favorites')}>
          <FontAwesome name="heart" size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <FontAwesome name="user" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff9500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    position: 'absolute',
    top: height * 0.07,
    width: '100%',
    alignItems: 'center',
  },
  searchBar: {
    backgroundColor: 'white',
    borderRadius: width * 0.03,
    flexDirection: 'row',
    alignItems: 'center',
    width: width * 0.9,
    height: height * 0.05,
    marginBottom: height * 0.01,
  },
  searchInput: {
    flex: 1,
    marginLeft: width * 0.02,
    color: '#000',
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingHorizontal: width * 0.025,
  },
  filterButton: {
    backgroundColor: 'white',
    borderRadius: width * 0.03,
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.008,
    marginHorizontal: width * 0.01,
  },
  filterText: {
    fontSize: width * 0.032,
    color: '#000',
  },
  shadowOverlay: {
    position: 'absolute',
    bottom: height * 0.074,
    width: '100%',
    height: height * 0.004,
    backgroundColor: '#000',
    opacity: 0.5,
    zIndex: 9,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    height: height * 0.075,
    width: '100%',
    backgroundColor: '#ff9500',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderColor: '#eee',
    zIndex: 10,
  },
  predictionList: {
    backgroundColor: 'white',
    width: width * 0.9,
    maxHeight: height * 0.25,
    borderRadius: width * 0.02,
    marginTop: height * 0.01,
    marginBottom: height * 0.01,
    position: 'absolute',
    top: height * 0.12,
    zIndex: 999,
    elevation: 5,
  },
  predictionItem: {
    padding: height * 0.012,
  },
  predictionText: {
    fontSize: width * 0.042,
    color: '#000',
  },
  floatingButtons: {
    position: 'absolute',
    bottom: height * 0.1,
    right: width * 0.05,
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: height * 0.015,
  },
  floatButton: {
    backgroundColor: '#ff9500',
    padding: height * 0.012,
    borderRadius: 50,
    elevation: 3,
  },
  placeCard: {
    position: 'absolute',
    height: height * 0.15,
    bottom: height * 0.115,
    left: width * 0.1,
    right: width * 0.1,
    backgroundColor: 'white',
    borderRadius: width * 0.04,
    padding: width * 0.04,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10,
  },
  placeName: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    marginBottom: height * 0.005,
  },
  placeRating: {
    fontSize: width * 0.035,
    color: '#333',
  },
  placeDistance: {
    fontSize: width * 0.035,
    color: '#333',
    marginBottom: height * 0.01,
  },
  badges: {
    flexDirection: 'row',
    gap: width * 0.02,
  },
  badge: {
    bottom: -height * 0.012,
    backgroundColor: '#ff9500',
    color: 'white',
    borderRadius: width * 0.05,
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.005,
    fontSize: width * 0.04,
  },
});



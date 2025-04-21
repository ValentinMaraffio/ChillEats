import 'react-native-get-random-values';
import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
} from 'react-native';

import MapView, { PROVIDER_GOOGLE, Marker, Camera } from 'react-native-maps';
import * as Location from 'expo-location';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const GOOGLE_API_KEY = 'AIzaSyAY3mAN-5CBIY6P68oJmXrGm0lx_Sawrb4';

interface Place {
  name: string;
  formatted_address: string;
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
  const [searchText, setSearchText] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const mapRef = useRef<MapView>(null);

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

    // Solo orientamos el mapa hacia el norte (sin zoom ni cambios en la posición)
    const camera: Partial<Camera> = {
      heading: 0, // Apunta al norte
    };

    mapRef.current.animateCamera(camera as Camera, { duration: 1000 });
  };

  const handleSearch = async () => {
    if (!searchText || !location) return;

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

  const handleSelectPrediction = (place: any) => {
    setSearchText(place.description);
    setPredictions([]);
    handleSearch();
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
            >
              {places.map((place) => (
                <Marker
                  key={uuidv4()}
                  coordinate={{
                    latitude: place.geometry.location.lat,
                    longitude: place.geometry.location.lng,
                  }}
                  title={place.name}
                  description={place.formatted_address}
                />
              ))}
            </MapView>

            {/* Botón de localización */}
            <View style={styles.floatingButtons}>
              <TouchableOpacity onPress={centerMapOnUser} style={styles.floatButton}>
                <Ionicons name="locate" size={24} color="#fff" />
              </TouchableOpacity>
              {/* Botón brújula */}
              <TouchableOpacity onPress={faceNorth} style={styles.floatButton}>
                <Ionicons name="compass" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Buscador */}
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
  container: { flex: 1, backgroundColor: '#ff9500' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    position: 'absolute',
    top: 60,
    width: '100%',
    alignItems: 'center',
  },
  searchBar: {
    backgroundColor: 'white',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    height: 40,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#000',
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingHorizontal: 10,
  },
  filterButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 2,
  },
  filterText: {
    fontSize: 12,
    color: '#000',
  },
  shadowOverlay: {
    position: 'absolute',
    bottom: 59,
    width: '100%',
    height: 3,
    backgroundColor: '#000',
    opacity: 0.5,
    zIndex: 9,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    height: 60,
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
    width: '90%',
    maxHeight: 200,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
    position: 'absolute',
    top: 100,
    zIndex: 999,
    elevation: 5,
  },
  predictionItem: {
    padding: 10,
  },
  predictionText: {
    fontSize: 16,
    color: '#000',
  },
  floatingButtons: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 10,
  },
  floatButton: {
    backgroundColor: '#ff9500',
    padding: 10,
    borderRadius: 50,
    elevation: 3,
  },
});

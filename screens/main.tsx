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
} from 'react-native';

import MapView, { PROVIDER_GOOGLE, Marker, Camera } from 'react-native-maps';
import * as Location from 'expo-location';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../index';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const FOURSQUARE_API_KEY = 'fsq3bibV5tONj9yyajOVMfaC4QuK6v6ATNZ3o2DvIRV2bhU=';

// Definimos el tipo para los lugares de comida
interface FoodPlace {
  fsq_id: string;
  name: string;
  location: {
    formatted_address: string;
  };
  geocodes: {
    main: {
      latitude: number;
      longitude: number;
    };
  };
}

export default function MainScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [foodPlaces, setFoodPlaces] = useState<FoodPlace[]>([]);
  const [nextPage, setNextPage] = useState<string | null>(null);
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

      fetchFoodPlaces(currentLocation.coords.latitude, currentLocation.coords.longitude);
    })();
  }, []);

  const fetchFoodPlaces = async (latitude: number, longitude: number, nextPageUrl: string | null = null) => {
    try {
      const response = await fetch(
        nextPageUrl ||
          `https://api.foursquare.com/v3/places/search?ll=${latitude},${longitude}&categories=13065&radius=3000&limit=50`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: FOURSQUARE_API_KEY,
          },
        }
      );

      if (response.status === 401) {
        Alert.alert(
          'Error de Autenticación',
          'El token de autenticación es inválido o ha expirado. Por favor revisa tu clave de API.'
        );
        return;
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        Alert.alert(
          'Sin resultados',
          'No se encontraron restaurantes cercanos en un radio de 3km.'
        );
      }

      // Agregar los nuevos lugares a la lista existente
      setFoodPlaces((prevPlaces) => [...prevPlaces, ...data.results]);

      // Si hay una página siguiente, configurar el siguiente URL de la paginación
      setNextPage(data.next_page || null);
    } catch (error) {
      console.error('Error al obtener lugares de comida:', error);
    }
  };

  const loadMorePlaces = () => {
    if (nextPage) {
      fetchFoodPlaces(location?.latitude || 0, location?.longitude || 0, nextPage);
    }
  };

  const centerMapOnUser = async () => {
    if (location && mapRef.current) {
      const camera: Camera = {
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        pitch: 0,
        heading: 0,
        zoom: 16,
        altitude: 0,
      };
      mapRef.current.animateCamera(camera, { duration: 1000 });
    }
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
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation={true}
              showsMyLocationButton={false}
            >
              {foodPlaces.map((place, index) => (
                <Marker
                  key={`${place.fsq_id}-${index}`} // Se asegura de que la clave sea única
                  coordinate={{
                    latitude: place.geocodes.main.latitude,
                    longitude: place.geocodes.main.longitude,
                  }}
                  title={place.name}
                  description={place.location.formatted_address}
                />
              ))}
            </MapView>

            {/* Botón para centrar en el usuario */}
            <TouchableOpacity
              style={styles.centerButton}
              onPress={centerMapOnUser}
            >
              <Ionicons name="locate" size={24} color="#ff9500" />
            </TouchableOpacity>

            {/* Buscador y filtros */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <FontAwesome name="search" size={18} color="gray" style={{ marginLeft: 10 }} />
                <TextInput
                  placeholder="Buscar..."
                  placeholderTextColor="gray"
                  style={styles.searchInput}
                />
                <Ionicons name="location-sharp" size={20} color="gray" style={{ marginRight: 10 }} />
              </View>

              <View style={styles.filters}>
                {['Localidad', 'Limitación', 'Precio', 'Local'].map((filter, index) => (
                  <TouchableOpacity key={index} style={styles.filterButton}>
                    <Text style={styles.filterText}>{filter}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Botón para cargar más lugares si hay más resultados */}
            {nextPage && (
              <TouchableOpacity style={styles.loadMoreButton} onPress={loadMorePlaces}>
                <Text style={styles.loadMoreText}>Cargar más</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Sombra falsa hacia arriba */}
      <View style={styles.shadowOverlay} />

      {/* Barra inferior */}
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
  centerButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 11,
  },
  loadMoreButton: {
    position: 'absolute',
    bottom: 130,
    left: '50%',
    marginLeft: -50,
    backgroundColor: '#ff9500', // Color del botón "Cargar más"
    padding: 12,
    borderRadius: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 11,
  },
  loadMoreText: {
    color: 'white',
    fontSize: 16,
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
});

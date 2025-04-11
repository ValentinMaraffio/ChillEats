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
  Keyboard 
} from 'react-native';

import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../index';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function App() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [location, setLocation] = useState(null);
  const mapRef = useRef(null);

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
            />

            <Ionicons name="locate" size={24} color="#ff9500" />

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
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Barra inferior */}
      <View style={styles.bottomNav}>
  <TouchableOpacity onPress={() => navigation.navigate('Main')}>
    <FontAwesome name="home" size={28} color="white" />
  </TouchableOpacity>

  <TouchableOpacity onPress={() => alert('Buscar')}>
    <FontAwesome name="heart" size={28} color="white" />
  </TouchableOpacity>

  <TouchableOpacity onPress={() => navigation.navigate('Register')}>
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
  },
});

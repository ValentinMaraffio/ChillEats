import axios from "axios"
import * as Location from "expo-location"
import { Alert } from "react-native"

// Constants
export const GOOGLE_API_KEY = "AIzaSyAY3mAN-5CBIY6P68oJmXrGm0lx_Sawrb4"

// Interfaces
export interface Place {
  place_id?: string
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

// Helper functions
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRad = (value: number) => (value * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Location services
export const getCurrentLocation = async (): Promise<Location.LocationObjectCoords | null> => {
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== "granted") {
    Alert.alert("Permiso denegado", "Se necesita acceso a la ubicación para usar esta función.")
    return null
  }
  const currentLocation = await Location.getCurrentPositionAsync({})
  return currentLocation.coords
}

// API services
export const searchPlaces = async (searchText: string, location: Location.LocationObjectCoords): Promise<Place[]> => {
  if (!searchText || !searchText.trim() || !location) return []

  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/place/textsearch/json`, {
      params: {
        query: searchText,
        location: `${location.latitude},${location.longitude}`,
        radius: 5000,
        key: GOOGLE_API_KEY,
      },
    })
    return response.data.results
  } catch (error) {
    Alert.alert("Error", "No se pudieron obtener los resultados de búsqueda")
    return []
  }
}

export const getPlaceAutocomplete = async (query: string, location: Location.LocationObjectCoords): Promise<any[]> => {
  if (!query || !location) return []

  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/place/autocomplete/json`, {
      params: {
        input: query,
        location: `${location.latitude},${location.longitude}`,
        radius: 5000,
        key: GOOGLE_API_KEY,
      },
    })
    return response.data.predictions
  } catch (error) {
    Alert.alert("Error", "No se pudieron obtener las predicciones")
    return []
  }
}

export const getPlaceDetails = async (placeId: string): Promise<Place | null> => {
  try {
    const detailResponse = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json`, {
      params: {
        place_id: placeId,
        key: GOOGLE_API_KEY,
      },
    })

    const result = detailResponse.data.result
    return {
      place_id: placeId,
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
  } catch (error) {
    Alert.alert("Error", "No se pudo obtener la información del lugar")
    return null
  }
}

// Sorting and data processing
export const sortPlacesByDistance = (places: Place[], userLocation: Location.LocationObjectCoords | null): Place[] => {
  if (!places.length || !userLocation) return []

  return [...places].sort((a, b) => {
    const distA = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      a.geometry.location.lat,
      a.geometry.location.lng,
    )
    const distB = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      b.geometry.location.lat,
      b.geometry.location.lng,
    )
    return distA - distB
  })
}

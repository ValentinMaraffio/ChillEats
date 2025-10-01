import axios from "axios"
import * as Location from "expo-location"
import { Alert } from "react-native"

// Constants
export const GOOGLE_API_KEY = "AIzaSyAf_jsZw6lt89DiMQ2pG_fwl8ckq24pRAU"

// Interfaces
export interface Place {
  place_id: string;
  name: string;
  geometry: { location: { lat: number; lng: number } };
  rating?: number;
  user_ratings_total?: number;
  vicinity?: string;
  formatted_address?: string;   // ⬅️ nuevo
  types?: string[];             // ⬅️ nuevo
  photos?: { photo_reference: string; height: number; width: number }[];
  dietaryCategories?: string[];
  website?: string
  primaryPhotoUrl?: string;
}

// 🔍 Búsqueda filtrada por tipo de restricción (sin TACC, vegano, etc.)
export const searchFilteredRestaurants = async (
  filters: string[],
  latitude: number,
  longitude: number,
  radius = 3000,
): Promise<Place[]> => {
  try {
    const allResults: Place[] = []

    // Search for each filter individually to track which restaurants match which categories
    for (const filter of filters) {
      const searchTerms = getSearchTermsForFilter(filter)
      const query = `restaurant ${searchTerms}`

      const response = await axios.get("https://maps.googleapis.com/maps/api/place/textsearch/json", {
        params: {
          query,
          location: `${latitude},${longitude}`,
          radius,
          fields: "place_id,name,geometry,rating,user_ratings_total,vicinity,photos,website",
          key: GOOGLE_API_KEY,
        },
      })

      const results: Place[] = response.data.results || []

      // Add dietary category to each result
      results.forEach((place) => {
        const existingPlace = allResults.find((p) => p.place_id === place.place_id)
        if (existingPlace) {
          // Add this category to existing place
          if (!existingPlace.dietaryCategories) {
            existingPlace.dietaryCategories = []
          }
          if (!existingPlace.dietaryCategories.includes(filter)) {
            existingPlace.dietaryCategories.push(filter)
          }
        } else {
          // Add new place with this category
          allResults.push({
            ...place,
            dietaryCategories: [filter],
          })
        }
      })
    }

    return allResults
  } catch (error) {
    console.error("Error buscando lugares filtrados:", error)
    return []
  }
}

// Nueva función para buscar por un filtro específico
export const searchByDietaryFilter = async (
  filterType: string,
  latitude: number,
  longitude: number,
  radius = 3000,
): Promise<Place[]> => {
  return searchFilteredRestaurants([filterType], latitude, longitude, radius)
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

// Obtener URL de la foto
export const getPhotoUrl = (photoReference: string, maxWidth: number): string => {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`
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
        fields: "place_id,name,geometry,rating,user_ratings_total,vicinity,photos,website",
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
    const detailResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json`,
      {
        params: {
          place_id: placeId,
          // ⬇️ Pedimos más campos para poder inferir dietas
          fields: "name,rating,user_ratings_total,geometry,photos,types,formatted_address,vicinity, website",
          key: GOOGLE_API_KEY,
        },
      }
    );

    const result = detailResponse.data.result;
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
      photos: result.photos || [],
      website: result.website,
      types: result.types || [],                 // ⬅️ nuevo
      formatted_address: result.formatted_address, // ⬅️ nuevo
      vicinity: result.vicinity,                 // ⬅️ ya lo usabas en otros lados
    };
  } catch (e) {
    Alert.alert("Error", "No se pudo obtener la información del lugar");
    return null;
  }
};

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

const getSearchTermsForFilter = (filter: string): string => {
  switch (filter.toLowerCase()) {
    case "sin tacc":
    case "celiaco":
      return "gluten free celiac sin tacc celiaco"
    case "vegano":
      return "vegan vegano plant based"
    case "vegetariano":
      return "vegetarian vegetariano"
    case "kosher":
      return "kosher"
    case "halal":
      return "halal"
    case "keto":
      return "keto ketogenic low carb"
    case "paleo":
      return "paleo paleolithic"
    default:
      return filter
  }
}

export const getDietaryDisplayLabel = (category: string): string => {
  switch (category.toLowerCase()) {
    case "sin tacc":
    case "celiaco":
      return "Celiaco"
    case "vegano":
      return "Vegano"
    case "vegetariano":
      return "Vegetariano"
    case "kosher":
      return "Kosher"
    case "halal":
      return "Halal"
    case "keto":
      return "Keto"
    case "paleo":
      return "Paleo"
    default:
      return category
  }
}

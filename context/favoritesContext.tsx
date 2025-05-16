"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { Place } from "../screens/Main/mainBackend"

interface FavoritesContextType {
  favorites: Place[]
  addFavorite: (place: Place) => void
  removeFavorite: (place: Place) => void
  isFavorite: (place: Place) => boolean
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  addFavorite: () => {},
  removeFavorite: () => {},
  isFavorite: () => false,
})

export const useFavorites = () => useContext(FavoritesContext)

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Place[]>([])

  // Cargar favoritos desde AsyncStorage al iniciar
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem("favorites")
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites))
        }
      } catch (error) {
        console.error("Error al cargar favoritos:", error)
      }
    }

    loadFavorites()
  }, [])

  // Guardar favoritos en AsyncStorage cuando cambian
  useEffect(() => {
    const saveFavorites = async () => {
      try {
        await AsyncStorage.setItem("favorites", JSON.stringify(favorites))
      } catch (error) {
        console.error("Error al guardar favoritos:", error)
      }
    }

    saveFavorites()
  }, [favorites])

  // Verificar si un lugar está en favoritos
  const isFavorite = (place: Place): boolean => {
    return favorites.some(
      (fav) =>
        fav.geometry.location.lat === place.geometry.location.lat &&
        fav.geometry.location.lng === place.geometry.location.lng,
    )
  }

  // Añadir un lugar a favoritos
  const addFavorite = (place: Place) => {
    if (!isFavorite(place)) {
      setFavorites([...favorites, place])
    }
  }

  // Eliminar un lugar de favoritos
  const removeFavorite = (place: Place) => {
    setFavorites(
      favorites.filter(
        (fav) =>
          !(
            fav.geometry.location.lat === place.geometry.location.lat &&
            fav.geometry.location.lng === place.geometry.location.lng
          ),
      ),
    )
  }

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

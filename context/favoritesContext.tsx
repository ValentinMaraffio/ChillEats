"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Place } from "../screens/Main/mainBackend";

/** Selecciona UNA sola foto “principal” del lugar, en orden de prioridad. */
function getPrimaryPhotoUrl(place: any): string {
  if (!place) return FALLBACK_IMG;
  // Si ya viene normalizado:
  if (typeof place.primaryPhotoUrl === "string" && place.primaryPhotoUrl.trim()) return place.primaryPhotoUrl;
  // photoUrl directo:
  if (typeof place.photoUrl === "string" && place.photoUrl.trim()) return place.photoUrl;
  // Google Photos: usar photo_reference -> la UI/Backend puede transformarlo luego a URL
  // Si tenés utilidades de URL finales, podés reemplazar este bloque por tu `getPhotoUrl`.
  if (Array.isArray(place.photos) && place.photos.length > 0) {
    const p0 = place.photos[0];
    if (typeof p0 === "string" && p0.trim()) return p0;
    if (p0 && typeof p0 === "object") {
      // Guardamos el reference como string “estable”; la FavoritesScreen puede resolverlo a URL visible
      if (typeof p0.photo_reference === "string" && p0.photo_reference.trim()) return p0.photo_reference;
      if (typeof p0.url === "string" && p0.url.trim()) return p0.url;
      if (typeof p0.photoUrl === "string" && p0.photoUrl.trim()) return p0.photoUrl;
      if (typeof p0.uri === "string" && p0.uri.trim()) return p0.uri;
    }
  }
  // image: último recurso (suele ser un placeholder compartido)
  if (typeof place.image === "string" && place.image.trim()) return place.image;
  return FALLBACK_IMG;
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop";

function deepClone<T>(obj: T): T {
  try {
    // @ts-ignore
    if (typeof structuredClone === "function") return structuredClone(obj);
  } catch {}
  return JSON.parse(JSON.stringify(obj));
}

/** Normaliza el favorito y agrega `primaryPhotoUrl` estable. */
function normalizeFavorite(place: Place) {
  const raw = deepClone(place);

  const id =
    (raw as any).place_id ??
    (raw as any).id ??
    (raw as any).fsq_id ??
    (raw as any)._id ??
    `${(raw as any)?.geometry?.location?.lat || ""}:${(raw as any)?.geometry?.location?.lng || ""}`;

  const lat =
    (raw as any)?.geometry?.location?.lat ??
    (raw as any)?.geocodes?.main?.latitude ??
    (raw as any)?.latitude ??
    (raw as any)?.lat ??
    null;

  const lng =
    (raw as any)?.geometry?.location?.lng ??
    (raw as any)?.geocodes?.main?.longitude ??
    (raw as any)?.longitude ??
    (raw as any)?.lng ??
    null;

  const primaryPhotoUrl = getPrimaryPhotoUrl(raw);

  return {
    ...raw,
    id,
    primaryPhotoUrl,
    // guardo coords “planas” por conveniencia, pero mantengo geometry original
    _fav: {
      lat,
      lng,
      source: (raw as any)?.place_id ? "google" : (raw as any)?.fsq_id ? "foursquare" : "custom",
      savedAt: Date.now(),
      version: 2,
    },
  };
}

interface FavoritesContextType {
  favorites: any[]; // ahora incluye `primaryPhotoUrl` y meta `_fav`
  addFavorite: (place: Place) => void;
  removeFavorite: (placeOrId: any) => void;
  isFavorite: (placeOrId: any) => boolean;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  addFavorite: () => {},
  removeFavorite: () => {},
  isFavorite: () => false,
  clearFavorites: () => {},
});

export const useFavorites = () => useContext(FavoritesContext);

const STORAGE_KEY = "@favorites.v2";

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<any[]>([]);

  // Cargar favoritos
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setFavorites(JSON.parse(stored));
      } catch (e) {
        console.error("Error al cargar favoritos:", e);
      }
    })();
  }, []);

  // Guardar favoritos
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      } catch (e) {
        console.error("Error al guardar favoritos:", e);
      }
    })();
  }, [favorites]);

  const idOf = (x: any): string =>
    (typeof x === "string" && x) ||
    x?.id ||
    x?.place_id ||
    x?.fsq_id ||
    x?._id ||
    (x?.geometry?.location ? `${x.geometry.location.lat}:${x.geometry.location.lng}` : "");

  const isSame = (a: any, b: any) => {
    const aId = idOf(a);
    const bId = idOf(b);
    if (aId && bId) return aId === bId;

    // Fallback por coords (evitar igualdad exacta de floats)
    const alat = a?._fav?.lat ?? a?.geometry?.location?.lat;
    const alng = a?._fav?.lng ?? a?.geometry?.location?.lng;
    const blat = b?._fav?.lat ?? b?.geometry?.location?.lat;
    const blng = b?._fav?.lng ?? b?.geometry?.location?.lng;
    const eps = 1e-6;
    return Math.abs((alat ?? 0) - (blat ?? 1)) < eps && Math.abs((alng ?? 0) - (blng ?? 1)) < eps;
  };

  const addFavorite = (place: Place) => {
    const norm = normalizeFavorite(place);
    setFavorites((prev) => {
      const existsIdx = prev.findIndex((f) => isSame(f, norm));
      if (existsIdx >= 0) {
        // actualizar (p. ej. si ahora sí tenemos buena foto)
        const copy = prev.slice();
        copy[existsIdx] = { ...copy[existsIdx], ...norm };
        return copy;
      }
      return [norm, ...prev];
    });
  };

  const removeFavorite = (placeOrId: any) => {
    setFavorites((prev) => prev.filter((f) => !isSame(f, placeOrId)));
  };

  const isFavorite = (placeOrId: any) => favorites.some((f) => isSame(f, placeOrId));

  const clearFavorites = () => setFavorites([]);

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, clearFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
};

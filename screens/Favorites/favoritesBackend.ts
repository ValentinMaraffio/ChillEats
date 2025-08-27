import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Helper: devuelve una sola foto "principal" del lugar.
export function getPrimaryPhotoUrl(place: any): string {
  if (!place) {
    return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop";
  }

  // 1) Campo dedicado si existe
  if (typeof place.primaryPhotoUrl === "string" && place.primaryPhotoUrl.trim()) {
    return place.primaryPhotoUrl;
  }

  // 2) photoUrl directo
  if (typeof place.photoUrl === "string" && place.photoUrl.trim()) {
    return place.photoUrl;
  }

  // 3) photos: puede ser string[] o objeto[]
  if (Array.isArray(place.photos) && place.photos.length > 0) {
    const p0 = place.photos[0];
    if (typeof p0 === "string" && p0.trim()) return p0;
    if (p0 && typeof p0 === "object") {
      // soporta { url } | { photoUrl } | { uri }
      if (typeof p0.url === "string" && p0.url.trim()) return p0.url;
      if (typeof p0.photoUrl === "string" && p0.photoUrl.trim()) return p0.photoUrl;
      if (typeof p0.uri === "string" && p0.uri.trim()) return p0.uri;
    }
  }

  // 4) image: último recurso (suele repetirse entre lugares)
  if (typeof place.image === "string" && place.image.trim()) {
    return place.image;
  }

  // 5) Default
  return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop";
}

// Mock restaurant data (mantengo lo que ya tenías)
export const data = [
  {
    id: '1',
    name: 'Pizza Express',
    rating: 4.5,
    reviews: 120,
    distance: '1.2 km',
    icon: 'pizza-slice',
  },
];

export const data1 = [...data];
export const data2 = [...data];
export const data3 = [...data];

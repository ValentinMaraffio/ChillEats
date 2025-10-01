import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getPhotoUrl } from "../Main/mainBackend";

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Devuelve una sola foto "principal" del lugar.
export function getPrimaryPhotoUrl(place: any): string {
  const FALLBACK =
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop";
  if (!place) return FALLBACK;

  // 1) Campo dedicado si existe
  if (typeof place.primaryPhotoUrl === "string" && place.primaryPhotoUrl.trim()) return place.primaryPhotoUrl;

  // 2) URL directa si ya viene resuelta
  if (typeof place.photoUrl === "string" && place.photoUrl.trim()) return place.photoUrl;

  // 3) Array de fotos (string[] u objeto[])
  if (Array.isArray(place.photos) && place.photos.length > 0) {
    const p0 = place.photos[0];

    // 3.a) Google Places: { photo_reference }
    if (p0 && typeof p0 === "object" && typeof p0.photo_reference === "string" && p0.photo_reference.trim()) {
      // usa el mismo builder que Main
      return getPhotoUrl(p0.photo_reference, 800);
    }

    // 3.b) URL ya armada en campos comunes
    if (typeof p0 === "string" && p0.trim()) return p0;
    if (p0 && typeof p0 === "object") {
      if (typeof p0.url === "string" && p0.url.trim()) return p0.url;
      if (typeof p0.photoUrl === "string" && p0.photoUrl.trim()) return p0.photoUrl;
      if (typeof p0.uri === "string" && p0.uri.trim()) return p0.uri;
      // (opcional) Foursquare: prefix/suffix
      if (typeof p0.prefix === "string" && typeof p0.suffix === "string") {
        return `${p0.prefix}800x800${p0.suffix}`;
      }
    }
  }

  // 4) Último recurso
  if (typeof place.image === "string" && place.image.trim()) return place.image;

  return FALLBACK;
}

// === Filtros disponibles (mismos de Main, sin "Recomendados") ===
export const AVAILABLE_FILTERS = [
  "Sin TACC",
  "Vegano",
  "Vegetariano",
  "Kosher",
  "Halal",
  "Keto",
  "Paleo",
] as const;

// === Inferencia de categorías dietarias (funciona aunque el lugar no tenga dietaryCategories) ===
type Dietary = (typeof AVAILABLE_FILTERS)[number];

const TOKENS: Record<Dietary, string[]> = {
  "Sin TACC": ["sin tacc", "celiaco", "celíaco", "gluten free", "gluten-free", "celiac", "gf"],
  Vegano: ["vegano", "vegan", "plant based", "plant-based"],
  Vegetariano: ["vegetariano", "vegetarian"],
  Kosher: ["kosher"],
  Halal: ["halal"],
  Keto: ["keto", "ketogenic", "low carb", "low-carb"],
  Paleo: ["paleo", "paleolithic", "paleolítico"],
};

const norm = (s?: any) =>
  typeof s === "string"
    ? s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim()
    : "";

function blobify(place: any): string {
  const parts: string[] = [];
  parts.push(norm(place?.name));
  parts.push(norm(place?.vicinity ?? place?.formatted_address ?? place?.address));
  // Google types
  if (Array.isArray(place?.types)) parts.push(norm(place.types.join(" ")));
  // Foursquare categories
  if (Array.isArray(place?.categories)) {
    parts.push(norm(place.categories.map((c: any) => c?.name ?? c).join(" ")));
  }
  // Campos opcionales que puedas usar como descripción
  parts.push(norm(place?.description ?? place?.about ?? ""));
  return parts.join(" ");
}

// Exportado para que (opcional) lo uses al guardar favoritos en Main
export function inferDietaryCategories(place: any): Dietary[] {
  // 1) Si ya vienen, normalizamos y devolvemos mapeadas a los labels oficiales
  if (Array.isArray(place?.dietaryCategories) && place.dietaryCategories.length) {
    const set = new Set<string>(place.dietaryCategories.map((c: string) => norm(c)));
    const out: Dietary[] = [];
    (AVAILABLE_FILTERS as readonly string[]).forEach((label) => {
      if (set.has(norm(label)) || (label === "Sin TACC" && (set.has("celiaco") || set.has("celíaco")))) {
        out.push(label as Dietary);
      }
    });
    if (out.length) return out;
  }

  // 2) Si no hay etiquetas, inferimos por texto/metadata
  const text = blobify(place);
  const out: Dietary[] = [];
  (AVAILABLE_FILTERS as readonly Dietary[]).forEach((label) => {
    const hits = TOKENS[label];
    if (hits.some((t) => text.includes(t))) out.push(label);
  });

  // 3) (Opcional) banderas booleanas si alguna vez las guardás
  const d = place?.attributes?.dietary ?? place?.dietary ?? {};
  if (d) {
    if (d.glutenFree && !out.includes("Sin TACC")) out.push("Sin TACC");
    if (d.vegan && !out.includes("Vegano")) out.push("Vegano");
    if (d.vegetarian && !out.includes("Vegetariano")) out.push("Vegetariano");
    if (d.kosher && !out.includes("Kosher")) out.push("Kosher");
    if (d.halal && !out.includes("Halal")) out.push("Halal");
    if (d.keto && !out.includes("Keto")) out.push("Keto");
    if (d.paleo && !out.includes("Paleo")) out.push("Paleo");
  }

  return out;
}

// Normaliza y compara categorías de un lugar con los filtros elegidos
export function matchesSelectedFilters(place: any, selected: string[]): boolean {
  if (!selected || selected.length === 0) return true;

  // Usa lo que venga en dietaryCategories o, si no hay, infiere
  const inferred = inferDietaryCategories(place);
  if (!inferred.length) return false;

  const want = new Set(selected.map((s) => norm(s)));
  return inferred.some(
    (c) => want.has(norm(c)) || (norm(c) === "sin tacc" && (want.has("celiaco") || want.has("celíaco")))
  );
}

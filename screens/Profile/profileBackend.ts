import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"

// Type definitions
export type ProfileProps = NativeStackScreenProps<RootStackParamList, "Profile">

// Helper functions
export const handleUserLogout = (logout: () => void, navigation: any) => {
  logout()
  navigation.reset({
    index: 0,
    routes: [{ name: "Login" }],
  })
}

// Mock reviews data for demonstration
export const mockReviews = [
  {
    id: "1",
    placeName: "Pizza Express",
    rating: 4,
    date: "15 mayo 2023",
    text: "Excelente lugar para comer pizza sin gluten. La masa es crujiente y los ingredientes son frescos. Definitivamente volveré.",
    distance: 1.2,
    tags: ["Sin Gluten", "Pizza"],
  },
  {
    id: "2",
    placeName: "Veggie Garden",
    rating: 5,
    date: "3 junio 2023",
    text: "El mejor restaurante vegetariano que he probado. Tienen opciones para celíacos y la comida es deliciosa.",
    distance: 0.8,
    tags: ["Vegetariano", "Sin Gluten"],
  },
  {
    id: "3",
    placeName: "Burger House",
    rating: 3,
    date: "20 julio 2023",
    text: "Las hamburguesas están bien, pero el servicio es lento. Tienen opciones sin gluten pero la preparación no es muy cuidadosa.",
    distance: 2.5,
    tags: ["Hamburguesas", "Sin Gluten"],
  },
  {
    id: "4",
    placeName: "Sushi World",
    rating: 5,
    date: "5 agosto 2023",
    text: "Increíble sushi sin gluten. El arroz está perfectamente cocinado y tienen salsa de soja sin gluten.",
    distance: 3.7,
    tags: ["Sushi", "Sin Gluten"],
  },
  {
    id: "5",
    placeName: "Taco Loco",
    rating: 2,
    date: "12 septiembre 2023",
    text: "No recomendado para celíacos. Aunque dicen tener opciones sin gluten, la contaminación cruzada es evidente.",
    distance: 1.5,
    tags: ["Mexicano"],
  },
]

import { useState, useEffect, useRef, useCallback } from "react"
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, Modal, Animated, Dimensions, PanResponder, FlatList, TextInput, Pressable } from "react-native"
import { FontAwesome, Ionicons } from "@expo/vector-icons"
import { useAuth } from "../../context/authContext"
import { handleUserLogout } from "./profileBackend"
import { styles } from "./profileStyles"
import { widthPercentageToDP as wp } from "react-native-responsive-screen"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import { SafeAreaView } from "react-native-safe-area-context"
import axios from "axios"
import Slider from "@react-native-community/slider"
import { Picker } from "@react-native-picker/picker"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import { useFocusEffect } from "@react-navigation/native"


type Review = {
  id: string
  placeName: string
  placeId: string 
  rating: number
  date: string
  text: string
  distance: number
  tags: string[]
}


export default function ProfileScreen() {
  const { user, token, logout } = useAuth()
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [starFilter, setStarFilter] = useState(0)
  const [distanceFilter, setDistanceFilter] = useState(0)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const navigation = useNavigation<BottomTabNavigationProp<any>>() 
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [reviewsToShow, setReviewsToShow] = useState(5)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "closest" | "farthest" | null>(null)
  const [sortCriterion, setSortCriterion] = useState<"date" | "distance" | "rating">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [refreshing, setRefreshing] = useState(false)

  
  const screenHeight = Dimensions.get("window").height
  const filtersPanelHeight = Math.min(640, screenHeight * 0.62)
  const screenWidth = Dimensions.get("window").width
  const panelWidth = screenWidth * 0.75 // ancho del panel
  
  const slideAnim = useRef(new Animated.Value(panelWidth)).current // inicia oculto a la derecha

  const handleDeleteReview = async (id: string) => {
  Alert.alert(
    "Eliminar reseña",
    "¿Estás seguro que quieres eliminar esta reseña?",
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`http://172.16.1.95:8000/api/reviews/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            setReviews(reviews.filter((r) => r.id !== id))
            setFilteredReviews(filteredReviews.filter((r) => r.id !== id))
          } catch (error) {
            console.error("Error al eliminar reseña:", error)
            Alert.alert("Error", "No se pudo eliminar la reseña")
          }
        },
      },
    ]
  )
}

const handleOpenReview = (review: Review) => {
  if (!review.placeId) return
  // Ir a la tab "Map" pasando SOLO el id
  navigation.navigate("Map", {
    placeId: review.placeId,
  })
}
  //animacion cierre deslizando configuracion
  const panResponder = useRef(
  PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // activar el gesto solo si el usuario mueve horizontalmente hacia la derecha
      return gestureState.dx > 10
    },
    onPanResponderMove: (evt, gestureState) => {
      // mueve el panel mientras arrastra
      if (gestureState.dx > 0) {
        slideAnim.setValue(gestureState.dx)
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      // si desliza más de la mitad del ancho, cerrar el panel
      if (gestureState.dx > panelWidth / 3) {
        Animated.timing(slideAnim, {
          toValue: panelWidth,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setShowSettings(false))
      } else {
        // si no llegó lo suficiente, devolverlo a la posición inicial
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start()
      }
    },
  })
).current


//animacion cierre deslizando filtros de reseñas
const slideY = useRef(new Animated.Value(0)).current
const panResponderFilters = useRef(
  PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dy) > 5 && Math.abs(gestureState.dx) < 10,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        slideY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100) {
        Animated.timing(slideY, {
          toValue: 500,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setShowFilters(false);
          slideY.setValue(0);
        });
      } else {
        Animated.spring(slideY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  })
).current;

const fetchUserReviews = useCallback(async () => {
  try {
    const res = await axios.get("http://172.16.1.95:8000/api/reviews/my-reviews", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const transformedReviews = res.data.reviews.map((review: any) => ({
      id: review._id,
      placeName: review.placeName,
      placeId: review.placeId,
      rating: review.rating,
      date: review.createdAt ?? review.date,
      text: review.comment ?? review.text,
      distance: review.distance ?? 0,
      tags: review.tags ?? [],
    }))
    setReviews(transformedReviews)
    setFilteredReviews(transformedReviews)
  } catch (e) {
    console.error("Error cargando mis reseñas:", e)
  }
}, [token])

useEffect(() => {
  fetchUserReviews()
}, [fetchUserReviews])

useFocusEffect(
  useCallback(() => {
    fetchUserReviews()
    // no hace falta cleanup
  }, [fetchUserReviews])
)

//FILTROS RESEÑAS
useEffect(() => {
  let filtered = [...reviews]

  if (searchQuery) {
    filtered = filtered.filter((review) =>
      review.placeName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  if (starFilter > 0) {
    filtered = filtered.filter((review) => review.rating === starFilter)
  }

  if (distanceFilter > 0) {
    filtered = filtered.filter((review) => review.distance <= distanceFilter)
  }

  if (sortCriterion === "date") {
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA
    })
  } 
  else if (sortCriterion === "distance") {
    filtered.sort((a, b) =>
      sortDirection === "asc" ? a.distance - b.distance : b.distance - a.distance
    )
  } 
  else if (sortCriterion === "rating") {
    filtered.sort((a, b) =>
      sortDirection === "asc" ? a.rating - b.rating : b.rating - a.rating
    )
  }

  setFilteredReviews(filtered)
}, [searchQuery, starFilter, distanceFilter, sortOrder, sortCriterion, sortDirection, reviews])

// ANIMACION DESPLEGABLE FILTROS
useEffect(() => {
  if (showFilters) {
    slideY.setValue(500); // empieza fuera de pantalla
    Animated.timing(slideY, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }
}, [showFilters]);



//ANIMACION DESPLEGABLE CONFIGURACION 
useEffect(() => {
  if (showSettings) {
    Animated.timing(slideAnim, {
      toValue: showSettings ? 0 : panelWidth,
      duration: 300,
      useNativeDriver: true,
    }).start()
  } else {
    Animated.timing(slideAnim, {
      toValue: panelWidth,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }
}, [showSettings])

const handleLogout = async () => {
  await logout()
  navigation.reset({
    index: 0,
    routes: [{ name: "MainTabs", params: { screen: "User" } }],
  })
}

  const handleEditProfile = () => {
    Alert.alert("Editar perfil", "Esta funcionalidad estará disponible próximamente")
  }

  const handleUploadPhoto = () => {
    Alert.alert("Subir foto", "Esta funcionalidad estará disponible próximamente")
  }

  const filterReviewsByStars = (stars: number) => {
    if (stars === starFilter) {
      setStarFilter(0)
      setFilteredReviews(reviews)
    } else {
      setStarFilter(stars)
      const filtered = reviews.filter((review) => review.rating === stars)
      setFilteredReviews(filtered)
    }
  }

  const filterReviewsByDistance = (distance: number) => {
    if (distance === distanceFilter) {
      setDistanceFilter(0)
      setFilteredReviews(reviews)
    } else {
      setDistanceFilter(distance)
      const filtered = reviews.filter((review) => review.distance <= distance)
      setFilteredReviews(filtered)
    }
  }

  const resetFilters = () => {
    setStarFilter(0)
    setDistanceFilter(0)
    setSortCriterion("date")     
    setSortDirection("desc")     
    setFilteredReviews(reviews)
  }

  const renderStars = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesome
          key={i}
          name={i <= rating ? "star" : "star-o"}
          size={16}
          color={i <= rating ? "#FFD700" : "#ccc"}
          style={{ marginRight: 2 }}
        />
      )
    }
    return <View style={{ flexDirection: "row" }}>{stars}</View>
  }

  return ( 
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        scrollEnabled={!showSettings}
        >    
        <View style={styles.header}>

          <Text style={styles.headerTitle}>Mi Perfil</Text>

          <TouchableOpacity style={styles.editButton} onPress={() => setShowSettings(!showSettings)}>
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>

        </View>


{showSettings && (
  <>
  {/* Overlay oscuro */}
  <TouchableOpacity
    style={styles.overlay}
    activeOpacity={1}
    onPress={() => setShowSettings(false)}
  />

  {/* Panel lateral */}
  <Animated.View
  style={[
    styles.sidePanelRight,
    { transform: [{ translateX: slideAnim }] }
  ]}
  {...panResponder.panHandlers}
>
  <Text style={styles.settingsTitle}>Configuración</Text>

  {/* Editar perfil */}
  <TouchableOpacity
    style={styles.settingsOption}
    onPress={() => {
      setShowSettings(false)
      Alert.alert("Editar perfil", "Esta funcionalidad estará disponible próximamente")
    }}
  >
    <Ionicons name="create-outline" size={22} color="#ff9500" />
    <Text style={styles.settingsOptionText}>Editar perfil</Text>
  </TouchableOpacity>

  
  {/* Tema de la app */}
  <TouchableOpacity
    style={styles.settingsOption}
    onPress={() => {
      setShowSettings(false)
      Alert.alert("Tema de la App", "Pronto podrás cambiar entre modo claro y oscuro")
    }}
  >
    <Ionicons name="moon-outline" size={22} color="#ff9500" />
    <Text style={styles.settingsOptionText}>Tema</Text>
  </TouchableOpacity>

  {/* Mis favoritos */}
  <TouchableOpacity
    style={styles.settingsOption}
    onPress={() => {
      setShowSettings(false)
      Alert.alert("Mis favoritos", "Aquí irán tus lugares favoritos")
    }}
  >
    <Ionicons name="heart-outline" size={22} color="#ff9500" />
    <Text style={styles.settingsOptionText}>Mis favoritos</Text>
  </TouchableOpacity>

  {/* Configurar privacidad */}
  <TouchableOpacity
    style={styles.settingsOption}
    onPress={() => {
      setShowSettings(false)
      Alert.alert("Privacidad", "Configura quién puede ver tu perfil y reseñas")
    }}
  >
    <Ionicons name="eye-outline" size={22} color="#ff9500" />
    <Text style={styles.settingsOptionText}>Privacidad</Text>
  </TouchableOpacity>


  {/* Cerrar sesión */}
  <TouchableOpacity
    style={styles.settingsOption}
    onPress={() => {
      setShowSettings(false)
      handleLogout()
    }}
  >
    <Ionicons name="log-out-outline" size={22} color="#ff9500" />
    <Text style={styles.settingsOptionText}>Cerrar sesión</Text>
  </TouchableOpacity>
</Animated.View>
  </>
)}


        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleUploadPhoto}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
                </Text>
                <View style={styles.addPhotoIcon}>
                  <Ionicons name="camera" size={16} color="white" />
                </View>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.name}>{user?.name || "Nombre no disponible"}</Text>
          <Text style={styles.email}>{user?.email || "Correo no disponible"}</Text>

        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "profile" && styles.activeTab]}
            onPress={() => setActiveTab("profile")}
          >
            <Text style={[styles.tabText, activeTab === "profile" && styles.activeTabText]}>Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "reviews" && styles.activeTab]}
            onPress={() => setActiveTab("reviews")}
          >
            <Text style={[styles.tabText, activeTab === "reviews" && styles.activeTabText]}>Mis Reseñas</Text>
          </TouchableOpacity>
        </View>

        {activeTab === "profile" ? (
          <View style={styles.profileContent}>
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>Mi Actividad</Text>
  </View>

  {/* Grid de estadísticas */}
  <View style={styles.statsGrid}>
    <View style={styles.statCard}>
      <Ionicons name="star-outline" size={28} color="#ff9500" />
      <Text style={styles.statLabel2}>Promedio</Text>
      <Text style={styles.statValue}>4.2</Text>
    </View>

    <View style={styles.statCard}>
      <Ionicons name="business-outline" size={28} color="#ff9500" />
      <Text style={styles.statLabel2}>Lugares</Text>
      <Text style={styles.statValue}>12</Text>
    </View>

    <View style={styles.statCard}>
      <Ionicons name="document-text-outline" size={28} color="#ff9500" />
      <Text style={styles.statLabel2}>Reseñas</Text>
      <Text style={styles.statValue}>{reviews.length}</Text>
    </View>

    <View style={styles.statCard}>
      <Ionicons name="pricetag-outline" size={28} color="#ff9500" />
      <Text style={styles.statLabel2}>Categorías</Text>
      <Text style={styles.statValue}>5</Text>
    </View>
  </View>

  {/* Actividad reciente */}
 <View style={styles.sectionHeader}>
  <Text style={styles.sectionHeaderText}>Actividad Reciente</Text>
</View>

<FlatList
  data={reviews.slice(0, 3)}
  horizontal
  showsHorizontalScrollIndicator={false}
  keyExtractor={(item) => item.id}
  contentContainerStyle={styles.recentList}
  renderItem={({ item }) => (
    <Pressable  onPress={() => handleOpenReview(item)}>
      <View style={styles.recentCard}>
          <View style={styles.recentIcon}>
            <Ionicons name="restaurant-outline" size={28} color="#fff" />
          </View>
          <Text style={styles.recentPlace2} numberOfLines={1}>{item.placeName}</Text>
          <View style={{ marginTop: 4 }}>{renderStars(item.rating)}</View>
      </View>
    </Pressable>
  )}
/>

{reviews.length === 0 && (
  <Text style={styles.emptyText}>Todavía no tienes actividad</Text>
)}

</View>

        ) : (
  <View style={styles.reviewsContent}>
    {/* Barra de búsqueda + botón de filtros */}
    <View style={styles.searchBarContainer}>
      <View style={styles.searchInputWrapper}>
        <Ionicons name="search-outline" size={20} color="#999" style={{ marginRight: 6 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar reseñas por lugar"
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text)
            const filtered = reviews.filter((review) =>
              review.placeName.toLowerCase().includes(text.toLowerCase())
            )
            setFilteredReviews(filtered)
          }}
        />
      </View>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilters(true)}
      >
        <Ionicons name="options-outline" size={22} color="#fff" />
      </TouchableOpacity>
    </View>

    {/* Lista de reseñas */}
    {filteredReviews.length > 0 ? (
      <>
        {filteredReviews.slice(0, reviewsToShow).map((review, index) => (
            <Pressable
              key={review.id} 
              onPress={() => handleOpenReview(review)}
            >

          <View style={styles.reviewCard}>
            <TouchableOpacity
              style={styles.deleteReviewButton}
              onPress={() => handleDeleteReview(review.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#FFC266" />
            </TouchableOpacity>

            <View style={styles.reviewHeader}>
              <Text 
                style={styles.reviewPlaceName}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {review.placeName}
              </Text>
              <Text style={styles.reviewDate}>
                  {new Date(review.date).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
              </Text>
            </View>
            <View style={styles.reviewRatingContainer}>
              {renderStars(review.rating)}
              <Text style={styles.reviewDistance}>{review.distance} km</Text>
            </View>
                  
            <View style={styles.reviewTextWrapper}>
              <Text style={styles.reviewText}>{review.text}</Text>
            </View>

            <View style={styles.reviewTags}>
              {review.tags.map((tag: string, tagIndex: number) => (
                <View key={tagIndex} style={styles.reviewTag}>
                  <Text style={styles.reviewTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        
        </Pressable>
        
        ))}

        {/* Botón cargar más */}
        {reviewsToShow < filteredReviews.length && (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={() => setReviewsToShow(reviewsToShow + 5)}
          >
            <Text style={styles.loadMoreText}>Cargar más</Text>
          </TouchableOpacity>
        )}
      </>
    ) : (
      <View style={styles.emptyReviews}>
        <Ionicons name="document-text-outline" size={60} color="#ccc" />
        <Text style={styles.emptyReviewsText}>
          No hay reseñas que coincidan con la búsqueda o filtros
        </Text>
      </View>
    )}

{/* Modal de filtros */}
<Modal
  visible={showFilters}
  transparent
  onRequestClose={() => setShowFilters(false)}
>
  <View style={{ flex: 1 }}>
    {/* Overlay fijo */}
    <TouchableOpacity
      style={styles.overlay}
      activeOpacity={1}
      onPress={() => setShowFilters(false)}
    />

    {/* Panel animado */}
    <Animated.View
      style={[
        styles.filtersPanel,
        { transform: [{ translateY: slideY }] },
      ]}
      //{...panResponderFilters.panHandlers}
    >
      {/* Handle para arrastrar */}
      <View
        {...panResponderFilters.panHandlers}
        style={{
          width: "100%",
          alignItems: "center",
          paddingVertical: 10,
        }}
      >
        <View
          style={{
            width: 40,
            height: 5,
            backgroundColor: "#ccc",
            borderRadius: 3,
          }}
        />
      </View>

      <Text style={styles.filtersTitle}>Filtros</Text>

      {/* Estrellas */}
      <Text style={styles.filterLabel}>Estrellas</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() =>
              setStarFilter((prev) => (prev === star ? 0 : star))
            }
            style={styles.starButton}
          >
            <FontAwesome
              name="star"
              size={28}
              color={star <= starFilter ? "#FFD700" : "#ccc"}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Ordenamiento */}
      <Text style={styles.filterLabel}>Ordenar por</Text>
      <View
        style={{
          backgroundColor: "#f5f5f5",
          borderRadius: 8,
          marginBottom: 15,
        }}
      >
        <Picker
          selectedValue={sortCriterion}
          onValueChange={(value) => setSortCriterion(value)}
          style={{ width: "100%", minHeight: 50 }}
          itemStyle={{ fontSize: 16, textAlign: "center" }}
        >
          <Picker.Item label="Fecha" value="date" />
          <Picker.Item label="Distancia" value="distance" />
          <Picker.Item label="Valoración" value="rating" />
        </Picker>
      </View>

      <Text style={styles.filterLabel}>Orden</Text>
      <View
        style={{
          backgroundColor: "#f5f5f5",
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <Picker
          selectedValue={sortDirection}
          onValueChange={(value) => setSortDirection(value)}
          style={{ width: "100%", minHeight: 50 }}
          itemStyle={{ fontSize: 16, textAlign: "center" }}
        >
          <Picker.Item label="Ascendente" value="asc" />
          <Picker.Item label="Descendente" value="desc" />
        </Picker>
      </View>

      {/* Limpiar filtros */}
      <TouchableOpacity
        style={styles.clearFiltersButtonBig}
        onPress={resetFilters}
      >
        <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
      </TouchableOpacity>
    </Animated.View>
  </View>
</Modal>
  </View>
  
        )}
      </ScrollView>

      
    </SafeAreaView>
  )
}

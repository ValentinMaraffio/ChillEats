import { useState, useEffect, useRef } from "react"
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, Modal, Animated, Dimensions, PanResponder, FlatList, TextInput } from "react-native"
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

type Review = {
  id: string
  placeName: string
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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [reviewsToShow, setReviewsToShow] = useState(5)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "closest" | "farthest" | null>(null)
  const [sortCriterion, setSortCriterion] = useState<"date" | "distance">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

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
            await axios.delete(`http://192.168.0.236:8000/api/reviews/${id}`, {
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



useEffect(() => {
  const fetchUserReviews = async () => {
    try {
      //const { token } = useAuth() // Asegurate de que el token esté disponible
      const res = await axios.get('http://192.168.0.236:8000/api/reviews/my-reviews', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

        const transformedReviews = res.data.reviews.map((review: any) => ({
        id: review._id,
        placeName: review.placeName,
        rating: review.rating,
        date: new Date(review.createdAt).toLocaleDateString("es-AR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        text: review.comment,
        distance: 0, // si no tenés distancia, podés dejarlo en 0 u ocultar
        tags: review.tags,
      }))

      setReviews(transformedReviews)
      setFilteredReviews(transformedReviews)
    } catch (error) {
      console.error("Error al cargar reseñas del usuario:", error)
    }
  }

  if (token) {
    fetchUserReviews()
  }
}, [user])

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
  } else if (sortCriterion === "distance") {
    filtered.sort((a, b) =>
      sortDirection === "asc" ? a.distance - b.distance : b.distance - a.distance
    )
  }
  

  setFilteredReviews(filtered)
}, [searchQuery, starFilter, distanceFilter, sortCriterion, sortDirection, reviews])

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

  {/* Cambiar contraseña */}
  <TouchableOpacity
    style={styles.settingsOption}
    onPress={() => {
      setShowSettings(false)
      Alert.alert("Cambiar contraseña", "Esta funcionalidad estará disponible próximamente")
    }}
  >
    <Ionicons name="key-outline" size={22} color="#ff9500" />
    <Text style={styles.settingsOptionText}>Cambiar contraseña</Text>
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

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{reviews.length}</Text>
              <Text style={styles.statLabel}>Reseñas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4.2</Text>
              <Text style={styles.statLabel}>Promedio</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Favoritos</Text>
            </View>
          </View>
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
    <View style={styles.recentCard}>
      <View style={styles.recentIcon}>
        <Ionicons name="restaurant-outline" size={28} color="#fff" />
      </View>
      <Text style={styles.recentPlace2} numberOfLines={1}>{item.placeName}</Text>
      <View style={{ marginTop: 4 }}>{renderStars(item.rating)}</View>
    </View>
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
          <View key={index} style={styles.reviewCard}>
            <TouchableOpacity
              style={styles.deleteReviewButton}
              onPress={() => handleDeleteReview(review.id)}
            >
              <Ionicons name="trash-outline" size={20} color="red" />
            </TouchableOpacity>

            <View style={styles.reviewHeader}>
              <Text style={styles.reviewPlaceName}>{review.placeName}</Text>
              <Text style={styles.reviewDate}>{review.date}</Text>
            </View>
            <View style={styles.reviewRatingContainer}>
              {renderStars(review.rating)}
              <Text style={styles.reviewDistance}>{review.distance} km</Text>
            </View>
            <Text style={styles.reviewText}>{review.text}</Text>
            <View style={styles.reviewTags}>
              {review.tags.map((tag: string, tagIndex: number) => (
                <View key={tagIndex} style={styles.reviewTag}>
                  <Text style={styles.reviewTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
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
  animationType="slide"
  transparent={true}
  onRequestClose={() => setShowFilters(false)}
>
  <View style={{ flex: 1 }}>
    {/* Overlay */}
    <TouchableOpacity
      style={styles.overlay}
      activeOpacity={1}
      onPress={() => setShowFilters(false)}
    />

    <View style={[styles.filtersPanel, { position: 'absolute', bottom: 0, left: 0, right: 0 }]}>
      <Text style={styles.filtersTitle}>Filtros</Text>

      {/* Estrellas */}
      <Text style={styles.filterLabel}>Estrellas</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setStarFilter((prev) => (prev === star ? 0 : star))}
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

      {/* Distancia */}
      <View style={{ marginVertical: 10 }}>
  <Text style={styles.filterLabel}>
    Distancia máxima: <Text style={{ fontWeight: "bold" }}>{distanceFilter} km</Text>
  </Text>
  <View style={{ marginTop: 10, paddingHorizontal: 10 }}>
    <Slider
      style={{ width: "100%" }}
      minimumValue={1}
      maximumValue={50}
      step={1}
      minimumTrackTintColor="#ff9500"
      maximumTrackTintColor="#ddd"
      thumbTintColor="#ff9500"
      value={distanceFilter}
      onValueChange={(value: number) => setDistanceFilter(value)}
    />
  </View>
</View>

      {/* Ordenamiento */}
      <Text style={styles.filterLabel}>Ordenar por</Text>
<View style={{ backgroundColor: "#f5f5f5", borderRadius: 8, marginBottom: 15 }}>
  <Picker
    selectedValue={sortCriterion}
    onValueChange={(value) => setSortCriterion(value)}
    style={{ minHeight: 50, width: "100%" }}
  >
    <Picker.Item label="Fecha" value="date" />
    <Picker.Item label="Distancia" value="distance" />
  </Picker>
</View>

<Text style={styles.filterLabel}>Orden</Text>
<View style={{ backgroundColor: "#f5f5f5", borderRadius: 8, marginBottom: 20 }}>
  <Picker
    selectedValue={sortDirection}
    onValueChange={(value) => setSortDirection(value)}
    style={{ minHeight: 50, width: "100%" }}
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
    </View>
  </View>
</Modal>
  </View>

        )}
      </ScrollView>

      
    </SafeAreaView>
  )
}

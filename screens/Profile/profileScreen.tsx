import { useState } from "react"
import { View, Text, TouchableOpacity, Image, ScrollView, Alert } from "react-native"
import { FontAwesome, Ionicons } from "@expo/vector-icons"
import { useAuth } from "../../context/authContext"
import { handleUserLogout, mockReviews } from "./profileBackend"
import { styles } from "./profileStyles"
import { widthPercentageToDP as wp } from "react-native-responsive-screen"

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth()
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [reviews, setReviews] = useState(mockReviews)
  const [filteredReviews, setFilteredReviews] = useState(mockReviews)
  const [starFilter, setStarFilter] = useState(0)
  const [distanceFilter, setDistanceFilter] = useState(0)
  const [profileImage, setProfileImage] = useState<string | null>(null)

  const handleLogout = () => {
    handleUserLogout(logout, navigation)
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
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>

          <Text style={styles.headerTitle}>Mi Perfil</Text>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

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
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Información Personal</Text>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color="#ff9500" />
                <Text style={styles.infoLabel}>Nombre de usuario:</Text>
                <Text style={styles.infoValue}>{user?.name || "Nombre no disponible"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color="#ff9500" />
                <Text style={styles.infoLabel}>Correo electrónico:</Text>
                <Text style={styles.infoValue}>{user?.email || "Correo no disponible"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color="#ff9500" />
                <Text style={styles.infoLabel}>Miembro desde:</Text>
                <Text style={styles.infoValue}>Junio 2023</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.reviewsContent}>
            <View style={styles.filtersContainer}>
              <Text style={styles.filtersTitle}>Filtrar por:</Text>

              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Estrellas:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.starsFilter}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={`star-${star}`}
                      style={[styles.starButton, starFilter === star && styles.activeStarButton]}
                      onPress={() => filterReviewsByStars(star)}
                    >
                      <Text style={styles.starButtonText}>{star} ⭐</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Distancia:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.distanceFilter}>
                  {[1, 3, 5, 10].map((dist) => (
                    <TouchableOpacity
                      key={`dist-${dist}`}
                      style={[styles.distanceButton, distanceFilter === dist && styles.activeDistanceButton]}
                      onPress={() => filterReviewsByDistance(dist)}
                    >
                      <Text style={styles.distanceButtonText}>{dist} km</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {(starFilter > 0 || distanceFilter > 0) && (
                <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                  <Text style={styles.resetButtonText}>Limpiar filtros</Text>
                </TouchableOpacity>
              )}
            </View>

            {filteredReviews.length > 0 ? (
              filteredReviews.map((review, index) => (
                <View key={index} style={styles.reviewCard}>
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
                    {review.tags.map((tag, tagIndex) => (
                      <View key={tagIndex} style={styles.reviewTag}>
                        <Text style={styles.reviewTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyReviews}>
                <Ionicons name="document-text-outline" size={60} color="#ccc" />
                <Text style={styles.emptyReviewsText}>No hay reseñas que coincidan con los filtros</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      
    </View>
  )
}

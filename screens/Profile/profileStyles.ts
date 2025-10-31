import { StyleSheet } from "react-native"
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen"

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ff9500",
  },
  scrollView: {
    flex: 1,
    paddingBottom: hp("10%"),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp("5%"),

    paddingBottom: hp("2%"),
  },
  headerTitle: {
    fontSize: wp("5%"),
    fontWeight: "bold",
    color: "white",
  },
  backButton: {
    padding: wp("2%"),
  },
  editButton: {
    padding: wp("2%"),
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: hp("3%"),
  },
  avatarContainer: {
    position: "relative",
    marginBottom: hp("1.5%"),
  },
  avatar: {
    width: wp("30%"),
    height: wp("30%"),
    borderRadius: wp("15%"),
    borderWidth: 3,
    borderColor: "white",
  },
  avatarPlaceholder: {
    width: wp("30%"),
    height: wp("30%"),
    borderRadius: wp("15%"),
    backgroundColor: "#FFC266",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  avatarText: {
    fontSize: wp("12%"),
    fontWeight: "bold",
    color: "white",
  },
  addPhotoIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#ff9500",
    width: wp("8%"),
    height: wp("8%"),
    borderRadius: wp("4%"),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  name: {
    fontSize: wp("6%"),
    fontWeight: "bold",
    color: "white",
    marginBottom: hp("0.5%"),
  },
  email: {
    fontSize: wp("3.5%"),
    color: "white",
    marginBottom: hp("2%"),
  },
  tabsContainer: {
    flexDirection: "row",
    marginTop: hp("2%"),
    backgroundColor: "white",
    borderTopLeftRadius: wp("8%"),
    borderTopRightRadius: wp("8%"),
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: hp("2%"),
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#ff9500",
  },
  tabText: {
    fontSize: wp("4%"),
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "#ff9500",
    fontWeight: "bold",
  },
  profileContent: {
    backgroundColor: "white",
    paddingHorizontal: wp("5%"),
    paddingBottom: hp("10%"),
    minHeight: hp("50%"),
  },
  infoCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: wp("5%"),
    padding: wp("5%"),
    marginVertical: hp("2%"),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoCardTitle: {
    fontSize: wp("4.5%"),
    fontWeight: "bold",
    color: "#333",
    marginBottom: hp("2%"),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp("1.5%"),
  },
  infoLabel: {
    fontSize: wp("3.8%"),
    color: "#666",
    marginLeft: wp("2%"),
    marginRight: wp("1%"),
  },
  infoValue: {
    fontSize: wp("3.8%"),
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  logoutButton: {
    backgroundColor: "#ff9500",
    paddingVertical: hp("1.5%"),
    borderRadius: wp("5%"),
    alignItems: "center",
    marginTop: hp("2%"),
  },
  logoutText: {
    color: "white",
    fontSize: wp("4%"),
    fontWeight: "bold",
  },
  reviewsContent: {
    backgroundColor: "white",
    paddingHorizontal: wp("5%"),
    paddingBottom: hp("10%"),
    minHeight: hp("50%"),
  },
  filtersContainer: {
    backgroundColor: "#f8f8f8",
    borderRadius: wp("5%"),
    padding: wp("4%"),
    marginVertical: hp("2%"),
  },
  filtersTitle: {
    fontSize: wp("4%"),
    fontWeight: "bold",
    color: "#333",
    marginBottom: hp("1%"),
  },
  filterGroup: {
    marginBottom: hp("1.5%"),
  },
  filterGroupTitle: {
    fontSize: wp("3.5%"),
    color: "#666",
    marginBottom: hp("0.5%"),   
  },
  starsFilter: {
    flexDirection: "row",
  },
  starButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: wp("3%"),
    paddingVertical: hp("0.8%"),
    borderRadius: wp("4%"),
    marginRight: wp("2%"),
  },
  activeStarButton: {
    backgroundColor: "#FFA500",
  },
  starButtonText: {
    fontSize: wp("3.5%"),
    color: "#333",
  },
  distanceFilter: {
    flexDirection: "row",
  },
  distanceButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: wp("3%"),
    paddingVertical: hp("0.8%"),
    borderRadius: wp("4%"),
    marginRight: wp("2%"),
  },
  activeDistanceButton: {
    backgroundColor: "#ff9500",
  },
  distanceButtonText: {
    fontSize: wp("3.5%"),
    color: "#333",
  },
  resetButton: {
    backgroundColor: "#e0e0e0",
    paddingVertical: hp("1%"),
    borderRadius: wp("4%"),
    alignItems: "center",
    marginTop: hp("1%"),
  },
  resetButtonText: {
    fontSize: wp("3.5%"),
    color: "#666",
  },
  reviewCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: wp("5%"),
    padding: wp("4%"),
    marginBottom: hp("2%"),
    alignSelf: 'stretch',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: hp("1%"),
    alignItems: 'flex-start',
  },
  reviewPlaceName: {
    flex: 1,
    flexShrink: 1,
    fontSize: wp("4.5%"),
    fontWeight: "bold",
    color: "#333",
  },
  reviewDate: {
    fontSize: wp("3%"),
    color: "#999",
  },
  reviewRatingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp("1%"),
  },
  reviewDistance: {
    fontSize: wp("3.5%"),
    color: "#666",
  },
  reviewTextWrapper: {
    alignSelf: 'stretch',   // asegura ancho completo para el párrafo
    width: '100%',
  },
  reviewText: {
    fontSize: wp("3.8%"),
    color: "#333",
    marginBottom: hp("1.5%"),
    lineHeight: hp("2.5%"),
    alignSelf: 'stretch',      // ocupa todo el ancho disponible
    width: '100%',             // evita “columnas angostas”
    includeFontPadding: false, // Android: quita padding fantasma arriba/abajo
    textAlignVertical: 'top',  // Android: ancla arriba
    textAlign: 'left',      // bordes más rectos (última línea queda normal)
    paddingRight: 1,           // Android: evita clipping del último carácter
    // opcional si ves dientes en textos cortos:
    // letterSpacing: 0.2,
  },
  reviewTags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  reviewTag: {
    backgroundColor: "#ff9500",
    paddingHorizontal: wp("2%"),
    paddingVertical: hp("0.5%"),
    borderRadius: wp("3%"),
    marginRight: wp("2%"),
    marginBottom: hp("0.5%"),
  },
  reviewTagText: {
    fontSize: wp("3%"),
    color: "white",
  },
  emptyReviews: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp("10%"),
  },
  emptyReviewsText: {
    fontSize: wp("4%"),
    color: "#999",
    textAlign: "center",
    marginTop: hp("2%"),
  },
  overlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  zIndex: 1,
},

settingsPanel: {
  position: "absolute",
  top: 0,
  right: 0,
  left: 0,
  backgroundColor: "white",
  paddingTop: 40,
  paddingHorizontal: 20,
  paddingBottom: 30,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  zIndex: 2,
},

settingsTitle: {
  fontSize: 20,
  fontWeight: "bold",
  color: "#ff9500",
  marginBottom: 20,
},

settingsOption: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 15,
  borderBottomWidth: 1,
  borderBottomColor: "#eee",
},

settingsOptionText: {
  fontSize: 16,
  marginLeft: 10,
  color: "#333",
},
sidePanelRight: {
  position: "absolute",
  top: 0,
  bottom: 0,
  right: 0, // se pega al lado derecho
  width: "75%",
  backgroundColor: "white",
  paddingTop: 50,
  paddingHorizontal: 20,
  zIndex: 2,
  elevation: 5,
  shadowColor: "#000",
  shadowOffset: { width: -2, height: 0 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
},
settingsDivider: {
  height: 1,
  backgroundColor: "#eee",
  marginVertical: 10,
},
sectionTitle: {
  fontSize: wp("5%"),
  fontWeight: "bold",
  color: "#333",
  marginTop: hp("2%"),
  marginBottom: hp("1%"),
},

statsGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
},

statCard: {
  width: "48%",
  backgroundColor: "#f8f8f8",
  borderRadius: wp("4%"),
  alignItems: "center",
  paddingVertical: hp("2%"),
  marginBottom: hp("2%"),
  elevation: 2,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
},

statLabel2: {
  fontSize: wp("3.5%"),
  color: "#666",
  marginTop: hp("1%"),
},

statValue: {
  fontSize: wp("5%"),
  fontWeight: "bold",
  color: "#333",
},

recentItem: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: hp("1%"),
  borderBottomWidth: 1,
  borderBottomColor: "#eee",
},

recentPlace: {
  fontSize: wp("4%"),
  color: "#333",
},

emptyText: {
  fontSize: wp("3.8%"),
  color: "#999",
  marginTop: hp("1%"),
  textAlign: "center",
},
sectionHeader: {
  backgroundColor: "#fff3e0",
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 8,
  marginTop: 16,
  marginBottom: 8,
},

sectionHeaderText: {
  fontSize: 16,
  fontWeight: "bold",
  color: "#ff9500",
},

recentList: {
  paddingVertical: 10,
},

recentCard: {
  backgroundColor: "#f8f8f8",
  borderRadius: 12,
  width: 140,
  marginRight: 12,
  alignItems: "center",
  padding: 12,
  elevation: 2,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
},

recentIcon: {
  backgroundColor: "#ff9500",
  borderRadius: 30,
  width: 50,
  height: 50,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 8,
},

recentPlace2: {
  fontSize: 14,
  fontWeight: "600",
  color: "#333",
  textAlign: "center",
},

filtersRow: {
  flexDirection: "column",
  backgroundColor: "#f8f8f8",
  borderRadius: 10,
  padding: 10,
  marginVertical: 10,
},

starFilterContainer: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 8,
},

filterLabel: {
  fontSize: 14,
  fontWeight: "600",
  color: "#333",
},

distanceChips: {
  flexDirection: "row",
  flexWrap: "wrap",
  marginTop: 5,
},

distanceChip: {
  backgroundColor: "#eee",
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 20,
  marginRight: 8,
},

activeDistanceChip: {
  backgroundColor: "#ff9500",
},

distanceChipText: {
  fontSize: 13,
  color: "#333",
},

clearFiltersButton: {
  alignSelf: "flex-end",
  marginTop: 8,
},

deleteReviewButton: {
  position: "absolute",
  bottom: 8,
  right: 8,
  zIndex: 1,
},

loadMoreButton: {
  alignItems: "center",
  paddingVertical: 10,
  marginTop: 5,
  backgroundColor: "#ff9500",
  borderRadius: 8,
},

loadMoreText: {
  color: "white",
  fontWeight: "bold",
},

filtersPanel: {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: "white",
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  padding: 20,
  elevation: 5,
  zIndex: 2,
},

searchBarContainer: {
  flexDirection: "row",
  alignItems: "center",
  marginHorizontal: 16,
  marginTop: 12,
  marginBottom: 16,
  
},
searchInputWrapper: {
  flex: 1,
  flexDirection: "row",
  backgroundColor: "#f0f0f0",
  borderRadius: 12,
  alignItems: "center",
  paddingHorizontal: 10,
    shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 3,
},
searchInput: {
  flex: 1,
  fontSize: 16,
  paddingVertical: 8,
  color: "#333",
},
filterButton: {
  backgroundColor: "#ff9500",
  borderRadius: 10,
  padding: 10,
  marginLeft: 10,
},
customSlider: {
  width: "100%",
  marginVertical: 20,
},
activeSortButton: {
  backgroundColor: "#ff9500",
},
clearFiltersButtonBig: {
  marginTop: 20,
  backgroundColor: "#ccc",
  padding: 12,
  borderRadius: 10,
  alignItems: "center",
},
clearFiltersText: {
  color: "#000",
  fontWeight: "600",
},
starsRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 15,
  marginTop: 15,
  paddingHorizontal: 10,
},

sortButtonsContainer: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  marginVertical: 10,
  gap: 10,
},

sortButton: {
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 12,
  backgroundColor: "#f0f0f0",
},

sortButtonActive: {
  backgroundColor: "#ff9500",
},

sortButtonText: {
  color: "#333",
  fontSize: 14,
},

sortButtonTextActive: {
  color: "white",
},

pickerContainer: {
  
}
})

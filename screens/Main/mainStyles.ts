import { StyleSheet, Dimensions } from "react-native"

import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen"

const { width, height } = Dimensions.get("window")

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#feead8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#feead8",
  },
  searchContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  searchBlock: {
    backgroundColor: "white",
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    paddingHorizontal: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  predictionList: {
    maxHeight: 200,
    backgroundColor: "white",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  predictionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  predictionText: {
    fontSize: 14,
    color: "#333",
  },
  filtersScrollView: {
    marginTop: 15,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    gap: 10,
    paddingRight: 40, // Extra padding at the end
  },
  filterButton: {
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    minWidth: 80, // Ensure consistent button sizes
  },
  activeFilterButton: {
    backgroundColor: "#ff9500",
  },
  filterText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  activeFilterText: {
    color: "white",
  },
  activeFiltersLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  activeFiltersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  activeFilterChipRemove: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  clearFiltersButton: {
    alignSelf: "flex-end",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  clearFiltersText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "500",
  },
  floatingButtons: {
    position: "absolute",
    bottom: height * 0.1,
    right: 20,
    gap: 10,
  },
  floatButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  carouselContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    height: 200,
  },
  carouselCard: {
    backgroundColor: "white",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  cardImageSection: {
    height: 120,
    flexDirection: "row",
    gap: 5,
    padding: 8,
  },
  cardMainImageContainer: {
    flex: 2,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  cardSideImagesContainer: {
    flex: 1,
    gap: 5,
  },
  cardSideImageContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  cardImagePlaceholder: {
    color: "#999",
    fontSize: 12,
    textAlign: "center",
  },
  cardInfoSection: {
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardLeftInfo: {
    flex: 1,
    marginRight: 10,
  },
  cardRightInfo: {
    alignItems: "flex-end",
  },
  placeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  badge: {
    backgroundColor: "#e8f5e8",
    color: "#2d5a2d",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 11,
    fontWeight: "500",
  },
  placeRating: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 3,
  },
  placeDistance: {
    fontSize: 12,
    color: "#666",
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#ccc",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
  },
  bottomSheetContent: {
    flex: 1,
    padding: 20,
  },
  bottomSheetText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginTop: 20,
  },
  imageSection: {
    height: 200,
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  mainImageContainer: {
    flex: 2,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  sideImagesContainer: {
    flex: 1,
    gap: 10,
  },
  sideImageContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholder: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },
  sideImagePlaceholder: {
    color: "#999",
    fontSize: 12,
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 25,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "#FF9500",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "600",
  },
  tabContent: {
    flex: 1,
  },
  infoTabContent: {
    flex: 1,
  },
  infoActionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
  },
  infoActionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  reviewCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: wp("5%"),
    padding: wp("4%"),
    marginBottom: hp("2%"),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp("1%"),
  },
  reviewRatingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp("1%"),
  },
  reviewText: {
    fontSize: wp("3.8%"),
    color: "#333",
    marginBottom: hp("1.5%"),
    lineHeight: hp("2.5%"),
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
  addReviewCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: wp("5%"),
    padding: wp("4%"),
    marginBottom: hp("2%"),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  addReviewTitle: {
    fontWeight: "800",
    fontSize: wp("4.2%"),
    color: "#333",
    marginBottom: hp("1%"),
  },
  addReviewStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    //marginBottom: hp("1%"),
  },
  addReviewHint: {
    marginLeft: 8,
    color: "#555",
    fontSize: wp("3.4%"),
  },
  addReviewInput: {
    minHeight: hp("12%"),
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: wp("3.5%"),
    paddingHorizontal: wp("3%"),
    paddingVertical: hp("1%"),
    backgroundColor: "#fff",
    marginTop: hp("0.7%"),
    marginBottom: hp("0.7%"),
    textAlignVertical: "top",
    color: "#333",
    fontSize: wp("3.8%"),
  },
  addReviewTagsInput: {
    height: hp("6%"),
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: wp("3.5%"),
    paddingHorizontal: wp("3%"),
    backgroundColor: "#fff",
    marginBottom: hp("1.5%"),
    color: "#333",
    fontSize: wp("3.6%"),
  },
  addReviewButton: {
    backgroundColor: "#FF9500",
    paddingVertical: hp("1.8%"),
    borderRadius: wp("3.5%"),
    alignItems: "center",
  },
  addReviewButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: wp("3.8%"),
  },
  
  tagButton: {
    flex: 1,                          // todos ocupan mismo espacio
    marginHorizontal: wp("1.2%"),     // separación uniforme
    paddingVertical: hp("1.2%"),
    borderRadius: wp("3%"),
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
    alignItems: "center",             // centra el texto
    justifyContent: "center",
  },
  
  tagButtonActive: {
    backgroundColor: "#FF9500",
    borderColor: "#FF9500",
    shadowOpacity: 0.1,
    elevation: 2,
  },
  
  tagButtonText: {
    fontSize: wp("3.4%"),
    color: "#333",
    fontWeight: "600",
  },
  
  tagButtonTextActive: {
    color: "#fff",
  },

  // === Chips para etiquetas de reseña ===
tagButtonsRow: {
  flexDirection: "row",
  flexWrap: "wrap",          // si no entran, baja prolijo a 2da línea
  alignItems: "center",
  gap: 8,                    // usa gap como ya usás en otros bloques
  //marginTop: 8,
  marginBottom: 18,
},

tagChip: {
  flexShrink: 0,
  borderRadius: 999,         // pill
  paddingHorizontal: 12,
  paddingVertical: 6,
  backgroundColor: "#F5F5F5",
  borderWidth: 1,
  borderColor: "#EAEAEA",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 32,             // altura consistente
},

tagChipActive: {
  backgroundColor: "#FF9500",
  borderColor: "#FF9500",
},

tagChipText: {
  fontSize: 12,              // chico, estilo “tag”
  fontWeight: "700",
  color: "#333",
},

tagChipTextActive: {
  color: "#fff",
},

starsRow: {
  flexDirection: "row",
  alignItems: "center",
},

starTouchable: {
  paddingHorizontal: 3,   // ⬅️ agranda área sin crecer el ícono
  paddingVertical: 6,
  marginRight: 4,
},

})

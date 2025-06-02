import { StyleSheet, Dimensions } from "react-native"

const { width, height } = Dimensions.get("window")

// Export the absoluteFillObject separately for TypeScript compatibility
export const absoluteFillObject = {
  position: "absolute",
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ff9500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    position: "absolute",
    top: height * 0.07,
    width: "100%",
    alignItems: "center",
  },
searchBar: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: width * 0.025,
  height: height * 0.05,
},
searchInput: {
  flex: 1,
  marginLeft: width * 0.02,
  color: "#000",
},
  searchBlock: {
    backgroundColor: "white",
    borderRadius: width * 0.03,
    width: width * 0.9,
    alignSelf: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: height * 0.01,
  },


  filters: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    paddingHorizontal: width * 0.025,
  },
  filterButton: {
    backgroundColor: "white",
    borderRadius: width * 0.03,
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.008,
    marginHorizontal: width * 0.01,
  },
  filterText: {
    fontSize: width * 0.032,
    color: "#000",
  },/*
  shadowOverlay: {
    position: "absolute",
    bottom: height * 0.074,
    width: "100%",
    height: height * 0.004,
    backgroundColor: "#000",
    opacity: 0.5,
    zIndex: 9,
  },*/
  bottomNav: {
    position: "absolute",
    bottom: 0,
    height: height * 0.075,
    width: "100%",
    backgroundColor: "#ff9500",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderColor: "#eee",
    zIndex: 10,
  },
predictionList: {
  maxHeight: height * 0.25,
  borderTopWidth: 1,
  borderColor: "#eee",
},
  predictionItem: {
    padding: height * 0.013,
  },
  predictionText: {
    fontSize: width * 0.042,
    color: "#000",
  },
  floatingButtons: {
    position: "absolute",
    bottom: height * 0.1,
    right: width * 0.05,
    flexDirection: "column",
    alignItems: "flex-end",
    gap: height * 0.015,
  },
  floatButton: {
    backgroundColor: "#ff9500",
    padding: height * 0.012,
    borderRadius: 50,
    elevation: 3,
  },
  placeCard: {
    position: "absolute",
    height: height * 0.15,
    bottom: height * 0.115,
    left: width * 0.1,
    right: width * 0.1,
    backgroundColor: "white",
    borderRadius: width * 0.04,
    padding: width * 0.04,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10,
  },
  placeName: {
    fontSize: width * 0.045,
    fontWeight: "bold",
    marginTop: height * -0.006,
    marginBottom: height * 0.004,
  },
  placeRating: {
    fontSize: width * 0.035,
    color: "#333",
    marginBottom: height * 0.001,
  },
  placeDistance: {
    fontSize: width * 0.035,
    color: "#333",
    marginBottom: height * 0.01,
  },
  carouselContainer: {
    position: "absolute",
    bottom: height * 0.115,
    height: height * 0.18,
    width: "100%",
    alignItems: "center", // Add this to center the FlatList
  },
  carouselCard: {
  backgroundColor: "white",
  borderRadius: 16,
  padding: 16,
  elevation: 4,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  justifyContent: "center",
  // Removemos width de aquí porque se define dinámicamente
},
  badges: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },

  /*
  carouselNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    top: height * 0.07,
    left: width * 0.05,
    right: width * 0.05,
    zIndex: 10,
  },
  
  carouselNavButton: {
    backgroundColor: "white",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },*/
  badge: {
    backgroundColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
  },
  // Bottom sheet styles
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    zIndex: 20,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 10,
  },
  bottomSheetContent: {
    padding: 20,
    flex: 1,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  bottomSheetTitle: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    flex: 1,
  },
  favoriteButton: {
    padding: 8,
  },
  bottomSheetRating: {
    fontSize: width * 0.04,
    color: "#333",
    marginBottom: 5,
  },
  bottomSheetDistance: {
    fontSize: width * 0.04,
    color: "#333",
    marginBottom: 15,
  },
  bottomSheetBadges: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 10,
  },
  bottomSheetDescription: {
    fontSize: width * 0.04,
    color: "#666",
    marginTop: 20,
    textAlign: "center",
  },
  
})

import { StyleSheet } from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";


export const styles = StyleSheet.create({
  // contenedor principal con fondo claro como en Main
  safeAreaV2: {
    flex: 1,
    backgroundColor: "#feead8",
  },


  header: {
    paddingHorizontal: 16,
    paddingTop: hp("2%"),
  },


  helloText: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  wave: { fontSize: 22 },


  searchBar: {
    marginTop: -10,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },


  chipsRow: {
  flexDirection: "row",
  paddingHorizontal: 10,
  gap: 10,
  paddingRight: 40, // igual que en main
  marginTop: 15,
  },


  // Cards
  cardV2: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    width: wp("92%"),
    alignSelf: "center",
    marginTop: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardImage: {
    width: "100%",
    height: 180,
  },
  cardInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: "#4B5563",
  },
  dot: {
    color: "#9CA3AF",
    marginHorizontal: 6,
  },
  heartBtn: {
    padding: 8,
    marginLeft: 8,
  },


  // Estado vacío
  emptyContainerV2: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
  },
});


export const tagStyle = {
  container: {
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    minWidth: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500" as const,
  },
  containerSelected: {
    backgroundColor: "#ff9500",
  },
  textSelected: {
    color: "white",
  },
};

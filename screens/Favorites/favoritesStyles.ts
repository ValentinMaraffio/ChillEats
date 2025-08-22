import { StyleSheet } from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";


export const styles = StyleSheet.create({
  // contenedor principal con fondo claro como en Main
  safeAreaV2: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },


  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
    marginBottom: 6,
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  text: {
    color: "#111827",
    fontWeight: "600" as const,
    fontSize: 13,
  },
  containerSelected: {
    backgroundColor: "#FFEDD5",
    borderColor: "#FDBA74",
  },
  textSelected: {
    color: "#9A3412",
  },
};
import { StyleSheet } from "react-native"
import { heightPercentageToDP as hp } from "react-native-responsive-screen"

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FF9500",
  },
  background: {
    flex: 1,
  },
  filters: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    paddingHorizontal: 10,
    marginTop: hp("6%"),
  },
  filterButton: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 2,
  },
  filterText: {
    fontSize: 16,
    color: "#000",
  },
  card: {
    backgroundColor: "#fff",
    marginVertical: 12,
    padding: 30,
    borderRadius: 30,
    elevation: 5,
    marginTop: hp("5%"),
    width: "80%",
    alignSelf: "center",
    shadowColor: "#000000",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  subtext: {
    color: "#555",
  },
  tagsRow: {
    flexDirection: "row",
    marginTop: 5,
  },
  cardIcon: {
    marginLeft: 10,
  },
  favoriteButton: {
    padding: 10,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: hp("1.5%"),
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#FF9500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    color: "#f8f8f8",
    textAlign: "center",
    opacity: 0.8,
  },
})

export const tagStyle = {
  container: {
    backgroundColor: "#FFBB5C",
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 5,
    borderRadius: 5,
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "bold" as const,
  },
}

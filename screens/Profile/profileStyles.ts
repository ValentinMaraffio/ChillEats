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
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "80%",
    marginTop: hp("1%"),
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: wp("5%"),
    fontWeight: "bold",
    color: "white",
  },
  statLabel: {
    fontSize: wp("3%"),
    color: "white",
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
  reviewPlaceName: {
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
})

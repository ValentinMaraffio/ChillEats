import { StyleSheet } from "react-native"
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen"

export const styles = StyleSheet.create({
  scrollContent: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingBottom: hp("30%"),
    width: "100%",
  },
  content: {
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
  },
  backButton: {
    position: "absolute",
    top: hp("6%"),
    left: wp("5%"),
    zIndex: 1,
    padding: wp("2%"),
  },
  TextInput: {
    borderBottomWidth: 1,
    borderColor: "white",
    width: wp("80%"),
    marginTop: hp("2.5%"),
    color: "white",
    paddingVertical: hp("0.5%"),
  },
  loginButton: {
    backgroundColor: "white",
    paddingVertical: hp("2%"),
    borderRadius: wp("8%"),
    marginTop: hp("2.5%"),
    width: wp("50%"),
  },
  buttonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: wp("4%"),
    textAlign: "center",
  },
  forgotText: {
    color: "white",
    margin: hp("2%"),
    fontSize: wp("3.5%"),
    textDecorationLine: "underline",
  },
  registerText: {
    color: "white",
    fontSize: wp("3.5%"),
    textDecorationLine: "underline",
    marginBottom: hp("2%"),
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    paddingVertical: hp("1.2%"),
    borderRadius: wp("2%"),
    marginTop: hp("1.5%"),
    width: wp("90%"),
    gap: wp("2%"),
  },
  iconStyle: {
    width: wp("50%"),
    height: wp("50%"),
    marginTop: hp("10%"),
  },
  socialIconStyle: {
    width: wp("7%"),
    height: wp("7%"),
  },
})

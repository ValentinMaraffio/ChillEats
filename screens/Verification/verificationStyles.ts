import { StyleSheet } from "react-native"
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen"

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: wp("5%"),
  },
  backButton: {
    position: "absolute",
    top: hp("6%"),
    left: wp("5%"),
  },
  title: {
    fontSize: wp("10%"),
    fontWeight: "bold",
    color: "white",
    marginBottom: hp("2%"),
  },
  subtitle: {
    fontSize: wp("4%"),
    color: "white",
  },
  email: {
    fontSize: wp("4%"),
    color: "white",
    fontWeight: "bold",
    marginBottom: hp("3%"),
  },
  input: {
    width: "80%",
    borderBottomWidth: 1,
    borderColor: "white",
    color: "white",
    paddingVertical: hp("1%"),
    marginBottom: hp("3%"),
  },
  verifyButton: {
    backgroundColor: "white",
    borderRadius: wp("5%"),
    paddingVertical: hp("1.5%"),
    paddingHorizontal: wp("10%"),
    marginBottom: hp("2%"),
  },
  verifyText: {
    color: "#000",
    fontSize: wp("4%"),
    fontWeight: "bold",
  },
  resendButton: {
    marginTop: hp("1%"),
  },
  resendText: {
    color: "white",
    textDecorationLine: "underline",
    fontSize: wp("3.8%"),
  },
  emailIcon: {
    width: wp("45 %"),
    height: wp("45%"),
    marginBottom: hp("3%"),
    marginTop: hp("5%"),
  },
  codeInputWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginVertical: 20,
    position: "relative",
  },
  codeBox: {
    width: 48,
    height: 56,
    borderRadius: 8,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ccc",
  },
  activeBox: {
    borderColor: "#000",
  },
  codeDigit: {
    fontSize: 24,
    color: "black",
  },
  hiddenFocusableInput: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 0,
  },
})
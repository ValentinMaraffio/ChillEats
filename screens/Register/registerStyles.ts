import { StyleSheet } from "react-native"
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen"

export const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingBottom: hp("4%"),
    width: "100%",
    backgroundColor: '#feead8',
  },
  scrollContent: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingBottom: hp("15%"),
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
    borderColor: "#ff9500",
    width: wp("80%"),
    marginTop: hp("2.5%"),
    color: "#ff9500",
    paddingVertical: hp("0.5%"),
  },
  signInButton: {
    backgroundColor: "#ff9500",
    paddingVertical: hp("2%"),
    borderRadius: wp("8%"),
    marginTop: hp("2.5%"),
    width: wp("50%"),
    display: "flex",
  },
  login: {
    marginTop: hp("1.2%"),
  },
  buttonText: {
    color: "#ff9500",
    fontWeight: "bold",
    fontSize: wp("4%"),
    textAlign: "center",
  },

  buttonText2: {
    color: "white",
    fontWeight: "bold",
    fontSize: wp("4%"),
    textAlign: "center",
  },

  buttonTextLogin: {
    color: "white",
    fontWeight: "400",
    fontSize: wp("3.5%"),
    textAlign: "center",
    textDecorationLine: "underline",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: hp("2%"),
    width: wp("80%"),
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ff9500",
    opacity: 0.6,
  },
  dividerText: {
    marginHorizontal: wp("2.5%"),
    color: "#ff9500",
    fontWeight: "bold",
  },
    continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: "#ff9500",
    borderWidth: 1,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: hp('1.5%'),
    width: wp('90%'),
    gap: wp('2%'),
    backgroundColor: 'transparent',
    },

  TermsText: {
    color: "#ff9500",
    textAlign: "center",
    width: wp("80%"),
    marginTop: hp("2.5%"),
    fontSize: wp("3.2%"),
    lineHeight: hp("2.8%"),
  },
  iconStyle: {
    width: 450,
    height: wp("40%"),
    marginTop: hp("6%"),
  },
  socialIconStyle: {
    width: wp("7%"),
    height: wp("7%"),
  },
})

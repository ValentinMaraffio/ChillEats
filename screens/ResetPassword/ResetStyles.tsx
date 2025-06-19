import { StyleSheet } from "react-native"
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  subtitle:{
    fontSize:15,
    fontWeight: "regular",
    color: "white",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "white",
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    color: "white",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "white",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "black",
    fontSize: 20,
    fontWeight: "bold",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#ff9500",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  forgotText: {
      color: 'white',
      margin: hp('2%'),
      fontSize: wp('4.5%'),
      textDecorationLine: 'underline',
    },
    backButton: {
    position: "absolute",
    top: hp("6%"),
    left: wp("5%"),
  },
  
})

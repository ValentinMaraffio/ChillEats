import { StyleSheet } from "react-native"

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 30,
    marginTop: -40,
    left: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ff9500",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#ff9500",
    marginBottom: 30,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
  },
  primaryButton: {
    backgroundColor: "#ff9500",
    padding: 15,
    borderRadius: 30,
    marginBottom: 15,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  secondaryButton: {
    borderColor: "#ff9500",
    borderWidth: 1,
    padding: 15,
    borderRadius: 30,
  },
  secondaryButtonText: {
    color: "#ff9500",
    textAlign: "center",
    fontWeight: "bold",
  },

})

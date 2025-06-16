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
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 30,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
  },
  primaryButton: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 30,
    marginBottom: 15,
  },
  primaryButtonText: {
    color: "#FB8C00",
    fontWeight: "bold",
    textAlign: "center",
  },
  secondaryButton: {
    borderColor: "#fff",
    borderWidth: 1,
    padding: 15,
    borderRadius: 30,
  },
  secondaryButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },

})

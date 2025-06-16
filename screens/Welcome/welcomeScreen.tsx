import { View, Text, TouchableOpacity, Image } from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import { styles } from "./welcomeStyle"
import { LinearGradient } from 'expo-linear-gradient';


const WelcomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
        <LinearGradient
          colors={['#ff4500', '#ffab40']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.container}
        >
      <Image source={require("../../assets/img/icon-1.png")} style={styles.logo} />
      <Text style={styles.title}>¡Bienvenido a ChillEats!</Text>
      <Text style={styles.subtitle}>Descubre los mejores restaurantes cerca de ti</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("Register")}>
          <Text style={styles.primaryButtonText}>Crear Cuenta</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.secondaryButtonText}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default WelcomeScreen

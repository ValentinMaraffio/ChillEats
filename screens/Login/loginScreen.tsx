import { StatusBar } from "expo-status-bar"
import {
  TouchableOpacity,
  Text,
  View,
  Image,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useState } from "react"
import { useAuth } from "../../context/authContext"
import { useKeyboardVisibility } from "../../hooks/useKeyboardVisibility"
import { Ionicons } from "@expo/vector-icons"
import BtnLoginiGoogle from '../../components/btnLoginGoogle'
import { icon, googleLogo, appleLogo, type LoginNavigationProp } from "./loginBackend"
import { styles } from "./loginStyles"
import axios from "axios"
import { parseJwt } from "./loginBackend"

export default function LoginScreen() {
  const navigation = useNavigation<LoginNavigationProp>()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const isKeyboardVisible = useKeyboardVisibility()

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://172.16.1.95:8000/api/auth/signin', { email, password })
      const token = res.data.token
      await Promise.resolve(login(token))
      const decoded = parseJwt(token)

      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs", params: { screen: "User" } }],
      })
    } catch (error: any) {
      const data = error.response?.data
      if (data?.requiresVerification) {
        navigation.navigate('Verification', { email: data.email })
      } else {
        alert(data?.message || 'Ocurrió un error')
      }
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#feead8" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.scrollContent, { flex: 1 }]}>
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate("MainTabs", { screen: "User" })}
            >
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>

            <Image source={icon} style={styles.iconStyle} resizeMode="contain" />

            <TextInput
              style={styles.TextInput}
              placeholder="Email"
              placeholderTextColor="#ff9500"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.TextInput}
              placeholder="Contraseña"
              placeholderTextColor="#ff9500"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.buttonText2}>Iniciar Sesión</Text>
            </TouchableOpacity>

            <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </Pressable>

            <View>
              <BtnLoginiGoogle />
            </View>

            <TouchableOpacity style={styles.continueButton} onPress={() => alert("¡Botón presionado!")}>
              <Image source={appleLogo} style={styles.socialIconStyle} />
              <Text style={styles.buttonText}>Continuar con Apple</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
      <StatusBar style="dark" />
    </KeyboardAvoidingView>
  )
}

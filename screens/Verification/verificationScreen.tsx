import { useState, useEffect, useRef } from "react"
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  TouchableWithoutFeedback, // Import from react-native
  Alert, 
  Image,
  Keyboard 
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { FontAwesome } from "@expo/vector-icons"

import {
  type VerificationNavigationProp,
  type VerificationRouteProp,
  verifyCode,
  resendVerificationCode,
} from "./verificationBackend"
import { styles } from "./verificationStyles"
import { parseJwt } from "../Login/loginBackend"
import { useAuth } from "../../context/authContext"

export default function VerificationScreen() {
  const navigation = useNavigation<VerificationNavigationProp>()
  const route = useRoute<VerificationRouteProp>()
  const { email } = route.params

  const [code, setCode] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)
  
  // Add the missing ref
  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendCooldown])

  const { login } = useAuth()

  // Add the missing handleCodeChange function
  const handleCodeChange = (text: string) => {
    // Only allow numeric input and limit to 6 digits
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 6)
    setCode(numericText)
  }

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert("Error", "Por favor ingresa un código de 6 dígitos")
      return
    }

    const result = await verifyCode(email, code)
    Alert.alert(result.success ? "Éxito" : "Error", result.message)

    if (result.success && result.token) {
      await login(result.token)
      const userData = parseJwt(result.token)

      navigation.navigate("Profile", {
        name: userData.name,
        email: userData.email,
      })
    }
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0) return

    const result = await resendVerificationCode(email)
    Alert.alert(result.success ? "Éxito" : "Error", result.message)

    if (result.success) {
      setResendCooldown(30)
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Botón volver */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Login")}>
          <FontAwesome name="arrow-left" size={24} color="white" />
        </TouchableOpacity>

        {/* Email verification icon */}
        <Image
          source={require("../../assets/img/email.png")}
          style={styles.emailIcon}
          resizeMode="contain"
        />

        <Text style={styles.title}>Verifica tu correo</Text>
        <Text style={styles.subtitle}>Hemos enviado un código a:</Text>
        <Text style={styles.email}>{email}</Text>

        <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
          <View style={styles.codeInputWrapper}>
            {Array(6)
              .fill(null)
              .map((_, i) => {
                const isActive = i === code.length
                const isLast = code.length === 6 && i === 5
                const active = isActive || isLast

                return (
                  <View key={i} style={[styles.codeBox, active && styles.activeBox]}>
                    <Text style={styles.codeDigit}>{code[i] || ""}</Text>
                  </View>
                )
              })}
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={handleCodeChange}
              keyboardType="numeric"
              maxLength={6}
              autoFocus
              style={styles.hiddenFocusableInput}
            />
          </View>
        </TouchableWithoutFeedback>

        <TouchableOpacity 
          style={[styles.verifyButton, code.length !== 6 && { opacity: 0.5 }]} 
          onPress={handleVerify}
          disabled={code.length !== 6}
        >
          <Text style={styles.verifyText}>Verificar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resendButton, resendCooldown > 0 && { opacity: 0.5 }]}
          onPress={handleResendCode}
          disabled={resendCooldown > 0}
        >
          <Text style={styles.resendText}>
            {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : "Reenviar código"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  )
}
"use client"
import { FontAwesome } from "@expo/vector-icons"
import { useRef, useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  Pressable,
} 

from "react-native"
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import axios from "axios"
import { styles } from "./ResetStyles"
import { LinearGradient } from "expo-linear-gradient"


export default function ResetPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "ResetPassword">>()
  const route = useRoute<RouteProp<RootStackParamList, "ResetPassword">>()
  const { email } = route.params

  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showModal, setShowModal] = useState(false)

  const inputRef = useRef<TextInput>(null)

  const handleCodeChange = (text: string) => {
    if (text.length <= 6 && /^\d*$/.test(text)) {
      setCode(text)
    }
  }

  const handleValidateCode = async () => {
    try {
      const response = await axios.post("http://192.168.185.194:8000/api/auth/validate-forgot-password-code", {
        email,
        providedCode: code,
      })
      if (response.data.success) {
        setShowModal(true)
      }
    } catch (err: any) {
      Alert.alert("Código inválido", err?.response?.data?.message || "Verifica el código ingresado")
    }
  }

  const handleResetPassword = async () => {
    try {
      await axios.patch("http://192.168.185.194:8000/api/auth/verify-forgot-password-code", {
        email,
        providedCode: code,
        newPassword,
      })
      setShowModal(false)
      Alert.alert("Éxito", "Contraseña actualizada")
      navigation.navigate("Login")
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "No se pudo cambiar la contraseña")
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={['#ff4500', '#FF9500']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1 }} // <- Usamos flex: 1 directamente
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.innerContainer}>
            <Text style={styles.title}>Restablecer Contraseña</Text>
  
            <Text style={styles.label}>Ingresa el código (6 dígitos):</Text>
  
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Login")}>
              <FontAwesome name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
  
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
  
            <TouchableOpacity style={styles.button} onPress={handleValidateCode}>
              <Text style={styles.buttonText}>Validar Código</Text>
            </TouchableOpacity>
  
            <Modal visible={showModal} transparent animationType="slide">
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.title}>Nueva Contraseña</Text>
                  <Text style={styles.subtitle}>Por favor ingrese una nueva contraseña</Text>
  
                  <TextInput
                    style={styles.input}
                    placeholder="Nueva contraseña"
                    placeholderTextColor="white"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Repita contraseña"
                    placeholderTextColor="white"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
  
                  <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                    <Text style={styles.buttonText}>Guardar</Text>
                  </TouchableOpacity>
  
                  <Pressable onPress={() => navigation.navigate("Login")}>
                    <Text style={styles.forgotText}>Cancelar</Text>
                  </Pressable>
                </View>
              </View>
            </Modal>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  )
  
}
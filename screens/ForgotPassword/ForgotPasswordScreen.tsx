import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { styles } from './ForgotStyles';
import axios from 'axios';
import { useKeyboardVisibility } from "../../hooks/useKeyboardVisibility" 
import { FontAwesome } from "@expo/vector-icons"

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>>();
  const [email, setEmail] = useState('');
  const isKeyboardVisible = useKeyboardVisibility()

  const handleSendCode = async () => {
    try {
      await axios.patch('http://192.168.0.6:8000/api/auth/send-forgot-password-code', { email });
      Alert.alert('Éxito', 'Código enviado a tu correo');
      navigation.navigate('ResetPassword', { email });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Error al enviar el código');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Login")}>
                <FontAwesome name="arrow-left" size={24} color="white" />
              </TouchableOpacity>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <Text style={styles.title}>Recuperar Contraseña</Text>
          <Text style={styles.label}>Introduce tu correo electrónico:</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="white"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity style={styles.button} onPress={handleSendCode}>
            <Text style={styles.buttonText}>Enviar código</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

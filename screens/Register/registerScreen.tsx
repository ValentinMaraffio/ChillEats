import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  TouchableOpacity,
  Text,
  View,
  Image,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  RegisterNavigationProp, 
  icon, 
  googleLogo, 
  appleLogo,
  validateForm,
  registerUser
} from './registerBackend';
import { styles } from './registerStyles';
import BottomNavBar from "../../components/bottomNavBar"
import { useKeyboardVisibility } from "../../hooks/useKeyboardVisibility" 

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterNavigationProp>();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const isKeyboardVisible = useKeyboardVisibility()

  const handleRegister = async () => {
    // Validate form
    const validation = validateForm(username, email, password, confirmPassword);
    if (!validation.isValid) {
      Alert.alert('Error', validation.message);
      return;
    }

    // Register user
    const result = await registerUser(username, email, password);
    Alert.alert(result.success ? 'Éxito' : 'Error', result.message);
    
    if (result.success) {
      // Navigate to verification screen
      navigation.navigate('Verification', { email });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Image
              source={icon}
              style={styles.iconStyle}
              resizeMode="contain"
            />

            <TextInput
              style={styles.TextInput}
              placeholder="Nombre de Usuario"
              placeholderTextColor="white"
              value={username}
              onChangeText={setUsername}
            />
            <TextInput
              style={styles.TextInput}
              placeholder="Email"
              placeholderTextColor="white"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.TextInput}
              placeholder="Contraseña"
              placeholderTextColor="white"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TextInput
              style={styles.TextInput}
              placeholder="Repetir Contraseña"
              placeholderTextColor="white"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleRegister}
            >
              <Text style={styles.buttonText}>Registrar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.login}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.buttonTextLogin}>Volver a Inicio de Sesion</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => alert('¡Botón presionado!')}
            >
              <Image source={googleLogo} style={styles.socialIconStyle} />
              <Text style={styles.buttonText}>Continuar con Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => alert('¡Botón presionado!')}
            >
              <Image source={appleLogo} style={styles.socialIconStyle} />
              <Text style={styles.buttonText}>Continuar con Apple</Text>
            </TouchableOpacity>

            <Text style={styles.TermsText}>
              Presionando continuar acepta los Términos y Condiciones y la Política de Privacidad.
            </Text>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {!isKeyboardVisible && <BottomNavBar />}

      <StatusBar style="light" />
    </KeyboardAvoidingView>
  );
}
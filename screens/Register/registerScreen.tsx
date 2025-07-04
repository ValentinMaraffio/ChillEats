import { useState } from "react"
import { StatusBar } from "expo-status-bar"
import {
  TouchableOpacity,
  Text,
  View,
  Image,
  TextInput,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { type RegisterNavigationProp, icon, googleLogo, appleLogo, validateForm, registerUser } from "./registerBackend"
import { styles } from "./registerStyles"
import { LinearGradient } from "expo-linear-gradient"

import BtnLoginiGoogle from '../../components/btnLoginGoogle';

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterNavigationProp>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');


  const handleRegister = async () => {
    // Validate form
    const validation = validateForm(name, email, password, confirmPassword);
    if (!validation.isValid) {
      Alert.alert('Error', validation.message);
      return;
    }

    // Register user
    const result = await registerUser(name, email, password);
    Alert.alert(result.success ? 'Éxito' : 'Error', result.message);
    
    if (result.success) {
      // Navigate to verification screen
      navigation.navigate('Verification', { email });
    }
  };

  return (
      <LinearGradient
        colors={['#ff4500', '#FF9500']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            {/* Botón de retorno */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <Image source={icon} style={styles.iconStyle} resizeMode="contain" />

            <TextInput
              style={styles.TextInput}
              placeholder="Nombre de Usuario"
              placeholderTextColor="white"
              value={name}
              onChangeText={setName}
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

            <TouchableOpacity style={styles.signInButton} onPress={handleRegister}>
              <Text style={styles.buttonText}>Registrar</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.line} />
            </View>

            <View>
              <BtnLoginiGoogle />
            </View>

            <TouchableOpacity style={styles.continueButton} onPress={() => alert("¡Botón presionado!")}>
              <Image source={appleLogo} style={styles.socialIconStyle} />
              <Text style={styles.buttonText}>Continuar con Apple</Text>
            </TouchableOpacity>

            <Text style={styles.TermsText}>
              Presionando continuar acepta los Términos y Condiciones y la Política de Privacidad.
            </Text>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      <StatusBar style="light" />
    </LinearGradient>
  );
}
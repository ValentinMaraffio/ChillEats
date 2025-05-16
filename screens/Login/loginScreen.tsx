import { StatusBar } from 'expo-status-bar';
import {
  TouchableOpacity,
  Text,
  View,
  Image,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useAuth } from '../../context/authContext';

import { 
  icon, 
  googleLogo, 
  appleLogo, 
  LoginNavigationProp 
} from './loginBackend';
import { styles } from './loginStyles';
import axios from 'axios';
import { parseJwt } from './loginBackend';

export default function LoginScreen() {
  const navigation = useNavigation<LoginNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  // Modified to handle the login directly in this component
  const handleLogin = async () => {
    try {
      const res = await axios.post('http://172.16.1.95:8000/api/auth/signin', { email, password });
      const token = res.data.token;
  
      await Promise.resolve(login(token));
  
      navigation.navigate('Profile', {
        username: parseJwt(token).username,
        email: parseJwt(token).email,
      });
    } catch (error: any) {
      const data = error.response?.data;
      if (data?.requiresVerification) {
        navigation.navigate('Verification', { email: data.email });
      } else {
        alert(data?.message || 'Ocurrió un error');
      }
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
          <View style={styles.content}>
            <Image
              source={icon}
              style={styles.iconStyle}
              resizeMode="contain"
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

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
            >
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            </TouchableOpacity>

            <Pressable onPress={() => alert('Texto como botón')}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </Pressable>

            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerText}>¿No tienes cuenta? Registrate</Text>
            </TouchableOpacity>

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
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <FontAwesome name="home" size={wp('7%')} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Favorites')}>
          <FontAwesome name="heart" size={wp('7%')} color="white" />
        </TouchableOpacity>

        <TouchableOpacity>
          <FontAwesome name="user" size={wp('7%')} color="white" />
        </TouchableOpacity>
      </View>

      <StatusBar style="light" />
    </KeyboardAvoidingView>
  );
}
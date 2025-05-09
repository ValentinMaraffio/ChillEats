import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
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
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { RootStackParamList } from '../index';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

const icon = require('../assets/img/icon-1.png');
const googleLogo = require('../assets/img/googleLogo.png');
const appleLogo = require('../assets/img/appleLogo.png');

// ...imports no modificados

export default function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !username) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    try {
      const response = await fetch('http://172.16.5.248:8000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registro exitoso. Un código de verificación ha sido enviado a tu correo.');

        // Enviar código de verificación
        await fetch('http://172.16.5.248:8000/api/auth/send-verification-code', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        // Redirigir a la pantalla de verificación
        navigation.navigate('Verification', { email });
      } else {
        alert(data.message || 'Error en el registro');
      }
    } catch (error) {
      console.error('Error al registrar:', error);
      alert('No se pudo conectar con el servidor');
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
              style={{ width: wp('40%'), height: wp('40%'), marginTop: hp('6%') }}
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
              <Image source={googleLogo} style={{ width: wp('7%'), height: wp('7%') }} />
              <Text style={styles.buttonText}>Continuar con Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => alert('¡Botón presionado!')}
            >
              <Image source={appleLogo} style={{ width: wp('7%'), height: wp('7%') }} />
              <Text style={styles.buttonText}>Continuar con Apple</Text>
            </TouchableOpacity>

            <Text style={styles.TermsText}>
              Presionando continuar acepta los Términos y Condiciones y la Política de Privacidad.
            </Text>
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ff9500',
    alignItems: 'center',
    paddingBottom: hp('4%'),
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: hp('15%'),
    backgroundColor: '#ff9500',
  },
  TextInput: {
    borderBottomWidth: 1,
    borderColor: 'white',
    width: wp('80%'),
    marginTop: hp('2.5%'),
    color: 'white',
    paddingVertical: hp('0.5%'),
  },
  signInButton: {
    backgroundColor: 'white',
    paddingVertical: hp('2%'),
    borderRadius: wp('8%'),
    marginTop: hp('2.5%'),
    width: wp('50%'),
    display: 'flex',
  },
  login: {
    marginTop: hp('1.2%'),
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: wp('4%'),
    textAlign: 'center',
  },
  buttonTextLogin: {
    color: 'white',
    fontWeight: '400',
    fontSize: wp('3.5%'),
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  verificationContainer: {
    marginTop: hp('2%'),
    alignItems: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp('2%'),
    width: wp('80%'),
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#fff',
    opacity: 0.6,
  },
  dividerText: {
    marginHorizontal: wp('2.5%'),
    color: '#fff',
    fontWeight: 'bold',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: hp('1.2%'),
    borderRadius: wp('2%'),
    marginTop: hp('1.5%'),
    width: wp('90%'),
    gap: wp('2%'),
  },
  TermsText: {
    color: 'white',
    textAlign: 'center',
    width: wp('80%'),
    marginTop: hp('2.5%'),
    fontSize: wp('3.2%'),
    lineHeight: hp('2.8%'),
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: hp('1.5%'),
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#ff9500',
  },
});
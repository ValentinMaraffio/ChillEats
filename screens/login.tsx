import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
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
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../index';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import axios from 'axios';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const icon = require('../assets/img/icon-1.png');
const googleLogo = require('../assets/img/googleLogo.png');
const appleLogo = require('../assets/img/appleLogo.png');

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://192.168.0.18:8000/api/auth/signin', {
        email,
        password,
      });

      // Podés guardar el token si lo necesitás
      // const token = res.data.token;

      Alert.alert('Éxito', 'Sesión iniciada correctamente');
      navigation.navigate('Main');
    } catch (error: any) {
      console.error(error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Ocurrió un error al iniciar sesión');
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
              style={{ width: wp('50%'), height: wp('50%'), marginTop: hp('10%') }}
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
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: hp('15%'),
    backgroundColor: '#ff9500',
    width: '100%',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  TextInput: {
    borderBottomWidth: 1,
    borderColor: 'white',
    width: wp('80%'),
    marginTop: hp('2.5%'),
    color: 'white',
    paddingVertical: hp('0.5%'),
  },
  loginButton: {
    backgroundColor: 'white',
    paddingVertical: hp('2%'),
    borderRadius: wp('8%'),
    marginTop: hp('2.5%'),
    width: wp('50%'),
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: wp('4%'),
    textAlign: 'center',
  },
  forgotText: {
    color: 'white',
    margin: hp('2%'),
    fontSize: wp('3.5%'),
    textDecorationLine: 'underline',
  },
  registerText: {
    color: 'white',
    fontSize: wp('3.5%'),
    textDecorationLine: 'underline',
    marginBottom: hp('2%'),
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

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from "../../types/navigation"
import { FontAwesome } from '@expo/vector-icons';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';


type VerificationScreenRouteProp = {
  params: {
    email: string;
  };
};

export default function VerificationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Verification'>>();
  const { email } = route.params;

  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (!code) {
      Alert.alert('Error', 'Por favor ingresa el código de verificación');
      return;
    }

    try {
      const response = await fetch('http://172.16.1.95:8000/api/auth/verify-verification-code', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          providedCode: code,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Éxito', 'Correo verificado exitosamente');
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', data.message || 'Código incorrecto');
      }
    } catch (error) {
      console.error('Error verificando el código:', error);
      Alert.alert('Error', 'No se pudo verificar el código');
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    try {
      const response = await fetch('http://172.16.1.95:8000/api/auth/send-verification-code', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        Alert.alert('Éxito', 'El código ha sido reenviado a tu correo');
        setResendCooldown(30); // 30 segundos de cooldown
      } else {
        Alert.alert('Error', 'No se pudo reenviar el código');
      }
    } catch (error) {
      console.error('Error al reenviar código:', error);
      Alert.alert('Error', 'Hubo un problema al reenviar el código');
    }
  };

  return (
    <View style={styles.container}>
      {/* Botón volver */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Register')}>
        <FontAwesome name="arrow-left" size={24} color="white" />
      </TouchableOpacity>

      <Text style={styles.title}>Verifica tu correo</Text>
      <Text style={styles.subtitle}>Hemos enviado un código a:</Text>
      <Text style={styles.email}>{email}</Text>

      <TextInput
        style={styles.input}
        placeholder="Código de verificación"
        placeholderTextColor="#ccc"
        value={code}
        onChangeText={setCode}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
        <Text style={styles.verifyText}>Verificar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.resendButton, resendCooldown > 0 && { opacity: 0.5 }]}
        onPress={handleResendCode}
        disabled={resendCooldown > 0}
      >
        <Text style={styles.resendText}>
          {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff9500',
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp('5%'),
  },
  backButton: {
    position: 'absolute',
    top: hp('6%'),
    left: wp('5%'),
  },
  title: {
    fontSize: wp('6.5%'),
    fontWeight: 'bold',
    color: 'white',
    marginBottom: hp('2%'),
  },
  subtitle: {
    fontSize: wp('4%'),
    color: 'white',
  },
  email: {
    fontSize: wp('4%'),
    color: 'white',
    fontWeight: 'bold',
    marginBottom: hp('3%'),
  },
  input: {
    width: '80%',
    borderBottomWidth: 1,
    borderColor: 'white',
    color: 'white',
    paddingVertical: hp('1%'),
    marginBottom: hp('3%'),
  },
  verifyButton: {
    backgroundColor: 'white',
    borderRadius: wp('5%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('10%'),
    marginBottom: hp('2%'),
  },
  verifyText: {
    color: '#000',
    fontSize: wp('4%'),
    fontWeight: 'bold',
  },
  resendButton: {
    marginTop: hp('1%'),
  },
  resendText: {
    color: 'white',
    textDecorationLine: 'underline',
    fontSize: wp('3.8%'),
  },
});

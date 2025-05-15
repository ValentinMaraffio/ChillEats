import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';

import { 
  VerificationNavigationProp, 
  VerificationRouteProp,
  verifyCode,
  resendVerificationCode
} from './verificationBackend';
import { styles } from './verificationStyles';

export default function VerificationScreen() {
  const navigation = useNavigation<VerificationNavigationProp>();
  const route = useRoute<VerificationRouteProp>();
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
    const result = await verifyCode(email, code);
    Alert.alert(result.success ? 'Éxito' : 'Error', result.message);
    
    if (result.success) {
      navigation.navigate('Login');
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    const result = await resendVerificationCode(email);
    Alert.alert(result.success ? 'Éxito' : 'Error', result.message);
    
    if (result.success) {
      setResendCooldown(30); // 30 segundos de cooldown
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
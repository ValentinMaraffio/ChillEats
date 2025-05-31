import React, { useRef, useState } from 'react';
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
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { styles } from '../ForgotPassword/ForgotStyles';
import axios from 'axios';

export default function ResetPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ResetPassword'>>();
  const { email } = route.params;

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showModal, setShowModal] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const handleCodeChange = (text: string) => {
    if (text.length <= 6 && /^\d*$/.test(text)) {
      setCode(text);
    }
  };

  const handleValidateCode = async () => {
    try {
      const response = await axios.post('http://192.168.0.236:8000/api/auth/validate-forgot-password-code', {
        email,
        providedCode: code,
      });
      if (response.data.success) {
        setShowModal(true);
      }
    } catch (err: any) {
      Alert.alert('Código inválido', err?.response?.data?.message || 'Verifica el código ingresado');
    }
  };

  const handleResetPassword = async () => {
    try {
      await axios.patch('http://192.168.0.236:8000/api/auth/verify-forgot-password-code', {
        email,
        providedCode: code,
        newPassword,
      });
      setShowModal(false);
      Alert.alert('Éxito', 'Contraseña actualizada');
      navigation.navigate('Login');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'No se pudo cambiar la contraseña');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <Text style={styles.title}>Restablecer Contraseña</Text>

          <Text style={styles.label}>Ingresa el código (6 dígitos):</Text>

          <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
            <View style={localStyles.codeInputWrapper}>
              {Array(6).fill(null).map((_, i) => {
                const isActive = i === code.length;
                const isLast = code.length === 6 && i === 5;
                const active = isActive || isLast;

                return (
                  <View
                    key={i}
                    style={[
                      localStyles.codeBox,
                      active && localStyles.activeBox
                    ]}
                  >
                    <Text style={localStyles.codeDigit}>{code[i] || ''}</Text>
                  </View>
                );
              })}
              <TextInput
                ref={inputRef}
                value={code}
                onChangeText={handleCodeChange}
                keyboardType="numeric"
                maxLength={6}
                autoFocus
                style={localStyles.hiddenFocusableInput}
              />
            </View>
          </TouchableWithoutFeedback>

          <TouchableOpacity style={styles.button} onPress={handleValidateCode}>
            <Text style={styles.buttonText}>Validar Código</Text>
          </TouchableOpacity>

          <Modal visible={showModal} transparent animationType="slide">
            <View style={localStyles.modalOverlay}>
              <View style={localStyles.modalContent}>
                <Text style={styles.title}>Nueva Contraseña</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nueva contraseña"
                  placeholderTextColor="white"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                  <Text style={styles.buttonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const localStyles = StyleSheet.create({
  codeInputWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginVertical: 20,
    position: 'relative',
  },
  codeBox: {
    width: 48,
    height: 56,
    borderRadius: 8,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  activeBox: {
    borderColor: '#000', // Celda activa con borde negro
  },
  codeDigit: {
    fontSize: 24,
    color: 'black',
  },
  hiddenFocusableInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#ff9500',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
});

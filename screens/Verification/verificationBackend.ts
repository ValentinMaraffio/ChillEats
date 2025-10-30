import { Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from "../../types/navigation";

// Type definitions
export type VerificationNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type VerificationRouteProp = RouteProp<RootStackParamList, 'Verification'>;
export const iconEmail = require('../../assets/img/email.png');

// API functions
export const verifyCode = async (
  email: string,
  code: string

): Promise<{ success: boolean; message: string; token?: string }> => {
  if (!code) {
    return { success: false, message: 'Por favor ingresa el código de verificación' };
  }

  try {
    const response = await fetch('http://172.16.6.156:8000/api/auth/verify-verification-code', {
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
      return { success: true, message: data.message, token: data.token };
    } else {
      return { success: false, message: data.message || 'Código incorrecto' };
    }
  } catch (error) {
    console.error('Error verificando el código:', error);
    return { success: false, message: 'No se pudo verificar el código' };
  }
};

export const resendVerificationCode = async (
  email: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('http://172.16.6.156:8000/api/auth/send-verification-code', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      return { success: true, message: 'El código ha sido reenviado a tu correo' };
    } else {
      return { success: false, message: 'No se pudo reenviar el código' };
    }
  } catch (error) {
    console.error('Error al reenviar código:', error);
    return { success: false, message: 'Hubo un problema al reenviar el código' };
  }
};
import { RootStackParamList } from "../../types/navigation";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Type definitions
export type RegisterNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Assets
export const icon = require('../../assets/img/icon-1.png');
export const googleLogo = require('../../assets/img/googleLogo.png');
export const appleLogo = require('../../assets/img/appleLogo.png');

// Validation functions
export const validateForm = (
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): { isValid: boolean; message: string } => {
  if (!email || !password || !confirmPassword || !name) {
    return { isValid: false, message: 'Por favor completa todos los campos' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, message: 'Las contraseñas no coinciden' };
  }

  return { isValid: true, message: '' };
};

// API functions
export const registerUser = async (
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('http://172.16.6.156:8000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Send verification code
      await sendVerificationCode(email);
      return { 
        success: true, 
        message: 'Registro exitoso. Un código de verificación ha sido enviado a tu correo.' 
      };
    } else {
      return { success: false, message: data.message || 'Error en el registro' };
    }
  } catch (error) {
    console.error('Error al registrar:', error);
    return { success: false, message: 'No se pudo conectar con el servidor' };
  }
};

export const sendVerificationCode = async (email: string): Promise<void> => {
  try {
    await fetch('http://172.16.6.156:8000/api/auth/send-verification-code', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
  } catch (error) {
    console.error('Error al enviar código de verificación:', error);
  }
};
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Assets
export const icon = require('../../assets/img/Group1482.png');
export const googleLogo = require('../../assets/img/googleLogo.png');
export const appleLogo = require('../../assets/img/appleLogo.png');

// JWT Parser
export function parseJwt(token: string) {
  try {
    if (!token) return null;  // Si el token es vacío o null

    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const parsed = JSON.parse(jsonPayload);

    // Validación extra: asegurarnos de que tenga al menos name y email
    if (!parsed.name || !parsed.email) {
      console.warn("Token parsed but missing expected fields:", parsed);
      return null;
    }

    return parsed;
  } catch (e) {
    console.error("Error parsing JWT:", e);
    return null;
  }
}

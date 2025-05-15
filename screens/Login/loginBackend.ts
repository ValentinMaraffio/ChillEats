import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Assets
export const icon = require('../../assets/img/icon-1.png');
export const googleLogo = require('../../assets/img/googleLogo.png');
export const appleLogo = require('../../assets/img/appleLogo.png');

// JWT Parser
export function parseJwt(token: string) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return {};
  }
}
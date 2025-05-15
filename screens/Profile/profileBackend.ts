import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

// Type definitions
export type ProfileProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;

// Helper functions
export const handleUserLogout = (
  logout: () => void, 
  navigation: ProfileProps['navigation']
) => {
  logout();
  navigation.navigate('Login');
};
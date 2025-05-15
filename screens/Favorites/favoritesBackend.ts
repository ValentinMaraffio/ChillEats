import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Mock restaurant data
export const data = [
  {
    id: '1',
    name: 'Pizza Express',
    rating: 4.5,
    reviews: 120,
    distance: '1.2 km',
    icon: 'pizza-slice',
  },
];

export const data1 = [...data];
export const data2 = [...data];
export const data3 = [...data];
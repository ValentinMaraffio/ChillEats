import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useAuth } from '../../context/authContext';
import { ProfileProps, handleUserLogout } from './profileBackend';
import { styles } from './profileStyles';
import { useState } from 'react';
import BottomNavBar from "../../components/bottomNavBar"

export default function ProfileScreen({ route, navigation }: ProfileProps) {
  const { username, email } = route.params;
  const { logout } = useAuth();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  const handleLogout = () => {
    handleUserLogout(logout, navigation);
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <FontAwesome name="user-circle" size={wp('30%')} color="white" style={styles.avatar} />
        <Text style={styles.title}>Perfil de Usuario</Text>
        <Text style={styles.info}>👤 Usuario: <Text style={styles.infoValue}>{username}</Text></Text>
        <Text style={styles.info}>📧 Email: <Text style={styles.infoValue}>{email}</Text></Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      {!isKeyboardVisible && <BottomNavBar />}
    </View>
  );
}
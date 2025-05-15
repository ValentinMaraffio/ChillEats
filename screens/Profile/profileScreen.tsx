import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useAuth } from '../../context/authContext';
import { ProfileProps, handleUserLogout } from './profileBackend';
import { styles } from './profileStyles';

export default function ProfileScreen({ route, navigation }: ProfileProps) {
  const { username, email } = route.params;
  const { logout } = useAuth();

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

      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <FontAwesome name="home" size={wp('7%')} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Favorites')}>
          <FontAwesome name="heart" size={wp('7%')} color="white" />
        </TouchableOpacity>
        <TouchableOpacity>
          <FontAwesome name="user" size={wp('7%')} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
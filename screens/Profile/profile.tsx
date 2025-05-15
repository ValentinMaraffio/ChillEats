import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useAuth } from '../../context/authContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ route, navigation }: Props) {
  const { username, email } = route.params;
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigation.navigate('Login');
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff9500',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('5%'),
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: wp('5%'),
    padding: wp('8%'),
    alignItems: 'center',
    elevation: 5,
    width: '100%',
  },
  avatar: {
    marginBottom: hp('2%'),
  },
  title: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    color: '#ff9500',
    marginBottom: hp('2%'),
  },
  info: {
    fontSize: wp('4.5%'),
    color: '#333',
    marginVertical: hp('0.5%'),
  },
  infoValue: {
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: hp('3%'),
    backgroundColor: '#ff9500',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('10%'),
    borderRadius: wp('5%'),
  },
  logoutText: {
    color: 'white',
    fontSize: wp('4%'),
    fontWeight: 'bold',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: hp('1.5%'),
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#ff9500',
  },
});

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, TouchableOpacity, Text, View, Image, TextInput, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../index';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const icon = require('../assets/img/icon-1.png');
const googleLogo = require('../assets/img/googleLogo.png');
const appleLogo = require('../assets/img/appleLogo.png');

export default function App() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image source={icon} style={{ width: wp('50%'), height: wp('50%'), marginTop: hp('10%') }} />

        <TextInput 
          style={styles.TextInput}
          placeholder='E-MAIL'
          placeholderTextColor={'white'}
        />

        <TextInput 
          style={styles.TextInput}
          placeholder='PASSWORD'
          placeholderTextColor={'white'}
        />

        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={() => alert('¡Botón presionado!')}>
          <Text style={styles.buttonText}>LOG IN</Text>
        </TouchableOpacity>

        <Pressable onPress={() => alert('Texto como botón')}>
          <Text style={{ color: 'white', margin: hp('2%') }}>Forgot your password?</Text>
        </Pressable>

        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={() => alert('¡Botón presionado!')}>
          <Image source={googleLogo} style={{ width: wp('10%'), height: wp('10%') }} />
          <Text style={styles.buttonText}>Continue With Google</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={() => alert('¡Botón presionado!')}>
          <Image source={appleLogo} style={{ width: wp('10%'), height: wp('10%') }} />
          <Text style={styles.buttonText}>Continue With Apple</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <FontAwesome name="home" size={wp('7%')} color="white" />
        </TouchableOpacity>

        <TouchableOpacity>
          <FontAwesome name="heart" size={wp('7%')} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <FontAwesome name="user" size={wp('7%')} color="white" />
        </TouchableOpacity>
      </View>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff9500',
    justifyContent: 'center',
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});

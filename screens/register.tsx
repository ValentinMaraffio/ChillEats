import { StatusBar } from 'expo-status-bar';
import { StyleSheet, TouchableOpacity, Text, View, Image, TextInput, Button, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { RootStackParamList } from '../index';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const icon = require('../assets/img/icon-1.png');
const googleLogo = require('../assets/img/googleLogo.png');
const appleLogo = require('../assets/img/appleLogo.png');

export default function App() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (

    <View style={styles.container}>

      <View style={styles.content}>

        <Image source={icon} style={{ width: 180, height: 180, marginTop: 80 }}/>  
      
        <TextInput 
          style={styles.TextInput}
          placeholder='USERNAME'
          placeholderTextColor={'white'}
        />
      
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
        <TextInput
            style={styles.TextInput}
            placeholder='REPEAT PASSWORD'
            placeholderTextColor={'white'}
        />
      
        <TouchableOpacity 
          style={styles.signInButton} 
          onPress={() => alert('¡Botón presionado!')}>
          <Text style={styles.buttonText}>SIGN IN</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.signInButton} 
          onPress={() => alert('¡Botón presionado!')}>
          <Text style={styles.buttonText}>LOGIN</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.line} />
        </View>


        <TouchableOpacity 
        
          style={styles.continueButton} 
          onPress={() => alert('¡Botón presionado!')}>
          <Image source={googleLogo} style={{ width:40, height:40 }}/>  
          <Text style={styles.buttonText}>Continue With Google</Text>
        
        </TouchableOpacity>

        <TouchableOpacity 
        
          style={styles.continueButton} 
          onPress={() => alert('¡Botón presionado!')}>
          <Image source={appleLogo} style={{ width:40, height:40 }}/>  
          <Text style={styles.buttonText}>Continue With Apple</Text>
        
        </TouchableOpacity>

        <Text style={styles.TermsText}>By clicking continue, you agree to our Terms of Service and Privacy Policy</Text>
        
       


      </View>

      <View style={styles.bottomNav}>
  <TouchableOpacity onPress={() => navigation.navigate('Main')}>
    <FontAwesome name="home" size={28} color="white" />
  </TouchableOpacity>

  <TouchableOpacity onPress={() => alert('Buscar')}>
    <FontAwesome name="heart" size={28} color="white" />
  </TouchableOpacity>

  <TouchableOpacity onPress={() => navigation.navigate('Register')}>
    <FontAwesome name="user" size={28} color="white" />
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

  TextInput: {
    borderBottomWidth: 1,
    borderColor: 'white',
    width: '80%',
    marginTop: 25,
    color:'white',
  },
  TermsText:{
    color: 'white',
    textAlign: 'center',
    width: '80%',
    marginTop: 20,
    fontSize: 13,
    lineHeight: 18,
  },

  signInButton: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 25,
    width: '50%',
    display: 'flex',
  },

  loginInButton: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 25,
    width: '50%',
    display: 'flex',
  },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#fff', 
    opacity: 0.6,
  },
  
  dividerText: {
    marginHorizontal: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  

  buttonText: {
    color: 'black', 
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },

  continueButton: {
    flexDirection: 'row',        
    alignItems: 'center',        
    justifyContent: 'center',    
    backgroundColor: 'white',
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 10,
    width: '90%',
  },

  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
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

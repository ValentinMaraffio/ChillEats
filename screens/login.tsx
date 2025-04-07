import { StatusBar } from 'expo-status-bar';
import { StyleSheet, TouchableOpacity, Text, View, Image, TextInput, Button, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const icon = require('../assets/img/icon-1.png');
const googleLogo = require('../assets/img/googleLogo.png');
const appleLogo = require('../assets/img/appleLogo.png');

export default function App() {
  return (

    <View style={styles.container}>

      <View style={styles.content}>

        <Image source={icon} style={{ width: 200, height: 200, marginTop: 100 }}/>  
      
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
          <Text style={{ color: 'white', margin: 20, }}>Forgot your password?</Text>
        </Pressable>

        <TouchableOpacity 
        
          style={styles.continueButton} 
          onPress={() => alert('¡Botón presionado!')}>
          <Image source={googleLogo} style={{ width:'40', height:'40' }}/>  
          <Text style={styles.buttonText}>Continue With Google</Text>
        
        </TouchableOpacity>

        <TouchableOpacity 
        
          style={styles.continueButton} 
          onPress={() => alert('¡Botón presionado!')}>
          <Image source={appleLogo} style={{ width:'40', height:'40' }}/>  
          <Text style={styles.buttonText}>Continue With Apple</Text>
        
        </TouchableOpacity>


      </View>

      <View style={styles.bottomNav}>
          
          <TouchableOpacity onPress={() => alert('Inicio')}>
            <FontAwesome name="home" size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => alert('Buscar')}>
            <FontAwesome name="heart" size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => alert('Perfil')}>
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

  loginButton: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 25,
    width: '50%',
    display: 'flex',
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

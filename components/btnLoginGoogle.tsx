import { Pressable, TouchableOpacity, Text, Image, StyleSheet } from "react-native";
import { useEffect } from "react";
import axios from 'axios';
import { useAuth } from '../context/authContext';
import { useNavigation } from '@react-navigation/native';
import { parseJwt } from '../screens/Login/loginBackend';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';  
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
export const googleLogo = require('../assets/img/googleLogo.png');

import * as Google from 'expo-auth-session/providers/google';

export default function BtnLoginiGoogle() {

    const { login } = useAuth();
    
    const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Profile'>>();
    

    const [ request, response, promptAsync ] = Google.useAuthRequest({
        androidClientId: '866286178679-b274j2kosk0251qd0s0ia22rklrb72mp.apps.googleusercontent.com',
        iosClientId: '',
    })

    const enviarTokenalServer = async (idToken: string) => {
        try {
            const res = await axios.post('http://192.168.0.236:8000/api/auth/google-signin', { idToken });
            const token = res.data.token;

            // Guardás el token como en el resto de tu app (como ya haces en handleLogin)
            await Promise.resolve(login(token));

            const decoded = parseJwt(token);
            console.log("TOKEN DECODED:", decoded);
            console.log("NAME:", decoded.name);
            console.log("EMAIL:", decoded.email);
            
            // Navegás al profile
            navigation.navigate('Profile', {
                name: parseJwt(token).name,
                email: parseJwt(token).email,
            });
        } catch (error) {
            console.log('Error al autenticar con Google', error);
        }
    };

    
    useEffect(() => {
    if (response?.type === 'success') {
        const idToken = response.authentication?.idToken;
        if (idToken) {
            enviarTokenalServer(idToken);
        } else {
            console.log("No se recibió idToken válido");
        }
    } else if (response) {
        console.log("Error en la autenticación:", response);
    }
}, [response]);

    return (
        <TouchableOpacity
            style={styles.continueButton}
            onPress={() => promptAsync().catch((e) => {
                console.error("error al iniciar sesion:", e);
            })}
        >
            <Image source={googleLogo} style={styles.socialIconStyle} />
            <Text style={styles.buttonText}>Continuar con Google</Text>
        </TouchableOpacity>

        
    )
}

const styles = StyleSheet.create({
    btn: { 
        backgroundColor: 'red',
        padding: 20,
        margin: 20,
        borderRadius: 10,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingVertical: hp('1.2%'),
        borderRadius: wp('2%'),
        marginTop: hp('1.5%'),
        width: wp('90%'),
        gap: wp('2%'),
    },
    socialIconStyle: {
        width: wp('7%'), 
        height: wp('7%')
    },
      buttonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: wp('4%'),
    textAlign: 'center',
  },
})
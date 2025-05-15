import { StyleSheet } from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff9500',
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp('5%'),
  },
  backButton: {
    position: 'absolute',
    top: hp('6%'),
    left: wp('5%'),
  },
  title: {
    fontSize: wp('6.5%'),
    fontWeight: 'bold',
    color: 'white',
    marginBottom: hp('2%'),
  },
  subtitle: {
    fontSize: wp('4%'),
    color: 'white',
  },
  email: {
    fontSize: wp('4%'),
    color: 'white',
    fontWeight: 'bold',
    marginBottom: hp('3%'),
  },
  input: {
    width: '80%',
    borderBottomWidth: 1,
    borderColor: 'white',
    color: 'white',
    paddingVertical: hp('1%'),
    marginBottom: hp('3%'),
  },
  verifyButton: {
    backgroundColor: 'white',
    borderRadius: wp('5%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('10%'),
    marginBottom: hp('2%'),
  },
  verifyText: {
    color: '#000',
    fontSize: wp('4%'),
    fontWeight: 'bold',
  },
  resendButton: {
    marginTop: hp('1%'),
  },
  resendText: {
    color: 'white',
    textDecorationLine: 'underline',
    fontSize: wp('3.8%'),
  },
});
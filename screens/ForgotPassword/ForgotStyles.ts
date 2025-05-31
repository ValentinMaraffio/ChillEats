import { StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff9500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    width: '90%',
    alignItems: 'center',
  },
  title: {
    fontSize: wp('6%'),
    color: 'white',
    fontWeight: 'bold',
    marginBottom: hp('3%'),
  },
  label: {
    alignSelf: 'flex-start',
    color: 'white',
    fontSize: wp('4%'),
    marginTop: hp('1.5%'),
    marginBottom: hp('0.5%'),
  },
  input: {
    borderBottomWidth: 1,
    borderColor: 'white',
    width: '100%',
    color: 'white',
    paddingVertical: hp('1%'),
    marginBottom: hp('2%'),
  },
  button: {
    backgroundColor: 'white',
    paddingVertical: hp('2%'),
    borderRadius: wp('5%'),
    width: '60%',
    marginTop: hp('2%'),
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: wp('4%'),
  },
});

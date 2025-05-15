import { StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

export const styles = StyleSheet.create({
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
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ImageBackground,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useAuth } from '../../context/authContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const data = [
  {
    id: '1',
    name: 'Pizza Express',
    rating: 4.5,
    reviews: 120,
    distance: '1.2 km',
    icon: 'pizza-slice',
  },
];
const data1 = [...data];
const data2 = [...data];
const data3 = [...data];

const Tag = ({ label }: { label: string }) => (
  <View style={{ backgroundColor: '#FFBB5C', paddingHorizontal: 6, paddingVertical: 2, marginRight: 5, borderRadius: 5 }}>
    <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{label}</Text>
  </View>
);

export default function RestaurantsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const renderRestaurant = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.subtext}>⭐ {item.rating} ({item.reviews} reseñas)</Text>
          <Text style={styles.subtext}>🚶 {item.distance}</Text>
          <View style={styles.tagsRow}>
            <Tag label="Celíaco" />
            <Tag label="Vegetariano" />
            <Tag label="Vegano" />
          </View>
        </View>
        <FontAwesome5 name={item.icon as any} size={36} color="black" style={styles.cardIcon} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('../../assets/img/fast-food-bg.jpg')}
        style={styles.background}
        resizeMode="repeat"
        imageStyle={{ opacity: 0.3 }}
      >
        <View style={styles.filters}>
          {['Localidad', 'Limitación', 'Precio', 'Local'].map((filter, index) => (
            <TouchableOpacity key={index} style={styles.filterButton}>
              <Text style={styles.filterText}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <FlatList data={data} keyExtractor={(item) => item.id} scrollEnabled={false} renderItem={renderRestaurant} />
          <FlatList data={data1} keyExtractor={(item) => item.id} scrollEnabled={false} renderItem={renderRestaurant} />
          <FlatList data={data2} keyExtractor={(item) => item.id} scrollEnabled={false} renderItem={renderRestaurant} />
          <FlatList data={data3} keyExtractor={(item) => item.id} scrollEnabled={false} renderItem={renderRestaurant} />
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity onPress={() => navigation.navigate('Main')}>
            <FontAwesome name="home" size={wp('7%')} color="white" />
          </TouchableOpacity>

          <TouchableOpacity>
            <FontAwesome name="heart" size={wp('7%')} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (user) {
                navigation.navigate('Profile', {
                  username: user.username,
                  email: user.email,
                });
              } else {
                navigation.navigate('Login');
              }
            }}
          >
            <FontAwesome name="user" size={wp('7%')} color="white" />
          </TouchableOpacity>
        </View>
      </ImageBackground>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FF9500',
  },
  background: {
    flex: 1,
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: hp('6%'),
  },
  filterButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 2,
  },
  filterText: {
    fontSize: 16,
    color: '#000',
  },
  card: {
    backgroundColor: '#fff',
    marginVertical: 12,
    padding: 30,
    borderRadius: 30,
    elevation: 5,
    marginTop: hp('5%'),
    width: '80%',
    alignSelf: 'center',
    shadowColor: '#000000',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtext: {
    color: '#555',
  },
  tagsRow: {
    flexDirection: 'row',
    marginTop: 5,
  },
  cardIcon: {
    marginLeft: 10,
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
    backgroundColor: '#FF9500',
  },
});

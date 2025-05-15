import { StatusBar } from 'expo-status-bar';
import {
  Text,
  View,
  FlatList,
  ImageBackground,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { useAuth } from '../../context/authContext';
import { data, data1, data2, data3, NavigationProp } from './favoritesBackend';
import { styles, tagStyle } from './favoritesStyles';

const Tag = ({ label }: { label: string }) => (
  <View style={tagStyle.container}>
    <Text style={tagStyle.text}>{label}</Text>
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
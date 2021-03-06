import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';

import { Feather as Icon } from '@expo/vector-icons'
import { SvgUri } from 'react-native-svg';

import { useNavigation, useRoute } from '@react-navigation/native'
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

import api from '../../services/api';

interface Item {
  id: number;
  title: string;
  image: string;
  selected: boolean;
}

interface Point {
  id: number;
  image: string;
  image_url: string;
  name: string;
  latitude: number;
  longitude: number;
  city: string;
  uf: string;
  whatsapp: string;
  email: string;
  // items: {
  //   title: string;
  // }[];
}

interface RouteParams {
  uf: string;
  city: string;
}

const Points: React.FC = () => {
  const navigation = useNavigation();
  const routes = useRoute();

  const routeParams = routes.params as RouteParams;

  const [items, setItems] = useState<Item[]>([]);
  const [points, setPoints] = useState<Point[]>([]);

  const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Oooops...', 'Precisamos da sua permissão para obter usa localização');
        return;
      }

      const location = await Location.getCurrentPositionAsync();

      const { latitude, longitude } = location.coords;
      setInitialPosition([latitude, longitude]);
    })();
  }, []);

  useEffect(() => {
    api.get<Item[]>('/items')
      .then(response => {
        setItems(response.data.map(item => ({ ...item, selected: false })));
      });
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      const itemsFiltered = items.filter(item => item.selected);

      api.get<Point[]>('/points', {
        params: {
          city: routeParams.city,
          uf: routeParams.uf.toUpperCase(),
          items: (itemsFiltered.length > 0) ? itemsFiltered.map(item => item.id) : []
        }
      }).then(response => {
        const { data } = response;
        setPoints(data);
      })
    }
  }, [items])

  const handleNavigateDetail = (id: number) => {
    navigation.navigate('Detail', { point_id: id });
  }

  const handleNavigateBack = () => {
    navigation.goBack();
  }

  const handleItemClick = (id: number) => {
    setItems(prevState => prevState.map(item => item.id === id ? ({ ...item, selected: !item.selected }) : item));
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>

      <View style={styles.container}>
        <TouchableOpacity onPress={handleNavigateBack}>
          <Text>
            <Icon name="arrow-left" size={24} color="#34cb79" />
          </Text>
        </TouchableOpacity>


        <Text style={styles.title}>
          Bem vindo.
      </Text>
        <Text style={styles.description}>
          Encontre no mapa um ponto de coleta.
      </Text>
        <View style={styles.mapContainer}>
          {initialPosition[0] !== 0 && (
            <MapView
              style={styles.map}
              initialRegion={{ latitude: initialPosition[0], longitude: initialPosition[1], latitudeDelta: 0.014, longitudeDelta: 0.014 }}
            >
              {points.length > 0 && points.map(point => (
                <Marker
                  key={String(point.id)}
                  style={styles.mapMarker}
                  coordinate={{ latitude: point.latitude, longitude: point.longitude }}
                  onPress={() => handleNavigateDetail(point.id)}
                >

                  <View style={styles.mapMarkerContainer}>
                    <Image style={styles.mapMarkerImage} source={{ uri: point.image_url }} />
                    <Text style={styles.mapMarkerTitle}>{point.name}</Text>
                  </View>

                </Marker>
              ))}
            </MapView>
          )}
        </View>
      </View>

      <View style={styles.itemsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 28 }}
        >
          {items.length > 0 && items.map(item => (
            <TouchableOpacity
              style={(item.selected) ? { ...styles.item, ...styles.selectedItem } : styles.item}
              onPress={() => handleItemClick(item.id)}
              key={String(item.id)}
              activeOpacity={0.6}
            >

              <SvgUri width={42} height={42} uri={item.image} />
              <Text style={styles.itemTitle}>{item.title}</Text>

            </TouchableOpacity>
          ))}


        </ScrollView>
      </View>

    </SafeAreaView>
  );
}

export default Points;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 20,
  },

  title: {
    fontSize: 20,
    fontFamily: 'Ubuntu_700Bold',
    marginTop: 24,
  },

  description: {
    color: '#6C6C80',
    fontSize: 16,
    marginTop: 4,
    fontFamily: 'Roboto_400Regular',
  },

  mapContainer: {
    flex: 1,
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 16,
  },

  map: {
    width: '100%',
    height: '100%',
  },

  mapMarker: {
    width: 90,
    height: 80,
  },

  mapMarkerContainer: {
    width: 90,
    height: 70,
    backgroundColor: '#34CB79',
    flexDirection: 'column',
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center'
  },

  mapMarkerImage: {
    width: 90,
    height: 45,
    resizeMode: 'cover',
  },

  mapMarkerTitle: {
    flex: 1,
    fontFamily: 'Roboto_400Regular',
    color: '#FFF',
    fontSize: 13,
    lineHeight: 23,
  },

  itemsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 32,
  },

  item: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#eee',
    height: 120,
    width: 120,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'space-between',

    textAlign: 'center',
  },

  selectedItem: {
    borderColor: '#34CB79',
    borderWidth: 2,
  },

  itemTitle: {
    fontFamily: 'Roboto_400Regular',
    textAlign: 'center',
    fontSize: 13,
  },
});
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchPastures } from '../services/apiService';
import { useApp } from '../context/AppContext';

export default function PasturesScreen({ navigation }) {
  const { currentFarm, isOnline } = useApp();
  const [pastures, setPastures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!currentFarm) return;
    try {
      const data = await fetchPastures(currentFarm.id);
      setPastures(data);
    } catch (e) {
      // use cache if offline
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentFarm]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const getOccupancy = (p) => {
    if (!p.capacity || p.capacity === 0) return null;
    return Math.round((p.animal_count / p.capacity) * 100);
  };

  const getColor = (pct) => {
    if (pct === null) return '#ccc';
    if (pct < 60) return '#52b788';
    if (pct < 85) return '#f4a261';
    return '#e63946';
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2d6a4f" />;

  return (
    <View style={s.container}>
      {!isOnline && (
        <View style={s.offlineBanner}>
          <Text style={s.offlineText}>📴 Modo offline — exibindo dados em cache</Text>
        </View>
      )}
      <FlatList
        data={pastures}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={s.empty}>Nenhum pasto cadastrado.</Text>}
        renderItem={({ item }) => {
          const pct = getOccupancy(item);
          const color = getColor(pct);
          return (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.pastureName}>{item.name}</Text>
                <View style={[s.badge, { backgroundColor: color + '22' }]}>
                  <Text style={[s.badgeText, { color }]}>
                    {item.animal_count} animais
                  </Text>
                </View>
              </View>
              {item.area_hectares && (
                <Text style={s.detail}>📐 {item.area_hectares} ha</Text>
              )}
              {item.capacity && (
                <Text style={s.detail}>
                  Capacidade: {item.animal_count} / {item.capacity}
                </Text>
              )}
              {pct !== null && (
                <View style={s.barBg}>
                  <View style={[s.barFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
                </View>
              )}
              {item.forage_type && (
                <Text style={s.detail}>🌿 {item.forage_type}</Text>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { padding: 16, paddingBottom: 40 },
  offlineBanner: { backgroundColor: '#fff3cd', padding: 10, alignItems: 'center' },
  offlineText: { color: '#856404', fontSize: 13 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pastureName: { fontSize: 16, fontWeight: 'bold', color: '#1b4332' },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  detail: { fontSize: 13, color: '#555', marginBottom: 6 },
  barBg: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, marginVertical: 6 },
  barFill: { height: 8, borderRadius: 4 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});

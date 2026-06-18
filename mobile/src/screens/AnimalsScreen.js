import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { fetchAnimals } from '../services/apiService';
import { getCachedAnimals } from '../services/localDB';

function AnimalCard({ animal, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(animal)}>
      <View style={styles.cardRow}>
        <View>
          <Text style={styles.tag}>{animal.tag}</Text>
          {animal.name ? <Text style={styles.name}>{animal.name}</Text> : null}
        </View>
        <View style={[styles.sexBadge, { backgroundColor: animal.sex === 'M' ? '#dbeafe' : '#fce7f3' }]}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: animal.sex === 'M' ? '#1e40af' : '#9d174d' }}>
            {animal.sex === 'M' ? '♂ Macho' : '♀ Fêmea'}
          </Text>
        </View>
      </View>
      <View style={styles.cardDetails}>
        <Text style={styles.detail}>🐄 {animal.breed_name || 'Sem raça'}</Text>
        <Text style={styles.detail}>🌿 {animal.pasture_name || 'Sem pasto'}</Text>
        {animal.last_weight ? <Text style={styles.detail}>⚖️ {animal.last_weight} kg</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

export default function AnimalsScreen({ navigation }) {
  const { currentFarm, isOnline } = useApp();
  const [animals, setAnimals] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!currentFarm) return;
    try {
      if (isOnline) {
        const data = await fetchAnimals(currentFarm.id);
        setAnimals(data);
      } else {
        const cached = await getCachedAnimals(currentFarm.id);
        setAnimals(cached);
      }
    } catch {
      // Fallback to cache
      const cached = await getCachedAnimals(currentFarm.id);
      setAnimals(cached);
    } finally {
      setLoading(false);
    }
  }, [currentFarm, isOnline]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = animals.filter(a =>
    a.tag?.toLowerCase().includes(search.toLowerCase()) ||
    a.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="🔍 Buscar por brinco ou nome..."
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AnimalForm', { farmId: currentFarm?.id })}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineTxt}>📵 Dados do cache local</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AnimalCard animal={item} onPress={(a) => navigation.navigate('AnimalDetail', { animalId: a.id })} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{loading ? '⏳' : '🐮'}</Text>
            <Text style={styles.emptyText}>{loading ? 'Carregando...' : 'Nenhum animal encontrado'}</Text>
          </View>
        }
        contentContainerStyle={{ padding: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  searchRow: { flexDirection: 'row', gap: 8, padding: 12, paddingBottom: 0 },
  search: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 11,
    fontSize: 14, borderWidth: 1, borderColor: '#d1d5db',
  },
  addBtn: {
    backgroundColor: '#16a34a', borderRadius: 10, width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 24, lineHeight: 26 },
  offlineBanner: { backgroundColor: '#fef3c7', padding: 8, marginHorizontal: 12, borderRadius: 8, marginTop: 8 },
  offlineTxt: { fontSize: 12, color: '#92400e', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#dcfce7',
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tag: { fontSize: 18, fontWeight: '700', color: '#14532d' },
  name: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  sexBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  cardDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  detail: { fontSize: 13, color: '#374151' },
  empty: { alignItems: 'center', padding: 48 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 15, color: '#9ca3af', marginTop: 8 },
});

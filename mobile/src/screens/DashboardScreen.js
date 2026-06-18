import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { getDashboard, syncPendingOperations, fetchAnimals, fetchPastures } from '../services/apiService';

function StatCard({ icon, value, label, color = '#16a34a' }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { currentFarm, isOnline, pendingSync, triggerSync, refreshPendingCount } = useApp();
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!currentFarm || !isOnline) return;
    try {
      const d = await getDashboard(currentFarm.id);
      // Pre-cache for offline use
      await fetchAnimals(currentFarm.id);
      await fetchPastures(currentFarm.id);
      setData(d);
    } catch (e) { /* offline */ }
  }, [currentFarm, isOnline]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (isOnline && pendingSync > 0) {
      try {
        const r = await syncPendingOperations();
        await refreshPendingCount();
        if (r.synced > 0) Alert.alert('✅ Sincronizado', `${r.synced} operação(ões) enviada(s)`);
      } catch (e) {}
    }
    await load();
    setRefreshing(false);
  };

  const a = data?.animals || {};

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🐄 FazendaApp</Text>
          <Text style={styles.headerSub}>{currentFarm?.name || 'Sem fazenda'}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: isOnline ? '#dcfce7' : '#fef3c7' }]}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: isOnline ? '#166534' : '#92400e' }}>
            {isOnline ? '🟢 Online' : '🟡 Offline'}
          </Text>
        </View>
      </View>

      {pendingSync > 0 && (
        <TouchableOpacity style={styles.syncBanner} onPress={triggerSync}>
          <Text style={styles.syncText}>
            ⏳ {pendingSync} operação(ões) pendente(s). Toque para sincronizar.
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.statsGrid}>
        <StatCard icon="🐮" value={a.active || '—'} label="Animais Ativos" />
        <StatCard icon="🌿" value={data?.pastures?.total || '—'} label="Pastos" color="#2563eb" />
        <StatCard icon="♂" value={a.males || '—'} label="Machos" color="#2563eb" />
        <StatCard icon="♀" value={a.females || '—'} label="Fêmeas" color="#ec4899" />
        <StatCard icon="💰" value={a.sold || '0'} label="Vendidos" color="#f59e0b" />
        <StatCard icon="⚖️" value={data?.avg_weight ? `${Number(data.avg_weight).toFixed(0)}kg` : '—'} label="Peso Médio" />
      </View>

      {!isOnline && (
        <View style={styles.offlineCard}>
          <Text style={styles.offlineTitle}>📵 Modo Offline</Text>
          <Text style={styles.offlineText}>
            As operações (pesagens, manejos, trocas de pasto) serão salvas localmente e enviadas automaticamente quando a internet retornar.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#14532d', padding: 20, paddingTop: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: '#86efac', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  syncBanner: {
    backgroundColor: '#fef3c7', padding: 12, margin: 12,
    borderRadius: 10, borderWidth: 1, borderColor: '#fcd34d',
  },
  syncText: { fontSize: 13, color: '#92400e', textAlign: 'center' },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    padding: 12, gap: 10,
  },
  statCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    width: '47%', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#dcfce7',
  },
  statIcon: { fontSize: 28 },
  statValue: { fontSize: 28, fontWeight: '700', marginTop: 4 },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2, textAlign: 'center' },
  offlineCard: {
    margin: 12, backgroundColor: '#fef3c7', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#fcd34d',
  },
  offlineTitle: { fontSize: 16, fontWeight: '700', color: '#92400e', marginBottom: 6 },
  offlineText: { fontSize: 13, color: '#78350f', lineHeight: 20 },
});

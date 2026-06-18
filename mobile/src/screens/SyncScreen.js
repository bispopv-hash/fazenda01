import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getPendingOperations, clearSynced } from '../services/localDB';
import { syncPendingOperations } from '../services/apiService';
import { useApp } from '../context/AppContext';

export default function SyncScreen() {
  const { isOnline, pendingSync } = useApp();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    const ops = await getPendingOperations();
    setPending(ops);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const sync = async () => {
    if (!isOnline) return Alert.alert('Sem internet', 'Conecte-se à internet para sincronizar.');
    setSyncing(true);
    try {
      const result = await syncPendingOperations();
      Alert.alert('Sincronizado', `${result.synced} operações enviadas. ${result.errors} erros.`);
      load();
    } catch (e) {
      Alert.alert('Erro', 'Falha na sincronização.');
    } finally {
      setSyncing(false);
    }
  };

  const opLabel = (type) => {
    const map = {
      'weighting:create': '⚖️ Nova pesagem',
      'management:create': '💉 Novo manejo',
      'pasture_move:create': '🔄 Troca de pasto',
      'animal:create': '🐄 Novo animal',
      'animal_event:create': '📋 Evento de animal',
    };
    return map[type] || type;
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2d6a4f" />;

  return (
    <View style={s.container}>
      <View style={[s.statusBar, { backgroundColor: isOnline ? '#d1fae5' : '#fee2e2' }]}>
        <Text style={[s.statusText, { color: isOnline ? '#065f46' : '#991b1b' }]}>
          {isOnline ? '🟢 Online' : '🔴 Offline'} — {pending.length} operações pendentes
        </Text>
      </View>

      {pending.length > 0 && (
        <TouchableOpacity style={[s.syncBtn, !isOnline && s.syncBtnDisabled]} onPress={sync} disabled={!isOnline || syncing}>
          {syncing
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.syncBtnText}>🔄 Sincronizar agora</Text>}
        </TouchableOpacity>
      )}

      <FlatList
        data={pending}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>✅</Text>
            <Text style={s.emptyText}>Tudo sincronizado!</Text>
            <Text style={s.emptySub}>Nenhuma operação pendente.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[s.item, item.status === 'error' && s.itemError]}>
            <Text style={s.itemType}>{opLabel(item.operation_type)}</Text>
            <Text style={s.itemDate}>{new Date(item.created_at).toLocaleString('pt-BR')}</Text>
            {item.status === 'error' && (
              <Text style={s.itemErrorText}>⚠️ Erro: {item.error_message}</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  statusBar: { padding: 14, alignItems: 'center' },
  statusText: { fontWeight: '600', fontSize: 14 },
  syncBtn: { margin: 16, backgroundColor: '#2d6a4f', borderRadius: 10, padding: 14, alignItems: 'center' },
  syncBtnDisabled: { backgroundColor: '#aaa' },
  syncBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  list: { padding: 16, paddingBottom: 40 },
  item: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, elevation: 1, borderLeftWidth: 4, borderLeftColor: '#2d6a4f' },
  itemError: { borderLeftColor: '#e63946' },
  itemType: { fontSize: 15, fontWeight: '600', color: '#1b4332' },
  itemDate: { fontSize: 12, color: '#888', marginTop: 4 },
  itemErrorText: { fontSize: 12, color: '#e63946', marginTop: 4 },
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#1b4332' },
  emptySub: { color: '#888', marginTop: 4 },
});

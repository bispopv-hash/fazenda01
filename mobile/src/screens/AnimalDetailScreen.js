import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { getAnimalDetail, fetchManagementTypes } from '../services/apiService';
import { enqueueOperation } from '../services/localDB';
import { useApp } from '../context/AppContext';

const TABS = ['Info', 'Pesagens', 'Manejos', 'Pastos', 'Eventos'];

export default function AnimalDetailScreen({ route }) {
  const { animalId } = route.params;
  const { isOnline } = useApp();
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Info');
  const [mgmtTypes, setMgmtTypes] = useState([]);

  // Modal states
  const [weightModal, setWeightModal] = useState(false);
  const [mgmtModal, setMgmtModal] = useState(false);
  const [moveModal, setMoveModal] = useState(false);

  // Form fields
  const [weightKg, setWeightKg] = useState('');
  const [weightDate, setWeightDate] = useState(new Date().toISOString().slice(0, 10));
  const [mgmtTypeId, setMgmtTypeId] = useState('');
  const [mgmtNotes, setMgmtNotes] = useState('');
  const [mgmtDate, setMgmtDate] = useState(new Date().toISOString().slice(0, 10));
  const [newPastureId, setNewPastureId] = useState('');
  const [moveDate, setMoveDate] = useState(new Date().toISOString().slice(0, 10));
  const [moveReason, setMoveReason] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await getAnimalDetail(animalId);
      setAnimal(data);
      const types = await fetchManagementTypes(data.farm_id);
      setMgmtTypes(types);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar o animal.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [animalId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const saveWeight = async () => {
    if (!weightKg) return Alert.alert('Atenção', 'Informe o peso.');
    await enqueueOperation('weighting:create', {
      animal_id: animalId,
      weight_kg: parseFloat(weightKg),
      weighting_date: weightDate,
      notes: '',
    });
    setWeightModal(false);
    setWeightKg('');
    Alert.alert('Salvo', isOnline ? 'Pesagem registrada.' : 'Pesagem salva offline. Será sincronizada quando houver internet.');
    load();
  };

  const saveMgmt = async () => {
    if (!mgmtTypeId) return Alert.alert('Atenção', 'Selecione o tipo de manejo.');
    await enqueueOperation('management:create', {
      animal_id: animalId,
      management_type_id: mgmtTypeId,
      management_date: mgmtDate,
      notes: mgmtNotes,
    });
    setMgmtModal(false);
    setMgmtNotes('');
    Alert.alert('Salvo', isOnline ? 'Manejo registrado.' : 'Manejo salvo offline.');
    load();
  };

  const saveMove = async () => {
    if (!newPastureId) return Alert.alert('Atenção', 'Informe o ID do pasto de destino.');
    await enqueueOperation('pasture_move:create', {
      animal_id: animalId,
      to_pasture_id: newPastureId,
      move_date: moveDate,
      reason: moveReason,
    });
    setMoveModal(false);
    setNewPastureId('');
    setMoveReason('');
    Alert.alert('Salvo', isOnline ? 'Troca de pasto registrada.' : 'Troca salva offline.');
    load();
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2d6a4f" />;
  if (!animal) return <View style={s.center}><Text>Animal não encontrado.</Text></View>;

  const renderInfo = () => (
    <View style={s.card}>
      <Row label="Tag" value={animal.tag} />
      <Row label="Nome" value={animal.name || '—'} />
      <Row label="Sexo" value={animal.sex === 'M' ? 'Macho' : 'Fêmea'} />
      <Row label="Raça" value={animal.breed_name || '—'} />
      <Row label="Nascimento" value={fmt(animal.birth_date)} />
      <Row label="Peso entrada" value={animal.entry_weight_kg ? `${animal.entry_weight_kg} kg` : '—'} />
      <Row label="Pasto atual" value={animal.current_pasture || '—'} />
      <Row label="Mãe (tag)" value={animal.mother_tag || '—'} />
      <Row label="Pai (tag)" value={animal.father_tag || '—'} />
      <Row label="Status" value={animal.status} />
    </View>
  );

  const renderWeightings = () => (
    <View>
      <TouchableOpacity style={s.addBtn} onPress={() => setWeightModal(true)}>
        <Text style={s.addBtnText}>+ Registrar Pesagem</Text>
      </TouchableOpacity>
      {(animal.weightings || []).length === 0
        ? <Text style={s.empty}>Nenhuma pesagem registrada.</Text>
        : (animal.weightings || []).map((w, i) => (
          <View key={i} style={s.listItem}>
            <Text style={s.listMain}>{w.weight_kg} kg</Text>
            <Text style={s.listSub}>{fmt(w.weighting_date)}</Text>
          </View>
        ))}
    </View>
  );

  const renderMgmts = () => (
    <View>
      <TouchableOpacity style={s.addBtn} onPress={() => setMgmtModal(true)}>
        <Text style={s.addBtnText}>+ Registrar Manejo</Text>
      </TouchableOpacity>
      {(animal.managements || []).length === 0
        ? <Text style={s.empty}>Nenhum manejo registrado.</Text>
        : (animal.managements || []).map((m, i) => (
          <View key={i} style={s.listItem}>
            <Text style={s.listMain}>{m.management_type}</Text>
            <Text style={s.listSub}>{fmt(m.management_date)}{m.notes ? ` — ${m.notes}` : ''}</Text>
          </View>
        ))}
    </View>
  );

  const renderMoves = () => (
    <View>
      <TouchableOpacity style={s.addBtn} onPress={() => setMoveModal(true)}>
        <Text style={s.addBtnText}>+ Trocar Pasto</Text>
      </TouchableOpacity>
      {(animal.pasture_moves || []).length === 0
        ? <Text style={s.empty}>Nenhuma troca de pasto.</Text>
        : (animal.pasture_moves || []).map((m, i) => (
          <View key={i} style={s.listItem}>
            <Text style={s.listMain}>{m.from_pasture || 'Entrada'} → {m.to_pasture}</Text>
            <Text style={s.listSub}>{fmt(m.move_date)}{m.reason ? ` — ${m.reason}` : ''}</Text>
          </View>
        ))}
    </View>
  );

  const renderEvents = () => (
    <View>
      {(animal.events || []).length === 0
        ? <Text style={s.empty}>Nenhum evento registrado.</Text>
        : (animal.events || []).map((e, i) => (
          <View key={i} style={s.listItem}>
            <Text style={s.listMain}>{e.event_type}</Text>
            <Text style={s.listSub}>{fmt(e.event_date)}{e.notes ? ` — ${e.notes}` : ''}</Text>
          </View>
        ))}
    </View>
  );

  return (
    <View style={s.container}>
      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[s.tab, activeTab === t && s.tabActive]} onPress={() => setActiveTab(t)}>
            <Text style={[s.tabText, activeTab === t && s.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={s.tagTitle}>{animal.tag}{animal.name ? ` — ${animal.name}` : ''}</Text>
        {activeTab === 'Info' && renderInfo()}
        {activeTab === 'Pesagens' && renderWeightings()}
        {activeTab === 'Manejos' && renderMgmts()}
        {activeTab === 'Pastos' && renderMoves()}
        {activeTab === 'Eventos' && renderEvents()}
      </ScrollView>

      {/* Weight Modal */}
      <FormModal
        visible={weightModal}
        title="Nova Pesagem"
        onClose={() => setWeightModal(false)}
        onSave={saveWeight}
      >
        <Label>Peso (kg)</Label>
        <TextInput style={s.input} keyboardType="numeric" value={weightKg} onChangeText={setWeightKg} placeholder="Ex: 320.5" />
        <Label>Data (AAAA-MM-DD)</Label>
        <TextInput style={s.input} value={weightDate} onChangeText={setWeightDate} />
      </FormModal>

      {/* Management Modal */}
      <FormModal
        visible={mgmtModal}
        title="Novo Manejo"
        onClose={() => setMgmtModal(false)}
        onSave={saveMgmt}
      >
        <Label>Tipo de Manejo</Label>
        <ScrollView horizontal style={{ marginBottom: 12 }}>
          {mgmtTypes.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[s.chip, mgmtTypeId === t.id && s.chipActive]}
              onPress={() => setMgmtTypeId(t.id)}
            >
              <Text style={[s.chipText, mgmtTypeId === t.id && s.chipTextActive]}>{t.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Label>Data (AAAA-MM-DD)</Label>
        <TextInput style={s.input} value={mgmtDate} onChangeText={setMgmtDate} />
        <Label>Observações</Label>
        <TextInput style={[s.input, { height: 70 }]} multiline value={mgmtNotes} onChangeText={setMgmtNotes} />
      </FormModal>

      {/* Pasture Move Modal */}
      <FormModal
        visible={moveModal}
        title="Trocar Pasto"
        onClose={() => setMoveModal(false)}
        onSave={saveMove}
      >
        <Label>ID do Pasto de Destino</Label>
        <TextInput style={s.input} value={newPastureId} onChangeText={setNewPastureId} placeholder="UUID do pasto" />
        <Label>Data (AAAA-MM-DD)</Label>
        <TextInput style={s.input} value={moveDate} onChangeText={setMoveDate} />
        <Label>Motivo</Label>
        <TextInput style={s.input} value={moveReason} onChangeText={setMoveReason} />
      </FormModal>
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

function Label({ children }) {
  return <Text style={s.fieldLabel}>{children}</Text>;
}

function FormModal({ visible, title, onClose, onSave, children }) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.modal}>
          <Text style={s.modalTitle}>{title}</Text>
          <ScrollView>{children}</ScrollView>
          <View style={s.modalActions}>
            <TouchableOpacity style={s.btnCancel} onPress={onClose}>
              <Text style={s.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSave} onPress={onSave}>
              <Text style={s.btnSaveText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function fmt(d) {
  if (!d) return '—';
  return d.slice(0, 10);
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tagTitle: { fontSize: 20, fontWeight: 'bold', color: '#1b4332', marginBottom: 16 },
  tabBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  tab: { paddingHorizontal: 20, paddingVertical: 14 },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#2d6a4f' },
  tabText: { color: '#666', fontSize: 14 },
  tabTextActive: { color: '#2d6a4f', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowLabel: { color: '#666', fontSize: 14 },
  rowValue: { color: '#1b4332', fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' },
  addBtn: { backgroundColor: '#2d6a4f', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 16 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  listItem: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 8, elevation: 1 },
  listMain: { fontSize: 15, color: '#1b4332', fontWeight: '600' },
  listSub: { fontSize: 13, color: '#666', marginTop: 2 },
  empty: { textAlign: 'center', color: '#999', marginTop: 32 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1b4332', marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btnCancel: { flex: 1, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', padding: 14, alignItems: 'center' },
  btnCancelText: { color: '#666' },
  btnSave: { flex: 1, borderRadius: 8, backgroundColor: '#2d6a4f', padding: 14, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: 'bold' },
  fieldLabel: { fontSize: 13, color: '#555', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 15, backgroundColor: '#fafafa' },
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  chipActive: { backgroundColor: '#2d6a4f', borderColor: '#2d6a4f' },
  chipText: { color: '#555', fontSize: 13 },
  chipTextActive: { color: '#fff' },
});

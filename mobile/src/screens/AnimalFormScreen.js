import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { fetchPastures } from '../services/apiService';
import { enqueueOperation } from '../services/localDB';
import { useApp } from '../context/AppContext';

export default function AnimalFormScreen({ navigation }) {
  const { currentFarm } = useApp();
  const [saving, setSaving] = useState(false);
  const [pastures, setPastures] = useState([]);

  const [tag, setTag] = useState('');
  const [name, setName] = useState('');
  const [sex, setSex] = useState('M');
  const [breedName, setBreedName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [entryWeight, setEntryWeight] = useState('');
  const [motherTag, setMotherTag] = useState('');
  const [fatherTag, setFatherTag] = useState('');
  const [pastureId, setPastureId] = useState('');
  const [entryType, setEntryType] = useState('birth');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (currentFarm) {
      fetchPastures(currentFarm.id).then(setPastures).catch(() => {});
    }
  }, [currentFarm]);

  const save = async () => {
    if (!tag) return Alert.alert('Atenção', 'Informe a tag/identificação do animal.');
    setSaving(true);
    try {
      await enqueueOperation('animal:create', {
        farm_id: currentFarm.id,
        tag,
        name: name || null,
        sex,
        breed_name: breedName || null,
        birth_date: birthDate || null,
        entry_date: entryDate,
        entry_weight_kg: entryWeight ? parseFloat(entryWeight) : null,
        mother_tag: motherTag || null,
        father_tag: fatherTag || null,
        pasture_id: pastureId || null,
        entry_event_type: entryType,
        notes: notes || null,
      });
      Alert.alert('Salvo', 'Animal cadastrado. Será sincronizado quando houver internet.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o animal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.sectionTitle}>Identificação</Text>

      <Text style={s.label}>Tag / Número *</Text>
      <TextInput style={s.input} value={tag} onChangeText={setTag} placeholder="Ex: 1042" />

      <Text style={s.label}>Nome (opcional)</Text>
      <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Ex: Mimosa" />

      <Text style={s.label}>Sexo</Text>
      <View style={s.row}>
        {['M', 'F'].map(v => (
          <TouchableOpacity key={v} style={[s.chip, sex === v && s.chipActive]} onPress={() => setSex(v)}>
            <Text style={[s.chipText, sex === v && s.chipTextActive]}>{v === 'M' ? 'Macho' : 'Fêmea'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Raça</Text>
      <TextInput style={s.input} value={breedName} onChangeText={setBreedName} placeholder="Ex: Nelore" />

      <Text style={s.sectionTitle}>Datas e Peso</Text>

      <Text style={s.label}>Data de Nascimento (AAAA-MM-DD)</Text>
      <TextInput style={s.input} value={birthDate} onChangeText={setBirthDate} placeholder="2024-03-15" />

      <Text style={s.label}>Data de Entrada (AAAA-MM-DD)</Text>
      <TextInput style={s.input} value={entryDate} onChangeText={setEntryDate} />

      <Text style={s.label}>Peso de Entrada (kg)</Text>
      <TextInput style={s.input} value={entryWeight} onChangeText={setEntryWeight} keyboardType="numeric" placeholder="Ex: 280" />

      <Text style={s.sectionTitle}>Origem</Text>

      <Text style={s.label}>Tipo de Entrada</Text>
      <View style={s.row}>
        {['birth', 'purchase', 'transfer'].map(v => (
          <TouchableOpacity key={v} style={[s.chip, entryType === v && s.chipActive]} onPress={() => setEntryType(v)}>
            <Text style={[s.chipText, entryType === v && s.chipTextActive]}>
              {v === 'birth' ? 'Nascimento' : v === 'purchase' ? 'Compra' : 'Transferência'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Tag da Mãe</Text>
      <TextInput style={s.input} value={motherTag} onChangeText={setMotherTag} placeholder="Tag da vaca mãe" />

      <Text style={s.label}>Tag do Pai</Text>
      <TextInput style={s.input} value={fatherTag} onChangeText={setFatherTag} placeholder="Tag do touro pai" />

      <Text style={s.sectionTitle}>Localização</Text>

      <Text style={s.label}>Pasto</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        {pastures.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[s.chip, pastureId === p.id && s.chipActive]}
            onPress={() => setPastureId(p.id)}
          >
            <Text style={[s.chipText, pastureId === p.id && s.chipTextActive]}>{p.name}</Text>
          </TouchableOpacity>
        ))}
        {pastures.length === 0 && <Text style={{ color: '#999', padding: 8 }}>Nenhum pasto disponível (offline)</Text>}
      </ScrollView>

      <Text style={s.label}>Observações</Text>
      <TextInput style={[s.input, { height: 80 }]} multiline value={notes} onChangeText={setNotes} />

      <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Cadastrar Animal</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1b4332', marginTop: 20, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#d0e8dd', paddingBottom: 6 },
  label: { fontSize: 13, color: '#555', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 15, backgroundColor: '#fff' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, marginBottom: 4 },
  chipActive: { backgroundColor: '#2d6a4f', borderColor: '#2d6a4f' },
  chipText: { color: '#555', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2d6a4f', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

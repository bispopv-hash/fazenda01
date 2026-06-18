import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function AnimalForm({ animal, farms, farmId, onClose, onSaved }) {
  const [form, setForm] = useState({
    tag: '', name: '', sex: 'M', breed_id: '', birth_date: '',
    birth_type: 'natural', mother_id: '', father_id: '',
    current_pasture_id: '', entry_type: 'birth',
    entry_date: new Date().toISOString().split('T')[0],
    initial_weight: '', notes: '', purchase_price: '', seller_name: '',
    ...animal,
  });
  const [breeds, setBreeds] = useState([]);
  const [pastures, setPastures] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/breeds'),
      api.get(`/farms/${farmId}/pastures`),
      api.get(`/farms/${farmId}/animals`),
    ]).then(([b, p, a]) => {
      setBreeds(b.data);
      setPastures(p.data);
      setAnimals(a.data.filter(a => a.id !== animal?.id));
    });
  }, [farmId, animal?.id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (animal?.id) {
        await api.put(`/animals/${animal.id}`, form);
      } else {
        await api.post(`/farms/${farmId}/animals`, form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{animal ? '✏️ Editar Animal' : '➕ Novo Animal'}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Brinco/Identificação *</label>
              <input value={form.tag} onChange={e => set('tag', e.target.value)} required placeholder="Ex: 001, BR001" />
            </div>
            <div className="form-group">
              <label>Nome</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome do animal" />
            </div>
            <div className="form-group">
              <label>Sexo *</label>
              <select value={form.sex} onChange={e => set('sex', e.target.value)} required>
                <option value="M">Macho</option>
                <option value="F">Fêmea</option>
              </select>
            </div>
            <div className="form-group">
              <label>Raça</label>
              <select value={form.breed_id} onChange={e => set('breed_id', e.target.value)}>
                <option value="">Selecionar...</option>
                {breeds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Data de Nascimento</label>
              <input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Tipo de Parto</label>
              <select value={form.birth_type} onChange={e => set('birth_type', e.target.value)}>
                <option value="natural">Natural</option>
                <option value="cesarean">Cesáreo</option>
                <option value="assisted">Assistido</option>
              </select>
            </div>
            <div className="form-group">
              <label>Mãe</label>
              <select value={form.mother_id} onChange={e => set('mother_id', e.target.value)}>
                <option value="">Selecionar...</option>
                {animals.filter(a => a.sex === 'F').map(a => (
                  <option key={a.id} value={a.id}>{a.tag} {a.name ? `— ${a.name}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Pai</label>
              <select value={form.father_id} onChange={e => set('father_id', e.target.value)}>
                <option value="">Selecionar...</option>
                {animals.filter(a => a.sex === 'M').map(a => (
                  <option key={a.id} value={a.id}>{a.tag} {a.name ? `— ${a.name}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Pasto Atual</label>
              <select value={form.current_pasture_id} onChange={e => set('current_pasture_id', e.target.value)}>
                <option value="">Sem pasto</option>
                {pastures.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {!animal && (
              <>
                <div className="form-group">
                  <label>Forma de Entrada</label>
                  <select value={form.entry_type} onChange={e => set('entry_type', e.target.value)}>
                    <option value="birth">Nascimento</option>
                    <option value="purchase">Compra</option>
                    <option value="transfer">Transferência</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Data de Entrada</label>
                  <input type="date" value={form.entry_date} onChange={e => set('entry_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Peso Inicial (kg)</label>
                  <input type="number" step="0.1" value={form.initial_weight} onChange={e => set('initial_weight', e.target.value)} placeholder="0.0" />
                </div>
                {form.entry_type === 'purchase' && (
                  <>
                    <div className="form-group">
                      <label>Valor de Compra (R$)</label>
                      <input type="number" step="0.01" value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Vendedor</label>
                      <input value={form.seller_name} onChange={e => set('seller_name', e.target.value)} />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Observações</label>
            <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : '💾 Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AnimalsPage() {
  const { currentFarm } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAnimal, setEditAnimal] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const navigate = useNavigate();

  const load = useCallback(() => {
    if (!currentFarm) return;
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (search) params.search = search;
    api.get(`/farms/${currentFarm.id}/animals`, { params })
      .then(r => setAnimals(r.data))
      .finally(() => setLoading(false));
  }, [currentFarm, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const STATUS_LABELS = {
    active: 'Ativo', sold: 'Vendido', dead: 'Morto', transferred: 'Transferido'
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">🐮 Animais</h1>
        <button className="btn btn-primary" onClick={() => { setEditAnimal(null); setShowForm(true); }}>
          ➕ Novo Animal
        </button>
      </div>

      <div className="search-bar">
        <input
          placeholder="Buscar por brinco ou nome..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}>
          <option value="">Todos</option>
          <option value="active">Ativos</option>
          <option value="sold">Vendidos</option>
          <option value="dead">Mortos</option>
          <option value="transferred">Transferidos</option>
        </select>
        <button className="btn btn-secondary" onClick={load}>🔄</button>
      </div>

      <div className="card">
        {loading ? <div className="loading">Carregando...</div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Brinco</th><th>Nome</th><th>Sexo</th><th>Raça</th>
                  <th>Nascimento</th><th>Pasto</th><th>Último Peso</th>
                  <th>Status</th><th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {animals.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>Nenhum animal encontrado</td></tr>
                ) : animals.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.tag}</strong></td>
                    <td>{a.name || '—'}</td>
                    <td><span className={`badge badge-${a.sex}`}>{a.sex === 'M' ? '♂ Macho' : '♀ Fêmea'}</span></td>
                    <td>{a.breed || '—'}</td>
                    <td>{a.birth_date ? new Date(a.birth_date).toLocaleDateString('pt-BR') : '—'}</td>
                    <td>{a.pasture || '—'}</td>
                    <td>{a.last_weight ? `${a.last_weight} kg` : '—'}</td>
                    <td><span className={`badge badge-${a.status}`}>{STATUS_LABELS[a.status]}</span></td>
                    <td style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/animals/${a.id}`)}>👁</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditAnimal(a); setShowForm(true); }}>✏️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <AnimalForm
          animal={editAnimal}
          farmId={currentFarm?.id}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </>
  );
}

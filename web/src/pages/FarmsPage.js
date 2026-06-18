import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

function FarmForm({ farm, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', owner_name: '', state: '', city: '', address: '', total_area_ha: '', ...farm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (farm?.id) await api.put(`/farms/${farm.id}`, form);
      else await api.post('/farms', form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar');
    } finally { setSaving(false); }
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{farm ? '✏️ Editar Fazenda' : '➕ Nova Fazenda'}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group"><label>Nome *</label><input required value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="form-group"><label>Proprietário</label><input value={form.owner_name} onChange={e => set('owner_name', e.target.value)} /></div>
            <div className="form-group"><label>Estado (UF)</label><input maxLength={2} value={form.state} onChange={e => set('state', e.target.value.toUpperCase())} placeholder="MT" /></div>
            <div className="form-group"><label>Município</label><input value={form.city} onChange={e => set('city', e.target.value)} /></div>
            <div className="form-group"><label>Área Total (ha)</label><input type="number" step="0.1" value={form.total_area_ha} onChange={e => set('total_area_ha', e.target.value)} /></div>
          </div>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Endereço</label>
            <textarea rows={2} value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : '💾 Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FarmsPage() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = useCallback(() => {
    api.get('/farms').then(r => setFarms(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">🏡 Fazendas</h1>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setShowForm(true); }}>➕ Nova Fazenda</button>
      </div>

      <div className="card">
        {loading ? <div className="loading">Carregando...</div> : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Nome</th><th>Proprietário</th><th>Localização</th><th>Área (ha)</th><th>Animais</th><th>Ações</th></tr></thead>
              <tbody>
                {farms.length === 0
                  ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>Nenhuma fazenda</td></tr>
                  : farms.map(f => (
                    <tr key={f.id}>
                      <td><strong>{f.name}</strong></td>
                      <td>{f.owner_name || '—'}</td>
                      <td>{[f.city, f.state].filter(Boolean).join(' — ') || '—'}</td>
                      <td>{f.total_area_ha ? `${f.total_area_ha} ha` : '—'}</td>
                      <td>{f.animal_count || 0}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditItem(f); setShowForm(true); }}>✏️</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && <FarmForm farm={editItem} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </>
  );
}

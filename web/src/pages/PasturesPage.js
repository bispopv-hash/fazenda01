import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function PastureForm({ pasture, farmId, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', area_ha: '', grass_type: '', capacity: '', ...pasture });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    if (pasture?.id) await api.put(`/pastures/${pasture.id}`, form);
    else await api.post(`/farms/${farmId}/pastures`, form);
    onSaved(); setSaving(false);
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <h2 className="modal-title">{pasture ? '✏️ Editar Pasto' : '➕ Novo Pasto'}</h2>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Nome *</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Pasto 1, Piquete A" />
            </div>
            <div className="form-group">
              <label>Área (ha)</label>
              <input type="number" step="0.1" value={form.area_ha} onChange={e => set('area_ha', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Tipo de Gramínea</label>
              <input value={form.grass_type} onChange={e => set('grass_type', e.target.value)} placeholder="Brachiaria brizantha..." />
            </div>
            <div className="form-group">
              <label>Capacidade (animais)</label>
              <input type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)} />
            </div>
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

export default function PasturesPage() {
  const { currentFarm } = useAuth();
  const [pastures, setPastures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = useCallback(() => {
    if (!currentFarm) return;
    api.get(`/farms/${currentFarm.id}/pastures`)
      .then(r => setPastures(r.data))
      .finally(() => setLoading(false));
  }, [currentFarm]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    if (window.confirm('Desativar este pasto?')) {
      await api.delete(`/pastures/${id}`);
      load();
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">🌿 Pastos</h1>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setShowForm(true); }}>➕ Novo Pasto</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {loading ? <div className="loading">Carregando...</div> :
          pastures.length === 0
            ? <div className="empty-state"><div className="emoji">🌿</div><p>Nenhum pasto cadastrado</p></div>
            : pastures.map(p => (
              <div key={p.id} className="card" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#14532d' }}>{p.name}</h3>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditItem(p); setShowForm(true); }}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(p.id)}>🗑</button>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    ['Área', p.area_ha ? `${p.area_ha} ha` : '—'],
                    ['Gramínea', p.grass_type || '—'],
                    ['Capacidade', p.capacity ? `${p.capacity} animais` : '—'],
                    ['Animais Atuais', <strong style={{ color: '#16a34a' }}>{p.animal_count || 0}</strong>],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{k}</div>
                      <div style={{ fontSize: 14 }}>{v}</div>
                    </div>
                  ))}
                </div>
                {p.capacity > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                      Ocupação: {Math.round((p.animal_count / p.capacity) * 100)}%
                    </div>
                    <div style={{ background: '#dcfce7', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        width: `${Math.min(100, Math.round((p.animal_count / p.capacity) * 100))}%`,
                        background: p.animal_count > p.capacity ? '#dc2626' : '#16a34a',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                  </div>
                )}
              </div>
            ))
        }
      </div>

      {showForm && (
        <PastureForm
          pasture={editItem} farmId={currentFarm?.id}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </>
  );
}

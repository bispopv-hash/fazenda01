import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const CATEGORIES = [
  { value: '', label: 'Sem categoria' },
  { value: 'vacina', label: '💉 Vacina' },
  { value: 'vermifugo', label: '🐛 Vermífugo' },
  { value: 'medicamento', label: '💊 Medicamento' },
  { value: 'exame', label: '🔬 Exame' },
  { value: 'reproducao', label: '🐄 Reprodução' },
  { value: 'outro', label: '📋 Outro' },
];

function TypeForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({ name: initial?.name || '', category: initial?.category || '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (initial) {
        await api.put(`/management-types/${initial.id}`, form);
      } else {
        await api.post('/management-types', form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <h2 className="modal-title">{initial ? '✏️ Editar Tipo' : '➕ Novo Tipo de Manejo'}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Nome *</label>
            <input
              required
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Ex: Pariu, Vacinação febre aftosa..."
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Categoria</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
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

export default function ManagementTypesPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get('/management-types')
      .then(r => setTypes(r.data))
      .catch(() => setError('Erro ao carregar tipos de manejo'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (type) => {
    if (!window.confirm(`Excluir "${type.name}"?`)) return;
    try {
      await api.delete(`/management-types/${type.id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao excluir');
    }
  };

  const filtered = types.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const grouped = CATEGORIES.slice(1).reduce((acc, c) => {
    const items = filtered.filter(t => t.category === c.value);
    if (items.length) acc.push({ label: c.label, items });
    return acc;
  }, []);
  const semCategoria = filtered.filter(t => !t.category);
  if (semCategoria.length) grouped.push({ label: 'Sem categoria', items: semCategoria });

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">💉 Tipos de Manejo</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          ➕ Novo Tipo
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <input
          placeholder="🔍 Buscar por nome ou categoria..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
        />
      </div>

      {loading ? (
        <div className="card"><div className="loading">Carregando...</div></div>
      ) : filtered.length === 0 ? (
        <div className="card"><p style={{ color: '#6b7280', textAlign: 'center' }}>Nenhum tipo encontrado.</p></div>
      ) : (
        grouped.map(group => (
          <div key={group.label} className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#166534', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              {group.label}
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Categoria</th>
                    <th style={{ width: 120 }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map(t => (
                    <tr key={t.id}>
                      <td><strong>{t.name}</strong></td>
                      <td>
                        <span className="badge badge-active" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                          {CATEGORIES.find(c => c.value === t.category)?.label || '—'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => { setEditing(t); setShowForm(true); }}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
                            onClick={() => handleDelete(t)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {showForm && (
        <TypeForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </>
  );
}

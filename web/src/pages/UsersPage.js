import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const ROLES = { admin: 'Administrador', owner: 'Proprietário', manager: 'Gerente', foreman: 'Capataz', vet: 'Veterinário' };

function UserForm({ onClose, onSaved, farms }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'foreman', farm_ids: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleFarm = (id) => setForm(f => ({ ...f, farm_ids: f.farm_ids.includes(id) ? f.farm_ids.filter(x => x !== id) : [...f.farm_ids, id] }));
  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try { await api.post('/auth/register', form); onSaved(); }
    catch (err) { setError(err.response?.data?.error || 'Erro'); setSaving(false); }
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <h2 className="modal-title">➕ Novo Usuário</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group"><label>Nome *</label><input required value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="form-group"><label>E-mail *</label><input type="email" required value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="form-group"><label>Senha *</label><input type="password" required value={form.password} onChange={e => set('password', e.target.value)} /></div>
            <div className="form-group"><label>Perfil *</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}>
                {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Fazendas com acesso:</div>
            {farms.map(f => (
              <label key={f.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.farm_ids.includes(f.id)} onChange={() => toggleFarm(f.id)} />
                {f.name}
              </label>
            ))}
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Criando...' : '💾 Criar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserForm({ user, farms, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: user.name,
    role: user.role,
    active: user.active,
    farm_ids: user.farm_ids || [],
    new_password: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleFarm = (id) => setForm(f => ({
    ...f,
    farm_ids: f.farm_ids.includes(id) ? f.farm_ids.filter(x => x !== id) : [...f.farm_ids, id]
  }));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { name: form.name, role: form.role, active: form.active, farm_ids: form.farm_ids };
      if (form.new_password) payload.password = form.new_password;
      await api.put(`/users/${user.id}`, payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <h2 className="modal-title">✏️ Editar Usuário</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Nome *</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label>E-mail</label>
              <input value={user.email} disabled style={{ background: '#f3f4f6', color: '#6b7280' }} />
            </div>
            <div className="form-group">
              <label>Perfil *</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}>
                {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.active ? 'true' : 'false'} onChange={e => set('active', e.target.value === 'true')}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Nova Senha <span style={{ color: '#9ca3af', fontWeight: 400 }}>(deixe em branco para não alterar)</span></label>
              <input type="password" value={form.new_password} onChange={e => set('new_password', e.target.value)} placeholder="••••••••" />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Fazendas com acesso:</div>
            {farms.map(f => (
              <label key={f.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.farm_ids.includes(f.id)} onChange={() => toggleFarm(f.id)} />
                {f.name}
              </label>
            ))}
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

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    Promise.all([
      api.get('/users'),
      api.get('/farms'),
    ]).then(([u, f]) => { setUsers(u.data); setFarms(f.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = async (user) => {
    // Carrega fazendas do usuário para pré-selecionar checkboxes
    try {
      const r = await api.get(`/users/${user.id}/farms`);
      setEditing({ ...user, farm_ids: r.data.map(f => f.id) });
    } catch {
      setEditing({ ...user, farm_ids: [] });
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">👥 Usuários</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>➕ Novo Usuário</button>
      </div>
      <div className="card">
        {loading ? <div className="loading">Carregando...</div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>{ROLES[u.role]}</td>
                    <td>
                      <span className={`badge ${u.active ? 'badge-active' : 'badge-dead'}`}>
                        {u.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>
                          ✏️ Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <UserForm farms={farms} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
      {editing && (
        <EditUserForm
          user={editing}
          farms={farms}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </>
  );
}

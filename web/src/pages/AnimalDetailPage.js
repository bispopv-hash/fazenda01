import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function WeightForm({ animalId, onSaved, onClose }) {
  const [form, setForm] = useState({ weight_kg: '', weighting_date: new Date().toISOString().split('T')[0], notes: '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    await api.post(`/animals/${animalId}/weightings`, form);
    onSaved(); setSaving(false);
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <h2 className="modal-title">⚖️ Nova Pesagem</h2>
        <form onSubmit={submit}>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Peso (kg) *</label>
            <input type="number" step="0.1" required value={form.weight_kg} onChange={e => setForm({ ...form, weight_kg: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Data</label>
            <input type="date" value={form.weighting_date} onChange={e => setForm({ ...form, weighting_date: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Observações</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
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

function ManagementForm({ animalId, onSaved, onClose }) {
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState({ management_type_id: '', management_date: new Date().toISOString().split('T')[0], notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/management-types').then(r => setTypes(r.data)); }, []);

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.post(`/animals/${animalId}/managements`, form);
      onSaved();
    } catch (err) { setError(err.response?.data?.error || 'Erro ao salvar'); setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <h2 className="modal-title">💉 Registrar Manejo</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Tipo de Manejo *</label>
            <select required value={form.management_type_id} onChange={e => setForm({ ...form, management_type_id: e.target.value })}>
              <option value="">Selecionar...</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Data</label>
            <input type="date" value={form.management_date} onChange={e => setForm({ ...form, management_date: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Observações</label>
            <textarea rows={3} value={form.notes} placeholder="Ex: Animal reagiu bem, próxima dose em 30 dias..." onChange={e => setForm({ ...form, notes: e.target.value })} />
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

function EventForm({ animal, pastures, onSaved, onClose }) {
  const [form, setForm] = useState({ event_type: 'sale', event_date: new Date().toISOString().split('T')[0], counterpart: '', price: '', cause_of_death: '', destination_farm: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    await api.post(`/animals/${animal.id}/events`, form);
    onSaved(); setSaving(false);
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <h2 className="modal-title">📋 Registrar Evento</h2>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Tipo de Evento *</label>
              <select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}>
                <option value="sale">Venda</option>
                <option value="death">Morte</option>
                <option value="transfer">Transferência</option>
              </select>
            </div>
            <div className="form-group">
              <label>Data</label>
              <input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} />
            </div>
            {(form.event_type === 'sale' || form.event_type === 'purchase') && (
              <>
                <div className="form-group">
                  <label>{form.event_type === 'sale' ? 'Comprador' : 'Vendedor'}</label>
                  <input value={form.counterpart} onChange={e => setForm({ ...form, counterpart: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Valor (R$)</label>
                  <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                </div>
              </>
            )}
            {form.event_type === 'death' && (
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>Causa da Morte</label>
                <input value={form.cause_of_death} onChange={e => setForm({ ...form, cause_of_death: e.target.value })} />
              </div>
            )}
            {form.event_type === 'transfer' && (
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>Fazenda Destino</label>
                <input value={form.destination_farm} onChange={e => setForm({ ...form, destination_farm: e.target.value })} />
              </div>
            )}
          </div>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Observações</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
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

export default function AnimalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentFarm } = useAuth();
  const [animal, setAnimal] = useState(null);
  const [pastures, setPastures] = useState([]);
  const [tab, setTab] = useState('info');
  const [showWeight, setShowWeight] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [showEvent, setShowEvent] = useState(false);
  const [showMoveForm, setShowMoveForm] = useState(false);

  const load = () => {
    api.get(`/animals/${id}`).then(r => setAnimal(r.data));
    if (currentFarm) api.get(`/farms/${currentFarm.id}/pastures`).then(r => setPastures(r.data));
  };

  useEffect(() => { load(); }, [id]);

  if (!animal) return <div className="loading">Carregando...</div>;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  return (
    <>
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/animals')} style={{ marginBottom: 8 }}>← Voltar</button>
          <h1 className="page-title">🐮 {animal.tag} {animal.name ? `— ${animal.name}` : ''}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowWeight(true)}>⚖️ Pesagem</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowManagement(true)}>💉 Manejo</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowMoveForm(true)}>🌿 Trocar Pasto</button>
          <button className="btn btn-danger btn-sm" onClick={() => setShowEvent(true)}>📋 Evento</button>
        </div>
      </div>

      <div className="tabs">
        {['info','weights','managements','moves','events'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {{ info: '📋 Info', weights: '⚖️ Pesagens', managements: '💉 Manejos', moves: '🌿 Trocas de Pasto', events: '📅 Eventos' }[t]}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              ['Brinco', animal.tag], ['Nome', animal.name || '—'], ['Sexo', animal.sex === 'M' ? '♂ Macho' : '♀ Fêmea'],
              ['Raça', animal.breed_name || '—'], ['Nascimento', fmtDate(animal.birth_date)],
              ['Tipo de Parto', animal.birth_type], ['Status', animal.status], ['Pasto Atual', animal.pasture_name || '—'],
              ['Mãe', animal.mother_tag ? `${animal.mother_tag}${animal.mother_name ? ' — '+animal.mother_name : ''}` : '—'],
              ['Pai', animal.father_tag ? `${animal.father_tag}${animal.father_name ? ' — '+animal.father_name : ''}` : '—'],
              ['Entrada', animal.entry_type], ['Data Entrada', fmtDate(animal.entry_date)],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{k}</div>
                <div style={{ fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
          {animal.notes && <div style={{ marginTop: 16, padding: '12px', background: '#f9fafb', borderRadius: 8, fontSize: 13 }}>
            <strong>Observações:</strong> {animal.notes}
          </div>}
        </div>
      )}

      {tab === 'weights' && (
        <div className="card">
          <table><thead><tr><th>Data</th><th>Peso (kg)</th><th>Responsável</th><th>Obs.</th></tr></thead>
            <tbody>
              {animal.weights?.length === 0
                ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Sem pesagens</td></tr>
                : animal.weights?.map(w => (
                  <tr key={w.id}>
                    <td>{fmtDate(w.weighting_date)}</td>
                    <td><strong>{w.weight_kg} kg</strong></td>
                    <td>{w.responsible_name || '—'}</td>
                    <td>{w.notes || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'managements' && (
        <div className="card">
          <table><thead><tr><th>Data</th><th>Tipo</th><th>Produto</th><th>Dose</th><th>Observações</th><th>Responsável</th></tr></thead>
            <tbody>
              {animal.managements?.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Sem manejos</td></tr>
                : animal.managements?.map(m => (
                  <tr key={m.id}>
                    <td>{fmtDate(m.management_date)}</td>
                    <td>{m.type_name || m.custom_type || '—'}</td>
                    <td>{m.product || '—'}</td>
                    <td>{m.dose || '—'}</td>
                    <td>{m.notes || '—'}</td>
                    <td>{m.responsible_name || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'moves' && (
        <div className="card">
          <table><thead><tr><th>Data</th><th>De</th><th>Para</th><th>Responsável</th></tr></thead>
            <tbody>
              {animal.pasture_moves?.length === 0
                ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Sem movimentações</td></tr>
                : animal.pasture_moves?.map(m => (
                  <tr key={m.id}>
                    <td>{fmtDate(m.move_date)}</td>
                    <td>{m.from_pasture || '—'}</td>
                    <td><strong>{m.to_pasture}</strong></td>
                    <td>{m.responsible_name || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'events' && (
        <div className="card">
          <table><thead><tr><th>Data</th><th>Tipo</th><th>Contraparte</th><th>Valor</th><th>Obs.</th></tr></thead>
            <tbody>
              {animal.events?.length === 0
                ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Sem eventos</td></tr>
                : animal.events?.map(e => (
                  <tr key={e.id}>
                    <td>{fmtDate(e.event_date)}</td>
                    <td>{e.event_type}</td>
                    <td>{e.counterpart || e.cause_of_death || e.destination_farm || '—'}</td>
                    <td>{e.price ? `R$ ${Number(e.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</td>
                    <td>{e.notes || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {showWeight && <WeightForm animalId={id} onSaved={() => { setShowWeight(false); load(); }} onClose={() => setShowWeight(false)} />}
      {showManagement && <ManagementForm animalId={id} onSaved={() => { setShowManagement(false); load(); }} onClose={() => setShowManagement(false)} />}
      {showEvent && <EventForm animal={animal} pastures={pastures} onSaved={() => { setShowEvent(false); load(); }} onClose={() => setShowEvent(false)} />}
      {showMoveForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowMoveForm(false)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <h2 className="modal-title">🌿 Trocar Pasto</h2>
            <MoveForm animalId={id} pastures={pastures} currentPasture={animal.current_pasture_id}
              onSaved={() => { setShowMoveForm(false); load(); }} onClose={() => setShowMoveForm(false)} />
          </div>
        </div>
      )}
    </>
  );
}

function MoveForm({ animalId, pastures, currentPasture, onSaved, onClose }) {
  const [form, setForm] = useState({ to_pasture_id: '', move_date: new Date().toISOString().split('T')[0], notes: '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    await api.post(`/animals/${animalId}/pasture-moves`, form);
    onSaved(); setSaving(false);
  };
  return (
    <form onSubmit={submit}>
      <div className="form-group" style={{ marginBottom: 12 }}>
        <label>Pasto Destino *</label>
        <select value={form.to_pasture_id} onChange={e => setForm({ ...form, to_pasture_id: e.target.value })} required>
          <option value="">Selecionar...</option>
          {pastures.filter(p => p.id !== currentPasture).map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div className="form-group" style={{ marginBottom: 12 }}>
        <label>Data</label>
        <input type="date" value={form.move_date} onChange={e => setForm({ ...form, move_date: e.target.value })} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Movendo...' : '✅ Mover'}</button>
      </div>
    </form>
  );
}

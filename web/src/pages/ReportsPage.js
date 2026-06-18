import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
  const { currentFarm } = useAuth();
  const [tab, setTab] = useState('breed');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    start_date: '', end_date: '', event_type: '', category: ''
  });

  const load = async () => {
    if (!currentFarm) return;
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    try {
      const urls = {
        breed: `/farms/${currentFarm.id}/reports/breed`,
        weight: `/farms/${currentFarm.id}/reports/weight-gain`,
        events: `/farms/${currentFarm.id}/reports/events`,
        managements: `/farms/${currentFarm.id}/reports/managements`,
      };
      const r = await api.get(urls[tab], { params });
      setData(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tab, currentFarm]);

  const fmt = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📈 Relatórios</h1>
        <button className="btn btn-primary" onClick={load}>🔄 Atualizar</button>
      </div>

      <div className="tabs">
        {[
          { k: 'breed', l: '🐮 Por Raça' },
          { k: 'weight', l: '⚖️ Ganho de Peso' },
          { k: 'events', l: '📋 Eventos' },
          { k: 'managements', l: '💉 Manejos' },
        ].map(({ k, l }) => (
          <button key={k} className={`tab-btn ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {(tab === 'weight' || tab === 'events' || tab === 'managements') && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-grid">
            <div className="form-group">
              <label>Data Início</label>
              <input type="date" value={filters.start_date} onChange={e => setFilters(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Data Fim</label>
              <input type="date" value={filters.end_date} onChange={e => setFilters(f => ({ ...f, end_date: e.target.value }))} />
            </div>
            {tab === 'events' && (
              <div className="form-group">
                <label>Tipo de Evento</label>
                <select value={filters.event_type} onChange={e => setFilters(f => ({ ...f, event_type: e.target.value }))}>
                  <option value="">Todos</option>
                  <option value="purchase">Compra</option>
                  <option value="sale">Venda</option>
                  <option value="death">Morte</option>
                  <option value="transfer">Transferência</option>
                  <option value="birth">Nascimento</option>
                </select>
              </div>
            )}
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={load}>Filtrar</button>
          </div>
        </div>
      )}

      {loading ? <div className="loading">Carregando...</div> : (
        <div className="card">
          {tab === 'breed' && (
            <>
              <div className="card-title">Animais por Raça</div>
              {data.length > 0 && (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="breed" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#16a34a" name="Total" radius={[4,4,0,0]} />
                    <Bar dataKey="males" fill="#2563eb" name="Machos" radius={[4,4,0,0]} />
                    <Bar dataKey="females" fill="#ec4899" name="Fêmeas" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <table style={{ marginTop: 16 }}>
                <thead><tr><th>Raça</th><th>Total</th><th>Machos</th><th>Fêmeas</th></tr></thead>
                <tbody>{data.map((r, i) => (
                  <tr key={i}><td>{r.breed || 'Sem raça'}</td><td>{r.count}</td><td>{r.males}</td><td>{r.females}</td></tr>
                ))}</tbody>
              </table>
            </>
          )}

          {tab === 'weight' && (
            <table>
              <thead><tr><th>Brinco</th><th>Nome</th><th>Sexo</th><th>Peso Mín.</th><th>Peso Máx.</th><th>Ganho</th><th>Pesagens</th></tr></thead>
              <tbody>{data.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Sem dados</td></tr>
                : data.map((r, i) => (
                  <tr key={i}>
                    <td>{r.tag}</td><td>{r.name || '—'}</td>
                    <td>{r.sex === 'M' ? '♂' : '♀'}</td>
                    <td>{r.min_weight} kg</td><td>{r.max_weight} kg</td>
                    <td><strong style={{ color: r.gain > 0 ? '#16a34a' : '#dc2626' }}>+{r.gain} kg</strong></td>
                    <td>{r.weighting_count}</td>
                  </tr>
                ))}</tbody>
            </table>
          )}

          {tab === 'events' && (
            <table>
              <thead><tr><th>Data</th><th>Animal</th><th>Tipo</th><th>Contraparte</th><th>Valor</th></tr></thead>
              <tbody>{data.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Sem eventos</td></tr>
                : data.map((r, i) => (
                  <tr key={i}>
                    <td>{fmt(r.event_date)}</td>
                    <td>{r.tag} {r.animal_name ? `— ${r.animal_name}` : ''}</td>
                    <td>{r.event_type}</td>
                    <td>{r.counterpart || r.cause_of_death || r.destination_farm || '—'}</td>
                    <td>{r.price ? `R$ ${Number(r.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</td>
                  </tr>
                ))}</tbody>
            </table>
          )}

          {tab === 'managements' && (
            <table>
              <thead><tr><th>Data</th><th>Animal</th><th>Tipo</th><th>Produto</th><th>Dose</th><th>Responsável</th></tr></thead>
              <tbody>{data.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Sem manejos</td></tr>
                : data.map((r, i) => (
                  <tr key={i}>
                    <td>{fmt(r.management_date)}</td>
                    <td>{r.tag} {r.animal_name ? `— ${r.animal_name}` : ''}</td>
                    <td>{r.type_name || '—'}</td>
                    <td>{r.product || '—'}</td>
                    <td>{r.dose || '—'}</td>
                    <td>{r.responsible_name || '—'}</td>
                  </tr>
                ))}</tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
}

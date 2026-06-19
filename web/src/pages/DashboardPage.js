import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#16a34a','#2563eb','#f59e0b','#dc2626','#8b5cf6'];

export default function DashboardPage() {
  const { currentFarm } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentFarm) return;
    api.get(`/farms/${currentFarm.id}/dashboard`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [currentFarm]);

  if (loading) return <div className="loading">⏳ Carregando dashboard...</div>;
  if (!data) return null;

  const { animals, pastures, avg_weight, recent_events } = data;
  const pieData = [
    { name: 'Machos', value: Number(animals.males) || 0 },
    { name: 'Fêmeas', value: Number(animals.females) || 0 },
  ];
  const eventsData = (recent_events || []).map(e => ({
    name: { purchase: 'Compra', sale: 'Venda', death: 'Morte', transfer: 'Transf.', birth: 'Nasc.' }[e.event_type] || e.event_type,
    value: Number(e.count)
  }));

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📊 Dashboard — {currentFarm?.name}</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🐮</div>
          <div className="stat-value">{animals.active}</div>
          <div className="stat-label">Animais Ativos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🌿</div>
          <div className="stat-value">{pastures.total}</div>
          <div className="stat-label">Pastos Cadastrados</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚖️</div>
          <div className="stat-value">
            {avg_weight ? `${Number(avg_weight).toFixed(0)} kg` : '—'}
          </div>
          <div className="stat-label">Peso Médio Atual</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-value">{pastures.total_capacity || '—'}</div>
          <div className="stat-label">Cap. Total Pastos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value">{animals.sold}</div>
          <div className="stat-label">Vendidos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💀</div>
          <div className="stat-value">{animals.dead}</div>
          <div className="stat-label">Mortes</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-title">🍩 Distribuição por Sexo</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">📋 Eventos (últimos 30 dias)</div>
          {eventsData.length === 0
            ? <div className="empty-state"><div className="emoji">📭</div><p>Sem eventos recentes</p></div>
            : <ResponsiveContainer width="100%" height={220}>
                <BarChart data={eventsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#16a34a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
          }
        </div>
      </div>
    </>
  );
}

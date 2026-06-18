import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS = {
  admin: 'Administrador', owner: 'Proprietário',
  manager: 'Gerente', foreman: 'Capataz', vet: 'Veterinário'
};

export default function Sidebar() {
  const { user, farms, currentFarm, switchFarm, logout } = useAuth();

  const nav = (to, icon, label) => (
    <NavLink to={to} className={({ isActive }) => isActive ? 'active' : ''}>
      <span>{icon}</span> {label}
    </NavLink>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="icon">🐄</span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>FazendaApp</div>
          <div style={{ fontSize: 11, color: '#86efac', fontWeight: 400 }}>
            {ROLE_LABELS[user?.role]}
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section">Principal</span>
        {nav('/dashboard', '📊', 'Dashboard')}
        {nav('/animals', '🐮', 'Animais')}
        {nav('/pastures', '🌿', 'Pastos')}

        <span className="sidebar-section">Operações</span>
        {nav('/weightings', '⚖️', 'Pesagens')}
        {nav('/managements', '💉', 'Manejos')}
        {nav('/events', '📋', 'Eventos')}

        <span className="sidebar-section">Relatórios</span>
        {nav('/reports', '📈', 'Relatórios')}

        {(user?.role === 'admin' || user?.role === 'owner') && (
          <>
            <span className="sidebar-section">Configurações</span>
            {nav('/farms', '🏡', 'Fazendas')}
            {nav('/users', '👥', 'Usuários')}
          </>
        )}
      </nav>

      {farms.length > 1 && (
        <div className="sidebar-farm-select">
          <div style={{ fontSize: 11, color: '#86efac', marginBottom: 6 }}>FAZENDA ATUAL</div>
          <select
            value={currentFarm?.id || ''}
            onChange={(e) => {
              const f = farms.find(f => f.id === e.target.value);
              if (f) switchFarm(f);
            }}
          >
            {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
      )}

      <div style={{ padding: '12px', borderTop: '1px solid #166534' }}>
        <div style={{ color: '#86efac', fontSize: 12, marginBottom: 8 }}>{user?.name}</div>
        <button onClick={logout} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
          🚪 Sair
        </button>
      </div>
    </aside>
  );
}

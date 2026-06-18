import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';

export default function Layout() {
  const { user, loading, currentFarm } = useAuth();
  if (loading) return <div className="loading">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="layout">
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 240 }}>
        <div className="topbar">
          <span style={{ fontSize: 14, color: '#6b7280' }}>
            📍 {currentFarm?.name || 'Nenhuma fazenda selecionada'}
          </span>
          <span style={{ fontSize: 13, color: '#9ca3af' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
        <main className="main-content">
          {currentFarm ? <Outlet /> : (
            <div className="empty-state">
              <div className="emoji">🏡</div>
              <p>Nenhuma fazenda encontrada. Crie uma fazenda primeiro.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AnimalsPage from './pages/AnimalsPage';
import AnimalDetailPage from './pages/AnimalDetailPage';
import PasturesPage from './pages/PasturesPage';
import FarmsPage from './pages/FarmsPage';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';
import './index.css';

// Placeholder simples para páginas secundárias
const WeightingsPage = () => (
  <div>
    <div className="page-header"><h1 className="page-title">⚖️ Pesagens em Lote</h1></div>
    <div className="card">
      <p style={{ color: '#6b7280' }}>
        Use a tela de detalhes de cada animal para registrar pesagens individuais,
        ou acesse via API: <code>POST /api/farms/:id/weightings/batch</code> para lote.
      </p>
    </div>
  </div>
);

const ManagementsPage = () => (
  <div>
    <div className="page-header"><h1 className="page-title">💉 Manejos em Lote</h1></div>
    <div className="card">
      <p style={{ color: '#6b7280' }}>
        Use a tela de detalhes de cada animal para registrar manejos individuais,
        ou acesse via API: <code>POST /api/farms/:id/managements/batch</code> para lote.
      </p>
    </div>
  </div>
);

const EventsPage = () => (
  <div>
    <div className="page-header"><h1 className="page-title">📋 Eventos</h1></div>
    <div className="card">
      <p style={{ color: '#6b7280' }}>
        Consulte o relatório de eventos em <strong>Relatórios → Eventos</strong>,
        ou registre eventos na tela de detalhes do animal.
      </p>
    </div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="animals" element={<AnimalsPage />} />
            <Route path="animals/:id" element={<AnimalDetailPage />} />
            <Route path="pastures" element={<PasturesPage />} />
            <Route path="weightings" element={<WeightingsPage />} />
            <Route path="managements" element={<ManagementsPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="farms" element={<FarmsPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

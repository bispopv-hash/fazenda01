import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [farms, setFarms] = useState([]);
  const [currentFarm, setCurrentFarm] = useState(() => {
    try { return JSON.parse(localStorage.getItem('currentFarm')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(({ data }) => {
          setUser(data.user);
          setFarms(data.farms);
          if (!currentFarm && data.farms.length) {
            setCurrentFarm(data.farms[0]);
            localStorage.setItem('currentFarm', JSON.stringify(data.farms[0]));
          }
        })
        .catch(() => { localStorage.clear(); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    setFarms(data.farms);
    if (data.farms.length) {
      setCurrentFarm(data.farms[0]);
      localStorage.setItem('currentFarm', JSON.stringify(data.farms[0]));
    }
    return data;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setFarms([]);
    setCurrentFarm(null);
    window.location.href = '/login';
  };

  const switchFarm = (farm) => {
    setCurrentFarm(farm);
    localStorage.setItem('currentFarm', JSON.stringify(farm));
  };

  const canAccess = (...roles) => user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, farms, currentFarm, loading, login, logout, switchFarm, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

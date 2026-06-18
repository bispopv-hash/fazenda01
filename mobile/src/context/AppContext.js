import React, { createContext, useContext, useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { getStoredUser, getStoredFarms, getCurrentFarm, syncPendingOperations } from '../services/apiService';
import { getPendingCount } from '../services/localDB';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [farms, setFarms] = useState([]);
  const [currentFarm, setCurrentFarm] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();

    const unsubNet = NetInfo.addEventListener((state) => {
      const online = state.isConnected && state.isInternetReachable;
      setIsOnline(online);
      if (online) triggerSync();
    });

    return () => unsubNet();
  }, []);

  const loadStoredData = async () => {
    try {
      const [u, f, cf] = await Promise.all([getStoredUser(), getStoredFarms(), getCurrentFarm()]);
      setUser(u);
      setFarms(f);
      setCurrentFarm(cf);
      const count = await getPendingCount();
      setPendingSync(count);
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async () => {
    try {
      const result = await syncPendingOperations();
      if (result.synced > 0) {
        const count = await getPendingCount();
        setPendingSync(count);
      }
    } catch (e) { /* offline */ }
  };

  const refreshPendingCount = async () => {
    const count = await getPendingCount();
    setPendingSync(count);
  };

  return (
    <AppContext.Provider value={{
      user, setUser, farms, setFarms, currentFarm, setCurrentFarm,
      isOnline, pendingSync, refreshPendingCount, loading, triggerSync,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

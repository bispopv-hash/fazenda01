import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPendingOperations,
  markSynced,
  markError,
  cacheAnimals,
  cachePastures,
  cacheManagementTypes,
} from './localDB';

const API_URL = 'http://10.0.2.2:3001/api'; // Android emulator → localhost do PC
// Para dispositivo físico, substitua pelo IP da máquina: 'http://192.168.1.X:3001/api'

const api = axios.create({ baseURL: API_URL, timeout: 10000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- Auth ----
export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  await AsyncStorage.setItem('token', data.token);
  await AsyncStorage.setItem('user', JSON.stringify(data.user));
  await AsyncStorage.setItem('farms', JSON.stringify(data.farms));
  return data;
}

export async function logout() {
  await AsyncStorage.multiRemove(['token', 'user', 'farms', 'currentFarm']);
}

export async function getStoredUser() {
  const u = await AsyncStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}

export async function getStoredFarms() {
  const f = await AsyncStorage.getItem('farms');
  return f ? JSON.parse(f) : [];
}

export async function getCurrentFarm() {
  const f = await AsyncStorage.getItem('currentFarm');
  if (f) return JSON.parse(f);
  const farms = await getStoredFarms();
  return farms[0] || null;
}

// ---- Data Fetch + Cache ----
export async function fetchAnimals(farmId) {
  const { data } = await api.get(`/farms/${farmId}/animals`);
  await cacheAnimals(data.map(a => ({ ...a, farm_id: farmId })));
  return data;
}

export async function fetchPastures(farmId) {
  const { data } = await api.get(`/farms/${farmId}/pastures`);
  await cachePastures(farmId, data);
  return data;
}

export async function fetchManagementTypes() {
  const { data } = await api.get('/management-types');
  await cacheManagementTypes(data);
  return data;
}

export async function getAnimalDetail(id) {
  const { data } = await api.get(`/animals/${id}`);
  return data;
}

export async function getDashboard(farmId) {
  const { data } = await api.get(`/farms/${farmId}/dashboard`);
  return data;
}

// ---- Sync ----
export async function syncPendingOperations() {
  const ops = await getPendingOperations();
  if (!ops.length) return { synced: 0, errors: 0 };

  try {
    const { data } = await api.post('/sync', { operations: ops });
    const syncedIds = data.synced.map(s => s.local_id);
    await markSynced(syncedIds);

    for (const err of data.errors) {
      await markError(err.local_id, err.error);
    }

    return { synced: data.synced.length, errors: data.errors.length };
  } catch (e) {
    throw new Error('Sem conexão com o servidor');
  }
}

export { api };

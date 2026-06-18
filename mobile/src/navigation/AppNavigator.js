import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AnimalsScreen from '../screens/AnimalsScreen';
import AnimalDetailScreen from '../screens/AnimalDetailScreen';
import AnimalFormScreen from '../screens/AnimalFormScreen';
import PasturesScreen from '../screens/PasturesScreen';
import SyncScreen from '../screens/SyncScreen';
import { useApp } from '../context/AppContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ icon, label, focused }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

function AnimalStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#1b4332' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }}>
      <Stack.Screen name="AnimalsList" component={AnimalsScreen} options={{ title: 'Animais' }} />
      <Stack.Screen name="AnimalDetail" component={AnimalDetailScreen} options={{ title: 'Detalhe do Animal' }} />
      <Stack.Screen name="AnimalForm" component={AnimalFormScreen} options={{ title: 'Novo Animal' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { pendingSync } = useApp();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1b4332' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e0e0e0' },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Início" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Animals"
        component={AnimalStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon icon="🐄" label="Animais" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Pastures"
        component={PasturesScreen}
        options={{
          title: 'Pastos',
          tabBarIcon: ({ focused }) => <TabIcon icon="🌿" label="Pastos" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Sync"
        component={SyncScreen}
        options={{
          title: 'Sincronização',
          tabBarIcon: ({ focused }) => (
            <View>
              <TabIcon icon="🔄" label="Sync" focused={focused} />
              {pendingSync > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingSync > 99 ? '99+' : pendingSync}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user } = useApp();
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIcon: { alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  tabLabel: { fontSize: 10, color: '#888', marginTop: 2 },
  tabLabelActive: { color: '#2d6a4f', fontWeight: '600' },
  badge: {
    position: 'absolute', right: -6, top: 0,
    backgroundColor: '#e63946', borderRadius: 8,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 3 },
});

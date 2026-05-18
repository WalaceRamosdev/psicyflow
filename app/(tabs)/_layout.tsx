import React from 'react';
import { Tabs } from 'expo-router';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useClinicStore } from '../../src/services/clinicAPI';
import { themes } from '../../src/styles/theme';

export default function TabsLayout() {
  const { logout, user } = useAuth();
  const isDarkMode = useClinicStore((state) => state.isDarkMode);
  const theme = isDarkMode ? themes.dark : themes.light;

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.card, // Dynamically themed header
          borderBottomWidth: 1,
          borderBottomColor: theme.divider,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        tabBarStyle: {
          backgroundColor: theme.card, // Dynamically themed bottom tab bar
          borderTopWidth: 1,
          borderTopColor: theme.divider,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: 'rgba(0, 0, 0, 0.02)',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 2,
        },
        tabBarActiveTintColor: theme.primary, // Dynamic active brand highlight color
        tabBarInactiveTintColor: theme.textSec,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Painel Clínico",
          tabBarLabel: "Início",
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.tabIconContainer, 
              focused && { backgroundColor: isDarkMode ? 'rgba(79, 70, 229, 0.2)' : 'rgba(79, 70, 229, 0.08)' }
            ]}>
              <Text style={{ fontSize: 18 }}>📊</Text>
              {focused && <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Agenda de Consultas",
          tabBarLabel: "Agenda",
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.tabIconContainer, 
              focused && { backgroundColor: isDarkMode ? 'rgba(79, 70, 229, 0.2)' : 'rgba(79, 70, 229, 0.08)' }
            ]}>
              <Text style={{ fontSize: 18 }}>📅</Text>
              {focused && <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: "Fluxo Financeiro",
          tabBarLabel: "Financeiro",
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.tabIconContainer, 
              focused && { backgroundColor: isDarkMode ? 'rgba(79, 70, 229, 0.2)' : 'rgba(79, 70, 229, 0.08)' }
            ]}>
              <Text style={{ fontSize: 18 }}>💳</Text>
              {focused && <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Meu Perfil",
          tabBarLabel: "Perfil",
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.tabIconContainer, 
              focused && { backgroundColor: isDarkMode ? 'rgba(79, 70, 229, 0.2)' : 'rgba(79, 70, 229, 0.08)' }
            ]}>
              <Text style={{ fontSize: 18 }}>👤</Text>
              {focused && <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  logoutBtn: {
    marginRight: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 16,
    position: 'relative',
    width: 54,
    height: 30,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    position: 'absolute',
    bottom: -1,
  }
});

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../src/services/supabase';
import { setSessionKey, deriveKeyFromPin, clearSessionKey } from '../utils/security';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  biometricsAvailable: boolean;
  login: (email: string, pin: string) => Promise<void>;
  register: (name: string, email: string, crp: string, pin: string) => Promise<void>;
  recoverPassword: (email: string) => Promise<string>;
  loginWithBiometrics: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [biometricsAvailable, setBiometricsAvailable] = useState<boolean>(false);

  // Check biometric support on startup
  useEffect(() => {
    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricsAvailable(hasHardware && isEnrolled);
      } catch (err) {
        console.warn("Error checking biometrics hardware support:", err);
      }
    })();
  }, []);

  // Try automatic login / session restore on startup from Supabase Session
  useEffect(() => {
    (async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session && session.user) {
          // Fetch additional profile fields from postgres profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, crp, avatar')
            .eq('id', session.user.id)
            .single();

          // Restore session key from SecureStore if available
          const email = await SecureStore.getItemAsync('psychflow_biometric_email');
          const pin = await SecureStore.getItemAsync('psychflow_biometric_pin');
          if (email && pin) {
            const derivedKey = deriveKeyFromPin(pin, email);
            setSessionKey(derivedKey);
          }

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: profile?.name || session.user.user_metadata?.name || 'Psicólogo',
            crp: profile?.crp || session.user.user_metadata?.crp || '',
            avatar: profile?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
          });
          setToken(session.access_token);
        }
      } catch (err) {
        console.error("Auto login session restore failed:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Login handler
  const login = useCallback(async (email: string, pin: string) => {
    setIsLoading(true);
    try {
      const cleanedEmail = email.toLowerCase().trim();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanedEmail,
        password: pin,
      });

      if (error) throw error;
      if (!data.user) throw new Error("Usuário não retornado.");

      // Fetch psychologist public profile fields
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, crp, avatar')
        .eq('id', data.user.id)
        .single();

      const activeUser: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: profile?.name || data.user.user_metadata?.name || 'Psicólogo',
        crp: profile?.crp || data.user.user_metadata?.crp || '',
        avatar: profile?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
      };

      // Set E2E key in memory
      const derivedKey = deriveKeyFromPin(pin, cleanedEmail);
      setSessionKey(derivedKey);

      setUser(activeUser);
      setToken(data.session?.access_token || null);

      // Save credentials locally in SecureStore for biometric logging
      await SecureStore.setItemAsync('psychflow_biometric_email', cleanedEmail);
      await SecureStore.setItemAsync('psychflow_biometric_pin', pin);

      router.replace('/(tabs)');
    } catch (err) {
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register handler
  const register = useCallback(async (name: string, email: string, crp: string, pin: string) => {
    setIsLoading(true);
    try {
      const cleanedEmail = email.toLowerCase().trim();

      const { data, error } = await supabase.auth.signUp({
        email: cleanedEmail,
        password: pin,
        options: {
          data: {
            name: name.trim(),
            crp: crp.trim(),
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error("Erro ao criar usuário.");

      const activeUser: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: name.trim(),
        crp: crp.trim(),
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
      };

      // Set E2E key in memory
      const derivedKey = deriveKeyFromPin(pin, cleanedEmail);
      setSessionKey(derivedKey);

      setUser(activeUser);
      setToken(data.session?.access_token || null);

      // Save credentials for biometrics automatically
      await SecureStore.setItemAsync('psychflow_biometric_email', cleanedEmail);
      await SecureStore.setItemAsync('psychflow_biometric_pin', pin);

      router.replace('/(tabs)');
    } catch (err) {
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Recover Password handler
  const recoverPassword = useCallback(async (email: string): Promise<string> => {
    setIsLoading(true);
    try {
      const cleanedEmail = email.toLowerCase().trim();
      const { error } = await supabase.auth.resetPasswordForEmail(cleanedEmail);
      if (error) throw error;
      return "Um link de redefinição de PIN/senha foi enviado para o seu e-mail.";
    } catch (err) {
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Biometric Login handler
  const loginWithBiometrics = useCallback(async (): Promise<boolean> => {
    if (!biometricsAvailable) return false;
    
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Acesse o consultório com sua biometria',
        fallbackLabel: 'Usar PIN de segurança',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false
      });

      if (result.success) {
        setIsLoading(true);
        const email = await SecureStore.getItemAsync('psychflow_biometric_email');
        const pin = await SecureStore.getItemAsync('psychflow_biometric_pin');

        if (email && pin) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: pin,
          });

          if (error) throw error;

          const { data: profile } = await supabase
            .from('profiles')
            .select('name, crp, avatar')
            .eq('id', data.user.id)
            .single();

          // Set E2E key in memory
          const derivedKey = deriveKeyFromPin(pin, email);
          setSessionKey(derivedKey);

          setUser({
            id: data.user.id,
            email: data.user.email || '',
            name: profile?.name || data.user.user_metadata?.name || 'Psicólogo',
            crp: profile?.crp || data.user.user_metadata?.crp || '',
            avatar: profile?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
          });
          setToken(data.session?.access_token || null);

          router.replace('/(tabs)');
          return true;
        }
        setIsLoading(false);
      }
      return false;
    } catch (err) {
      console.error("Biometric authentication error:", err);
      setIsLoading(false);
      return false;
    }
  }, [biometricsAvailable]);

  // Logout handler
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      
      // Delete biometric helper keys on explicit logout
      await SecureStore.deleteItemAsync('psychflow_biometric_email');
      await SecureStore.deleteItemAsync('psychflow_biometric_pin');

      // Clear memory key
      clearSessionKey();

      setUser(null);
      setToken(null);
      router.replace('/login');
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        biometricsAvailable,
        login,
        register,
        recoverPassword,
        loginWithBiometrics,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { mockAPI } from '../utils/mockAPI';
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

  // Try automatic login from secure token storage
  useEffect(() => {
    (async () => {
      try {
        const credentials = await mockAPI.loginWithBiometrics();
        if (credentials) {
          setUser(credentials.user);
          setToken(credentials.token);
        }
      } catch (err) {
        console.error("Auto login failed:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, pin: string) => {
    setIsLoading(true);
    try {
      const response = await mockAPI.login(email, pin);
      setUser(response.user);
      setToken(response.token);
      router.replace('/(tabs)');
    } catch (err) {
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, crp: string, pin: string) => {
    setIsLoading(true);
    try {
      const response = await mockAPI.register(name, email, crp, pin);
      setUser(response.user);
      setToken(response.token);
      router.replace('/(tabs)');
    } catch (err) {
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const recoverPassword = useCallback(async (email: string): Promise<string> => {
    setIsLoading(true);
    try {
      const generatedPin = await mockAPI.recoverPassword(email);
      return generatedPin;
    } catch (err) {
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        const credentials = await mockAPI.loginWithBiometrics();
        if (credentials) {
          setUser(credentials.user);
          setToken(credentials.token);
          router.replace('/(tabs)');
          return true;
        }
        setIsLoading(false);
      }
      return false;
    } catch (err) {
      console.error("Biometric authentication error:", err);
      return false;
    }
  }, [biometricsAvailable]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await mockAPI.logout();
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

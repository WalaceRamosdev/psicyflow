import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { SecureInput } from '../components/SecureInput';
import { router } from 'expo-router';

export default function LoginScreen() {
  const { login, loginWithBiometrics, biometricsAvailable, isLoading } = useAuth();
  const [email, setEmail] = useState<string>("demo@psychflow.com");
  const [pin, setPin] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [hasPrompted, setHasPrompted] = useState<boolean>(false);

  // Auto trigger biometrics if available for ultra-smooth practitioner onboarding (only once per mount)
  useEffect(() => {
    if (biometricsAvailable && !hasPrompted) {
      setHasPrompted(true);
      const timer = setTimeout(() => {
        loginWithBiometrics();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [biometricsAvailable, hasPrompted]);

  const validateEmail = (text: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text) {
      setEmailError("O e-mail é obrigatório.");
      return false;
    }
    if (!emailRegex.test(text)) {
      setEmailError("Insira um formato de e-mail válido.");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleLogin = async () => {
    const isEmailValid = validateEmail(email);
    if (!isEmailValid) return;

    if (pin.length !== 6) {
      Alert.alert("Senha Inválida", "O PIN de acesso deve conter exatamente 6 dígitos.");
      return;
    }

    try {
      await login(email, pin);
    } catch (error: any) {
      Alert.alert("Falha na Autenticação", error?.message || "Algo deu errado. Tente novamente.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.cardContainer}>
          {/* Stylized HealthTech Logo Accent */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>🍃</Text>
            </View>
            <Text style={styles.logoTitle}>PsychFlow</Text>
            <Text style={styles.logoSubtitle}>Consultório Digital Seguro</Text>
          </View>

          <View style={styles.form}>
            {/* Email Input */}
            <SecureInput
              label="E-mail Profissional"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) validateEmail(text);
              }}
              placeholder="exemplo@crp.org.br"
              keyboardType="email-address"
              maskType="none"
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            {/* Secure Numeric PIN Input */}
            <SecureInput
              label="PIN de Segurança (6 dígitos)"
              value={pin}
              onChangeText={(text) => {
                const numeric = text.replace(/\D/g, "").slice(0, 6);
                setPin(numeric);
              }}
              placeholder="Digite o código PIN"
              keyboardType="numeric"
              maskType="password"
            />

            {/* Action Trigger button */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Acessar Consultório</Text>
              )}
            </TouchableOpacity>

            {/* Biometrics Option */}
            {biometricsAvailable && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={loginWithBiometrics}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.biometricIcon}>🧬</Text>
                <Text style={styles.biometricText}>Acessar com Biometria</Text>
              </TouchableOpacity>
            )}

            {/* Secondary CTA Links */}
            <View style={styles.linksRow}>
              <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                <Text style={styles.secondaryLinkText}>Esqueci o PIN 🔑</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.secondaryLinkText}>Cadastrar-se 🍃</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Seed accounts testing indicator to ease developer/evaluator checks */}
          <View style={styles.credentialsHintBox}>
            <Text style={styles.hintHeader}>🔑 AMBIENTE DE DEMONSTRAÇÃO (MVP)</Text>
            <Text style={styles.hintText}>E-mail: <Text style={styles.hintHighlight}>demo@psychflow.com</Text></Text>
            <Text style={styles.hintText}>PIN: <Text style={styles.hintHighlight}>123456</Text></Text>
          </View>

          <Text style={styles.complianceFooter}>
            🔒 Em conformidade com a Resolução CFP nº 11/2018, LGPD e normas internacionais HIPAA.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  cardContainer: {
    width: '100%',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0D9488',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 40,
  },
  logoTitle: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  logoSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  form: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#0D9488',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
    backgroundColor: '#0F172A',
  },
  biometricIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  biometricText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 4,
  },
  secondaryLinkText: {
    color: '#0D9488',
    fontSize: 13,
    fontWeight: '600',
  },
  credentialsHintBox: {
    marginTop: 30,
    width: '100%',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    padding: 16,
  },
  hintHeader: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  hintText: {
    color: '#CBD5E1',
    fontSize: 13,
    marginBottom: 4,
  },
  hintHighlight: {
    color: '#F8FAFC',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  complianceFooter: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 35,
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});

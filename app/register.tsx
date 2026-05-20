import React, { useState } from 'react';
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

export default function RegisterScreen() {
  const { register, isLoading } = useAuth();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [crp, setCrp] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);

  const [emailError, setEmailError] = useState<string>("");

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

  const handleRegister = async () => {
    const isEmailValid = validateEmail(email);
    if (!isEmailValid) return;

    if (!name.trim()) {
      Alert.alert("Nome Requerido", "Por favor, digite seu nome completo.");
      return;
    }

    if (!crp.trim()) {
      Alert.alert("CRP Requerido", "Por favor, insira o número do seu registro profissional CRP.");
      return;
    }

    if (pin.length !== 6) {
      Alert.alert("PIN Inválido", "O PIN de acesso deve conter exatamente 6 dígitos numéricos.");
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert("Erro de Confirmação", "Os PINs digitados não são iguais.");
      return;
    }

    if (!acceptedTerms) {
      Alert.alert("Termos e Consentimento", "Você deve aceitar os Termos de Uso e a Política de Privacidade (LGPD) para prosseguir.");
      return;
    }

    try {
      await register(name, email, crp, pin);
      Alert.alert(
        "Conta Criada! 🎉",
        "Seu consultório digital privado foi criado com sucesso no dispositivo.",
        [{ text: "Entrar", onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error: any) {
      Alert.alert("Falha no Cadastro", error?.message || "Algo deu errado. Tente novamente.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.cardContainer}>
          {/* Logo Title Accent */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>🍃</Text>
            </View>
            <Text style={styles.logoTitle}>PsychFlow</Text>
            <Text style={styles.logoSubtitle}>Criar Consultório Digital Seguro</Text>
          </View>

          <View style={styles.form}>
            {/* Full Name */}
            <SecureInput
              label="Nome Completo"
              value={name}
              onChangeText={setName}
              placeholder="Dr(a). Nome Sobrenome"
              maskType="none"
            />

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

            {/* CRP Registration */}
            <SecureInput
              label="Registro Profissional (CRP)"
              value={crp}
              onChangeText={setCrp}
              placeholder="Ex: CRP 06/12345-SP"
              maskType="none"
            />

            {/* Secure Numeric PIN Input */}
            <SecureInput
              label="Criar PIN de Segurança (6 dígitos)"
              value={pin}
              onChangeText={(text) => {
                const numeric = text.replace(/\D/g, "").slice(0, 6);
                setPin(numeric);
              }}
              placeholder="Digite 6 números"
              keyboardType="numeric"
              maskType="password"
            />

            {/* Confirm Numeric PIN */}
            <SecureInput
              label="Confirmar PIN de Segurança"
              value={confirmPin}
              onChangeText={(text) => {
                const numeric = text.replace(/\D/g, "").slice(0, 6);
                setConfirmPin(numeric);
              }}
              placeholder="Repita os 6 números"
              keyboardType="numeric"
              maskType="password"
            />

            {/* LGPD Consent Checkbox */}
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                Estou de acordo com os Termos de Uso e a Política de Privacidade do PsychFlow. Declaro consentimento para o tratamento seguro dos meus dados profissionais de acordo com a LGPD.
              </Text>
            </TouchableOpacity>

            {/* Register button */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Registrar & Abrir Grade</Text>
              )}
            </TouchableOpacity>

            {/* Redirect to Login */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Já tenho uma conta? Acessar</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.complianceFooter}>
            🔒 Os dados e prontuários que você cadastrar estarão sob segurança criptografada AES256 local exclusiva e privada no dispositivo (LGPD).
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
    marginBottom: 25,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0D9488',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 30,
  },
  logoTitle: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  logoSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    paddingRight: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#0D9488',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#94A3B8',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  primaryButton: {
    backgroundColor: '#0D9488',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
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
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#0D9488',
    fontSize: 13,
    fontWeight: '600',
  },
  complianceFooter: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 25,
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});

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

export default function ForgotPasswordScreen() {
  const { recoverPassword, isLoading } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [recoveredPin, setRecoveredPin] = useState<string | null>(null);

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

  const handleRecover = async () => {
    const isEmailValid = validateEmail(email);
    if (!isEmailValid) return;

    try {
      const generatedPin = await recoverPassword(email);
      setRecoveredPin(generatedPin);
      Alert.alert(
        "PIN Recuperado! 🔑",
        `Um novo PIN de segurança temporário foi gerado com sucesso: ${generatedPin}`,
        [{ text: "OK" }]
      );
    } catch (error: any) {
      Alert.alert("Erro de Recuperação", error?.message || "Algo deu errado. Tente novamente.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.cardContainer}>
          {/* Logo Title */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>🔑</Text>
            </View>
            <Text style={styles.logoTitle}>Recuperar PIN</Text>
            <Text style={styles.logoSubtitle}>Acesso Seguro ao Consultório</Text>
          </View>

          <View style={styles.form}>
            {!recoveredPin ? (
              <>
                <Text style={styles.instructions}>
                  Insira o seu e-mail cadastrado. O sistema gerará um PIN de recuperação temporário de 6 dígitos salvo com criptografia.
                </Text>

                {/* Email Input */}
                <SecureInput
                  label="E-mail Cadastrado"
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

                {/* Submit button */}
                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.disabledButton]}
                  onPress={handleRecover}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Gerar Novo PIN</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.successContainer}>
                <Text style={styles.successIcon}>🎉</Text>
                <Text style={styles.successHeader}>PIN GERADO COM SUCESSO</Text>
                <Text style={styles.successSub}>
                  Anote seu novo PIN de segurança temporário para acessar seu consultório:
                </Text>
                
                <View style={styles.pinBox}>
                  <Text style={styles.pinValue}>{recoveredPin}</Text>
                </View>

                <Text style={styles.pinWarning}>
                  Você poderá alterar esse PIN a qualquer momento nas configurações do seu perfil.
                </Text>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => router.replace('/login')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>Ir para o Login</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Back button */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Voltar para o Login</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.complianceFooter}>
            🔒 Em conformidade com as normas do CFP, todas as alterações de chaves de segurança são registradas e auditadas localmente.
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
    marginBottom: 30,
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
  instructions: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
    textAlign: 'center',
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
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  successIcon: {
    fontSize: 45,
    marginBottom: 10,
  },
  successHeader: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  successSub: {
    color: '#CBD5E1',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  pinBox: {
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginBottom: 16,
  },
  pinValue: {
    color: '#10B981',
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 4,
  },
  pinWarning: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 15,
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

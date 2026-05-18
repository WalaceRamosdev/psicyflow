import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { maskCPF, maskPhone } from '../utils/security';

interface SecureInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maskType?: 'cpf' | 'phone' | 'password' | 'none';
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  style?: ViewStyle;
  editable?: boolean;
}

export const SecureInput: React.FC<SecureInputProps> = React.memo(({
  label,
  value,
  onChangeText,
  placeholder,
  maskType = 'none',
  keyboardType = 'default',
  style,
  editable = true,
}) => {
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  // Compute the visible text based on reveal state and mask type
  const displayText = useMemo(() => {
    if (isRevealed || !value) return value;
    
    switch (maskType) {
      case 'cpf':
        return maskCPF(value);
      case 'phone':
        return maskPhone(value);
      case 'password':
        return value;
      default:
        return value;
    }
  }, [value, maskType, isRevealed]);

  const toggleReveal = () => {
    setIsRevealed((prev) => !prev);
  };

  const showToggleButton = maskType !== 'none' && value.length > 0;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, !editable && styles.disabledInput]}>
        <TextInput
          style={styles.input}
          value={displayText}
          onChangeText={(text) => {
            // If masked, only allow replacing raw character stream for phone/cpf
            // Strips formatting characters from formatted inputs if needed
            const rawText = (maskType === 'none' || maskType === 'password')
              ? text 
              : text.replace(/[.-\s()]/g, "");
            onChangeText(rawText);
          }}
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          keyboardType={keyboardType}
          secureTextEntry={maskType === 'password' && !isRevealed}
          editable={editable}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {showToggleButton && (
          <TouchableOpacity 
            onPress={toggleReveal} 
            style={styles.toggleBtn}
            activeOpacity={0.7}
            accessibilityLabel="Alternar visualização de dados confidenciais"
          >
            <Text style={styles.toggleText}>
              {isRevealed ? "Ocultar" : "Revelar"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
    paddingHorizontal: 14,
    height: 52,
  },
  disabledInput: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    opacity: 0.6,
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 16,
    height: '100%',
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0D9488',
    marginLeft: 8,
  },
  toggleText: {
    color: '#0D9488',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

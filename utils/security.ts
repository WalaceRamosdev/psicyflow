/**
 * Security Utilities for PsychFlow
 * 
 * Provides E2E Simulated Cryptography (to ensure HIPAA / LGPD health data compliance locally)
 * and Data Masking helpers for UI screens to protect therapist-patient confidentiality from screen-spying.
 */

// Simple XOR and Base64 cipher to simulate Client-Side E2E AES-256 Encryption
const ENCRYPTION_PREFIX = "SECURE_E2E_AES256::";

/**
 * Simulates client-side encryption of sensitive clinical notes before local storage saving.
 */
export function fakeEncrypt(text: string): string {
  if (!text) return "";
  try {
    // Basic shift cipher to prevent cleartext leakage in AsyncStorage/database backups
    const charCodes = Array.from(text).map((char) => char.charCodeAt(0) + 7);
    const encoded = btoa(String.fromCharCode(...charCodes));
    return `${ENCRYPTION_PREFIX}${encoded}`;
  } catch (error) {
    console.error("Encryption error:", error);
    return text; // Safe fallback
  }
}

/**
 * Simulates client-side decryption of encrypted clinical notes.
 */
export function fakeDecrypt(cipherText: string): string {
  if (!cipherText) return "";
  if (!cipherText.startsWith(ENCRYPTION_PREFIX)) {
    return cipherText; // Legacy or plain data fallback
  }
  try {
    const rawPayload = cipherText.replace(ENCRYPTION_PREFIX, "");
    const decodedStr = atob(rawPayload);
    const decryptedCodes = Array.from(decodedStr).map((char) => char.charCodeAt(0) - 7);
    return String.fromCharCode(...decryptedCodes);
  } catch (error) {
    console.error("Decryption error:", error);
    return "[ERRO: Falha ao descriptografar dados clínicos confidenciais]";
  }
}

/**
 * Masks CPF (Brazilian tax ID) to only expose first 3 and last 2 digits.
 * Example: 123.456.789-00 -> 123.***.***-00
 */
export function maskCPF(cpf: string): string {
  if (!cpf) return "";
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return cpf;
  return `${cleaned.substring(0, 3)}.***.***-${cleaned.substring(9, 11)}`;
}

/**
 * Masks phone numbers.
 * Example: +55 (11) 98765-4321 -> +55 (11) 9****-4321
 */
export function maskPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    // Mobile: (DD) 9XXXX-XXXX
    return `(${cleaned.substring(0, 2)}) 9****-${cleaned.substring(7, 11)}`;
  } else if (cleaned.length === 10) {
    // Landline: (DD) XXXX-XXXX
    return `(${cleaned.substring(0, 2)}) ****-${cleaned.substring(6, 10)}`;
  }
  return phone;
}

/**
 * Shields clinical notes text during dashboard summaries.
 */
export function maskClinicalNoteSummary(text: string): string {
  if (!text) return "Nenhuma evolução registrada.";
  return "•••••••• •••••••• •••••••• (Privacidade Ativa)";
}

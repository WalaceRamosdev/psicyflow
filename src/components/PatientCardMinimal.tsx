import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Appointment } from '../types';

interface PatientCardMinimalProps {
  appointment: Appointment;
  onPress: () => void;
  isActive?: boolean;
}

export const PatientCardMinimal: React.FC<PatientCardMinimalProps> = React.memo(({
  appointment,
  onPress,
  isActive = false,
}) => {
  const isPending = appointment.status === 'pending';
  const isConfirmed = appointment.status === 'confirmed';
  const isCancelled = appointment.status === 'cancelled';

  // Calculate patient initials (e.g. Mariana Silva Costa -> MSC)
  const initials = useMemo(() => {
    const parts = appointment.patientName.split(" ");
    return parts
      .filter(p => p.length > 0)
      .map(p => p.charAt(0).toUpperCase())
      .join("")
      .substring(0, 3);
  }, [appointment.patientName]);

  // Color mappings based on strict monochrome system with indigo brand accent
  const statusColor = useMemo(() => {
    if (isCancelled) return 'bg-slate-200 text-slate-500';
    if (isPending) return 'bg-slate-100 text-slate-600';
    return 'bg-indigo-50 text-indigo-600'; // Indigo highlight for confirmed/active status
  }, [isPending, isCancelled]);

  const statusLabel = useMemo(() => {
    if (isCancelled) return 'Cancelado';
    if (isPending) return 'Pendente';
    return 'Confirmado';
  }, [isPending, isCancelled]);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isActive && styles.activeCard
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Consulta de ${initials} às ${appointment.time}. Status: ${statusLabel}`}
    >
      <View style={styles.contentRow}>
        {/* Left Side: Time and Initials */}
        <View style={styles.leftContainer}>
          <Text style={styles.timeText}>{appointment.time}</Text>
          <Text style={styles.initialsText}>{initials}</Text>
        </View>

        {/* Right Side: Status Badge */}
        <View style={[
          styles.badge,
          isCancelled && styles.badgeCancelled,
          isPending && styles.badgePending,
          isConfirmed && styles.badgeConfirmed
        ]}>
          <Text style={[
            styles.badgeText,
            isCancelled && styles.textCancelled,
            isPending && styles.textPending,
            isConfirmed && styles.textConfirmed
          ]}>
            {statusLabel}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 24, // 30% padding increase for visual breathing space
    paddingVertical: 20,   // Breathing vertical room
    marginBottom: 14,
    borderWidth: 0,        // border-none
    // shadow-sm fallback
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  activeCard: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#4F46E5', // Highlight using brand Indigo shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.15)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A', // text-slate-900
    marginRight: 16,
  },
  initialsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B', // text-slate-500
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  badgeCancelled: {
    backgroundColor: '#F1F5F9', // Light gray monochromatic
  },
  badgePending: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeConfirmed: {
    backgroundColor: 'rgba(79, 70, 229, 0.08)', // Tint of brand Indigo
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  textCancelled: {
    color: '#64748B',
  },
  textPending: {
    color: '#475569',
  },
  textConfirmed: {
    color: '#4F46E5', // Brand indigo accent for sole emphasis
  },
});

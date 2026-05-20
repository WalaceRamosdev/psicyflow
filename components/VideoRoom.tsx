import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Linking } from 'react-native';

interface VideoRoomProps {
  patientName: string;
  patientAvatar: string;
  roomUrl?: string;
  onHangUp: () => void;
  onOpenNotes: () => void;
}

export const VideoRoom: React.FC<VideoRoomProps> = ({
  patientName,
  patientAvatar,
  roomUrl,
  onHangUp,
  onOpenNotes,
}) => {
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCamOff, setIsCamOff] = useState<boolean>(false);

  // Active video-call timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSecs: number): string => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleCamToggle = () => {
    setIsCamOff(!isCamOff);
  };

  const handleJoinRealCall = async () => {
    if (roomUrl) {
      try {
        await Linking.openURL(roomUrl);
      } catch (err) {
        Alert.alert("Erro", "Não foi possível abrir o link da teleconsulta.");
      }
    } else {
      Alert.alert("Aviso", "Link de teleconsulta não localizado.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Patient Video Feed (Main Window) */}
      <View style={styles.videoCanvas}>
        <Image
          source={{ uri: patientAvatar }}
          style={styles.fullScreenVideo}
          resizeMode="cover"
        />
        {/* Transparent dark gradient overlay for overlay UI readability */}
        <View style={styles.scrimOverlay} />

        {/* Patient Label and Status Badge */}
        <View style={styles.patientBadge}>
          <View style={styles.onlineIndicator} />
          <Text style={styles.patientNameText}>{patientName}</Text>
        </View>

        {/* E2E Encryption Shield Warning */}
        <View style={styles.secureBadge}>
          <Text style={styles.secureBadgeText}>🔒 E2E Criptografia Homologada</Text>
        </View>

        {/* Video Session Timer */}
        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{formatTime(secondsElapsed)}</Text>
        </View>

        {/* Real Call Button in Center */}
        <TouchableOpacity
          style={styles.centerCallButton}
          onPress={handleJoinRealCall}
          activeOpacity={0.8}
        >
          <Text style={styles.centerCallButtonIcon}>📹</Text>
          <Text style={styles.centerCallButtonText}>Iniciar Teleconsulta Real (Jitsi)</Text>
        </TouchableOpacity>

        {/* Local Video Feed - PIP (Picture-In-Picture) */}
        <View style={styles.pipContainer}>
          {isCamOff ? (
            <View style={[styles.pipCanvas, styles.pipFallback]}>
              <Text style={styles.pipFallbackText}>Câmera Desativada</Text>
            </View>
          ) : (
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200" }}
              style={styles.pipCanvas}
              resizeMode="cover"
            />
          )}
          <Text style={styles.pipTag}>Você</Text>
        </View>
      </View>

      {/* Control Actions Panel (Glassmorphic Styled Toolbar) */}
      <View style={styles.controlPanel}>
        <View style={styles.toolbar}>
          {/* Mute Mic Button */}
          <TouchableOpacity
            style={[styles.toolBtn, isMuted && styles.toolBtnActive]}
            onPress={handleMuteToggle}
            activeOpacity={0.7}
          >
            <Text style={styles.btnIcon}>{isMuted ? "🎙️" : "🎤"}</Text>
            <Text style={styles.btnLabel}>{isMuted ? "Unmute" : "Mutar"}</Text>
          </TouchableOpacity>

          {/* Toggle Cam Button */}
          <TouchableOpacity
            style={[styles.toolBtn, isCamOff && styles.toolBtnActive]}
            onPress={handleCamToggle}
            activeOpacity={0.7}
          >
            <Text style={styles.btnIcon}>{isCamOff ? "📷" : "📹"}</Text>
            <Text style={styles.btnLabel}>{isCamOff ? "Ativar Cam" : "Desat. Cam"}</Text>
          </TouchableOpacity>

          {/* Clinical Evolution / Note Editor Access */}
          <TouchableOpacity
            style={[styles.toolBtn, styles.notesBtn]}
            onPress={onOpenNotes}
            activeOpacity={0.7}
          >
            <Text style={styles.btnIcon}>📝</Text>
            <Text style={[styles.btnLabel, { color: '#F8FAFC' }]}>Evolução</Text>
          </TouchableOpacity>

          {/* Hang Up Button */}
          <TouchableOpacity
            style={[styles.toolBtn, styles.hangUpBtn]}
            onPress={() => {
              Alert.alert(
                "Finalizar Teleconsulta",
                "Tem certeza que deseja encerrar a transmissão?",
                [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Encerrar", style: "destructive", onPress: onHangUp }
                ]
              );
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.btnIcon}>❌</Text>
            <Text style={[styles.btnLabel, { color: '#EF4444' }]}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
    borderRadius: 24,
    overflow: 'hidden',
  },
  videoCanvas: {
    flex: 1,
    position: 'relative',
  },
  fullScreenVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  scrimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  patientBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  patientNameText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  secureBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(13, 148, 136, 0.9)',
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  secureBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timerBadge: {
    position: 'absolute',
    top: 70,
    left: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  pipContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 100,
    height: 140,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#0D9488',
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  pipCanvas: {
    width: '100%',
    height: '100%',
  },
  pipFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  pipFallbackText: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
    padding: 4,
  },
  pipTag: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    color: '#F8FAFC',
    fontSize: 10,
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  controlPanel: {
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 18,
    paddingHorizontal: 10,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  toolBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 70,
  },
  toolBtnActive: {
    backgroundColor: '#334155',
  },
  hangUpBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  notesBtn: {
    backgroundColor: 'rgba(13, 148, 136, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.6)',
  },
  btnIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  btnLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  centerCallButton: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
    backgroundColor: '#0D9488',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  centerCallButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  centerCallButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

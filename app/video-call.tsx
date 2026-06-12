import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { AppHeader, ErrorNotice, PrimaryButton, Spinner } from '../src/components/ui';
import { useVideoCall } from '../src/hooks/useVideoCall';
import { useTheme } from '../src/contexts/ThemeContext';

export default function VideoCallScreen() {
  const { turnoId, role } = useLocalSearchParams<{ turnoId: string; role?: 'patient' | 'professional' }>();
  const { colors } = useTheme();
  const call = useVideoCall(turnoId);
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null);

  useEffect(() => {
    if (call.rtc.remoteStream) {
      // react-native-webrtc uses a stream URL for RTCView
      setRemoteUrl(call.rtc.remoteStream.toURL());
    }
  }, [call.rtc.remoteStream]);

  const title = useMemo(() => {
    if (role === 'professional') return 'Sala de espera';
    return 'Videoconsulta';
  }, [role]);

  if (call.stage === 'idle' || call.stage === 'connecting') {
    return <Spinner label="Iniciando videollamada..." />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader showBack />
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>{title}</Text>
        <Text style={{ color: colors.textSecondary }}>Estado: {call.stage}</Text>
        <ErrorNotice message={call.error} />

        <View style={{ flex: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: '#0f172a' }}>
          {remoteUrl ? (
            <RTCView streamURL={remoteUrl} objectFit="cover" style={{ flex: 1 }} />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: 'white' }}>
                {role === 'professional' ? 'Esperando a que llegue el paciente...' : 'Esperando a la otra persona...'}
              </Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'space-between' }}>
          <PrimaryButton title={call.rtc.micEnabled ? 'Silenciar' : 'Activar micrófono'} onPress={() => call.rtc.toggleMic()} />
          <PrimaryButton title="Colgar" onPress={() => { call.hangUp(); router.back(); }} />
          <PrimaryButton title={call.rtc.cameraEnabled ? 'Apagar cámara' : 'Encender cámara'} onPress={() => call.rtc.toggleCamera()} />
        </View>
      </View>
    </View>
  );
}

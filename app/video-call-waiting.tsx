import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { AppHeader, PrimaryButton, Spinner } from '../src/components/ui';
import { useVideoCall } from '../src/hooks/useVideoCall';
import { useTheme } from '../src/contexts/ThemeContext';

export default function VideoCallWaitingRoom() {
  const { turnoId } = useLocalSearchParams<{ turnoId: string }>();
  const { colors } = useTheme();
  const call = useVideoCall(turnoId);

  if (call.stage === 'idle' || call.stage === 'connecting') {
    return <Spinner label="Preparando sala de espera..." />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader showBack />
      <View style={{ flex: 1, justifyContent: 'center', padding: 20, gap: 12 }}>
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: '700' }}>Sala de espera</Text>
        <Text style={{ color: colors.textSecondary }}>Esperando a que se una el paciente.</Text>
        <Text style={{ color: colors.textSecondary }}>Estado: {call.stage}</Text>
        {call.error ? <Text style={{ color: colors.error }}>{call.error}</Text> : null}
        <PrimaryButton title="Volver" onPress={() => { call.hangUp(); router.back(); }} />
      </View>
    </View>
  );
}

import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text } from 'react-native';
import { AppHeader, PrimaryButton, sharedStyles } from '../../../src/components/ui';

export default function PagoResultScreen() {
  const { turnoId, estado } = useLocalSearchParams<{ turnoId?: string; estado?: string }>();
  const normalized = estado || 'pendiente';
  const title = normalized === 'timeout' ? 'Pago pendiente' : `Pago ${normalized}`;

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={[sharedStyles.content, { flexGrow: 1, justifyContent: 'center' }]}>
      <AppHeader showBack />
      <Text style={sharedStyles.title}>{title}</Text>
      <Text style={sharedStyles.subtitle}>
        {normalized === 'timeout'
          ? 'No pudimos confirmar el pago todavía. El estado se actualizará en tus turnos.'
          : `Estado recibido para el turno ${turnoId || ''}.`}
      </Text>
      <PrimaryButton title="Volver a mis turnos" onPress={() => router.replace('/dashboard/paciente')} />
    </ScrollView>
  );
}

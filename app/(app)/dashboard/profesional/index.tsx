import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { EmptyState, ErrorNotice, PrimaryButton, SecondaryButton, Spinner, TurnoCard, sharedStyles } from '../../../../src/components/ui';
import { api, type Turno, type TurnoEstado } from '../../../../src/lib/api';
import { useAuth } from '../../../../src/lib/auth-context';
import { useNotifications } from '../../../../src/lib/notifications-context';
import { canTransition } from '../../../../src/lib/utils';
import { colors, spacing } from '../../../../src/theme';

export default function ProfesionalDashboard() {
  const { user, logout } = useAuth();
  const { unread } = useNotifications();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const professionalId = user?.profesional?.id;

  const todayRange = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { desde: start.toISOString(), hasta: end.toISOString() };
  }, []);

  const load = useCallback(async () => {
    if (!professionalId) return;
    setLoading(true);
    setError(null);
    try {
      const [agenda] = await Promise.all([
        api.turnos.getByProfesional(professionalId, { page: 1, limit: 20, ...todayRange }),
        api.profesional.getStats().catch(() => null),
      ]);
      setTurnos(agenda.turnos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la agenda.');
    } finally {
      setLoading(false);
    }
  }, [professionalId, todayRange]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeEstado(turno: Turno, estado: TurnoEstado) {
    try {
      await api.turnos.updateEstado(turno.id, estado);
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo actualizar el turno.');
    }
  }

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={sharedStyles.title}>Agenda de hoy</Text>
          <Text style={sharedStyles.subtitle}>{user?.profesional?.nombre} · avisos {unread}</Text>
        </View>
        <SecondaryButton title="Avisos" onPress={() => router.push('/notifications')} />
      </View>
      <ErrorNotice message={error} />
      {loading && !turnos.length ? <Spinner /> : null}
      {turnos.map((turno) => (
        <View key={turno.id} style={{ gap: spacing.sm }}>
          <TurnoCard turno={turno} onPress={() => router.push(`/turno/${turno.id}`)} />
          <View style={sharedStyles.row}>
            {(['CONFIRMADO', 'COMPLETADO', 'AUSENTE', 'CANCELADO'] as TurnoEstado[])
              .filter((next) => canTransition(turno.estado, next))
              .map((next) => (
                <SecondaryButton key={next} title={next} onPress={() => changeEstado(turno, next)} />
              ))}
          </View>
        </View>
      ))}
      {!turnos.length && !loading ? <EmptyState title="Agenda libre" subtitle="No hay turnos para hoy." /> : null}
      <Text style={{ color: colors.textSecondary }}>Los campos de riesgo de preconsulta se muestran en el detalle del turno y no son editables.</Text>
      <PrimaryButton title="Cerrar sesión" onPress={logout} />
    </ScrollView>
  );
}

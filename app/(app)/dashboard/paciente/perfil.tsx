import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { EmptyState, ErrorNotice, PrimaryButton, SecondaryButton, Spinner, TurnoCard, sharedStyles } from '../../../../src/components/ui';
import { api, type Turno } from '../../../../src/lib/api';
import { useAuth } from '../../../../src/lib/auth-context';
import { useNotifications } from '../../../../src/lib/notifications-context';
import { colors, spacing, borderRadius } from '../../../../src/theme';

export default function PerfilPaciente() {
  const { user, logout } = useAuth();
  const { unread } = useNotifications();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [historial, setHistorial] = useState<Turno[]>([]);
  const [tab, setTab] = useState<'turnos' | 'historial'>('turnos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [proximos, pasados] = await Promise.all([
        api.turnos.getMisTurnos({ tipo: 'proximos', page: 1, limit: 10 }),
        api.turnos.getMisTurnos({ tipo: 'pasados', page: 1, limit: 10 }),
      ]);
      setTurnos(proximos.turnos || []);
      setHistorial(pasados.turnos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function cancelTurno(turno: Turno) {
    Alert.alert('Cancelar turno', '¿Querés cancelar este turno?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.turnos.updateEstado(turno.id, 'CANCELADO', 'Cancelado desde mobile');
            await load();
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo cancelar.');
          }
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={sharedStyles.screen}
      contentContainerStyle={sharedStyles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: 'flex-start', padding: spacing.sm, marginBottom: spacing.sm }}>
        <Text style={{ color: colors.primary, fontWeight: '700' }}>← Volver</Text>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={sharedStyles.title}>Hola, {user?.paciente?.nombre || 'paciente'}</Text>
          <Text style={sharedStyles.subtitle}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/notifications')} style={{ padding: spacing.sm }}>
          <Text style={{ color: colors.primary, fontWeight: '800' }}>Avisos {unread ? `(${unread})` : ''}</Text>
        </TouchableOpacity>
      </View>

      <View style={sharedStyles.row}>
        {(['turnos', 'historial'] as const).map((item) => (
          <TouchableOpacity key={item} onPress={() => setTab(item)} style={{ flex: 1, padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: tab === item ? colors.primary : colors.surface, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: tab === item ? colors.white : colors.text, textAlign: 'center', fontWeight: '700' }}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ErrorNotice message={error} />
      {loading && !turnos.length && !historial.length ? <Spinner /> : null}

      <View style={{ gap: spacing.md }}>
        {(tab === 'turnos' ? turnos : historial).map((turno) => (
          <View key={turno.id} style={{ gap: spacing.sm }}>
            <TurnoCard turno={turno} onPress={() => router.push(`/turno/${turno.id}`)} />
            {tab === 'turnos' && turno.estado !== 'CANCELADO' ? (
              <View style={sharedStyles.row}>
                <SecondaryButton title="Preconsulta" onPress={() => router.push(`/preconsulta/${turno.id}`)} />
                <SecondaryButton title="Cancelar" onPress={() => cancelTurno(turno)} />
              </View>
            ) : null}
          </View>
        ))}
        {!(tab === 'turnos' ? turnos : historial).length ? (
          <EmptyState title="No hay turnos" subtitle={tab === 'turnos' ? 'Buscá profesionales para reservar.' : 'Todavía no hay historial.'} />
        ) : null}
      </View>

      <PrimaryButton title="Cerrar sesión" onPress={logout} />
    </ScrollView>
  );
}

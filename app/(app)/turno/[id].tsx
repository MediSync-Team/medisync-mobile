import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { EmptyState, ErrorNotice, PrimaryButton, SecondaryButton, Spinner, EstadoBadge, sharedStyles } from '../../../src/components/ui';
import { api, type Turno, type TurnoEstado } from '../../../src/lib/api';
import { combineLocalDateTimeToIso, formatDateTime, todayDate } from '../../../src/lib/date';
import { canTransition, fullName, turnoLocation } from '../../../src/lib/utils';
import { colors, spacing } from '../../../src/theme';

export default function TurnoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [turno, setTurno] = useState<Turno | null>(null);
  const [date, setDate] = useState(todayDate());
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setTurno(await api.turnos.getById(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el turno.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeEstado(estado: TurnoEstado) {
    if (!turno) return;
    try {
      setTurno(await api.turnos.updateEstado(turno.id, estado));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo actualizar.');
    }
  }

  async function reprogramar() {
    if (!turno) return;
    try {
      const fechaHora = combineLocalDateTimeToIso(date, time);
      setTurno(await api.turnos.reprogramar(turno.id, { fechaHora, modalidad: turno.modalidad }));
    } catch (err) {
      Alert.alert('Reprogramación inválida', err instanceof Error ? err.message : 'No se pudo reprogramar.');
    }
  }

  if (loading && !turno) return <Spinner />;

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <SecondaryButton title="Volver" onPress={() => router.back()} />
      <ErrorNotice message={error} />
      {turno ? (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
            <Text style={[sharedStyles.title, { flex: 1 }]}>Turno</Text>
            <EstadoBadge estado={turno.estado} />
          </View>
          <Text style={sharedStyles.subtitle}>{formatDateTime(turno.fechaHora)}</Text>
          <Text style={{ color: colors.text }}>Paciente: {fullName(turno.paciente)}</Text>
          <Text style={{ color: colors.text }}>Profesional: {fullName(turno.profesional)}</Text>
          <Text style={{ color: colors.text }}>Modalidad: {turno.modalidad}</Text>
          <Text style={{ color: colors.text }}>Lugar: {turnoLocation(turno)}</Text>
          {turno.preconsulta ? (
            <View style={{ gap: spacing.xs }}>
              <Text style={sharedStyles.label}>Preconsulta</Text>
              <Text style={{ color: colors.text }}>Motivo: {turno.preconsulta.motivo || '-'}</Text>
              <Text style={{ color: colors.text }}>Riesgo: {turno.preconsulta.riesgo || 'Sin clasificar'}</Text>
              <Text style={{ color: colors.text }}>Resumen: {turno.preconsulta.resumen || '-'}</Text>
              <Text style={{ color: colors.text }}>Flags: {turno.preconsulta.flags?.join(', ') || '-'}</Text>
            </View>
          ) : null}
          <View style={sharedStyles.row}>
            <SecondaryButton title="Preconsulta" onPress={() => router.push(`/preconsulta/${turno.id}`)} />
            {(['CONFIRMADO', 'COMPLETADO', 'AUSENTE', 'CANCELADO'] as TurnoEstado[])
              .filter((next) => canTransition(turno.estado, next))
              .map((next) => <SecondaryButton key={next} title={next} onPress={() => changeEstado(next)} />)}
          </View>
          <Text style={sharedStyles.label}>Reprogramar</Text>
          <TextInput style={sharedStyles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
          <TextInput style={sharedStyles.input} value={time} onChangeText={setTime} placeholder="HH:mm" />
          <PrimaryButton title="Reprogramar" onPress={reprogramar} />
        </>
      ) : <EmptyState title="Turno no encontrado" />}
    </ScrollView>
  );
}

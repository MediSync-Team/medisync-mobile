import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppHeader, EmptyState, ErrorNotice, PrimaryButton, SecondaryButton, Spinner, EstadoBadge, getSharedStyles } from '../../../src/components/ui';
import { api, type Turno, type TurnoEstado, type Slot } from '../../../src/lib/api';
import { combineLocalDateTimeToIso, formatDateTime, todayDate } from '../../../src/lib/date';
import { canJoinVideoCall, canTransition, fullName, turnoLocation } from '../../../src/lib/utils';
import { useAuth } from '../../../src/lib/auth-context';
import { spacing, borderRadius, fontSize } from '../../../src/theme';
import { useTheme } from '../../../src/contexts/ThemeContext';

export default function TurnoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const s = getSharedStyles(colors);
  const { user } = useAuth();
  const [turno, setTurno] = useState<Turno | null>(null);
  const [date, setDate] = useState(todayDate());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const turnoData = await api.turnos.getById(id);
      setTurno(turnoData);
      const fecha = turnoData.fechaHora.slice(0, 10);
      setDate(fecha);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el turno.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!turno || !date) { setSlots([]); return; }
    const profesionalId = turno.profesional?.id || turno.profesionalId;
    if (!profesionalId) return;
    setLoadingSlots(true);
    api.profesionales.getSlots(profesionalId, date, turno.modalidad)
      .then((data) => setSlots(data.filter((slot) => slot.disponible)))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date, turno?.profesional?.id, turno?.modalidad]);

  async function changeEstado(estado: TurnoEstado) {
    if (!turno) return;
    try {
      setTurno(await api.turnos.updateEstado(turno.id, estado));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo actualizar.');
    }
  }

  async function reprogramar() {
    if (!turno || !selectedSlot) {
      Alert.alert('Seleccioná un horario', 'Elegí un horario disponible para reprogramar.');
      return;
    }
    try {
      const fechaHora = combineLocalDateTimeToIso(date, selectedSlot);
      setTurno(await api.turnos.reprogramar(turno.id, { fechaHora, modalidad: turno.modalidad }));
      setSelectedSlot(null);
    } catch (err) {
      Alert.alert('Reprogramación inválida', err instanceof Error ? err.message : 'No se pudo reprogramar.');
    }
  }

  if (loading && !turno) return <Spinner />;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <AppHeader showBack />
      <ErrorNotice message={error} />
      {turno ? (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
            <Text style={[s.title, { flex: 1 }]}>Turno</Text>
            <EstadoBadge estado={turno.estado} />
          </View>
          <Text style={s.subtitle}>{formatDateTime(turno.fechaHora)}</Text>
          <Text style={{ color: colors.text }}>Paciente: {fullName(turno.paciente)}</Text>
          <Text style={{ color: colors.text }}>Profesional: {fullName(turno.profesional)}</Text>
          <Text style={{ color: colors.text }}>Modalidad: {turno.modalidad}</Text>
          <Text style={{ color: colors.text }}>Lugar: {turnoLocation(turno)}</Text>
          {turno.preconsulta ? (
            <View style={{ gap: spacing.xs }}>
              <Text style={s.label}>Preconsulta</Text>
              <Text style={{ color: colors.text }}>Motivo: {turno.preconsulta.motivo || '-'}</Text>
              <Text style={{ color: colors.text }}>Riesgo: {turno.preconsulta.riesgo || 'Sin clasificar'}</Text>
              <Text style={{ color: colors.text }}>Resumen: {turno.preconsulta.resumen || '-'}</Text>
              <Text style={{ color: colors.text }}>Flags: {turno.preconsulta.flags?.join(', ') || '-'}</Text>
            </View>
          ) : null}
          <View style={s.row}>
            <SecondaryButton title="Preconsulta" onPress={() => router.push(`/preconsulta/${turno.id}`)} />
            {(['CONFIRMADO', 'COMPLETADO', 'AUSENTE', 'CANCELADO'] as TurnoEstado[])
              .filter((next) => canTransition(turno.estado, next))
              .map((next) => <SecondaryButton key={next} title={next} onPress={() => changeEstado(next)} />)}
          </View>
          {canJoinVideoCall(turno) ? (
            <SecondaryButton
              title={user?.rol === 'PROFESIONAL' ? 'Sala de espera' : 'Videoconsulta'}
              onPress={() => {
                const role = user?.rol === 'PROFESIONAL' ? 'professional' : 'patient';
                const name = user?.rol === 'PROFESIONAL'
                  ? turno.paciente ? `${turno.paciente.nombre} ${turno.paciente.apellido}` : ''
                  : turno.profesional ? `${turno.profesional.nombre} ${turno.profesional.apellido}` : '';
                router.push(`/video-call?turnoId=${turno.id}&role=${role}&participantName=${encodeURIComponent(name)}`);
              }}
            />
          ) : null}
          <Text style={s.label}>Reprogramar</Text>
          <TextInput style={s.input} value={date} onChangeText={(d) => { setDate(d); setSelectedSlot(null); }} placeholder="YYYY-MM-DD" />
          {loadingSlots ? <Spinner label="Cargando horarios..." /> : null}
          {!loadingSlots && slots.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {slots.map((slot) => (
                <TouchableOpacity
                  key={slot.hora}
                  onPress={() => setSelectedSlot(slot.hora)}
                  style={{ padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: selectedSlot === slot.hora ? colors.primary : colors.surface, borderWidth: 1, borderColor: colors.border }}
                >
                  <Text style={{ color: selectedSlot === slot.hora ? colors.white : colors.text, fontWeight: '700', fontSize: fontSize.sm }}>{slot.hora}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          {!loadingSlots && !slots.length && date ? <EmptyState title="Sin horarios disponibles" subtitle="Probá otra fecha." /> : null}
          <PrimaryButton title="Reprogramar" onPress={reprogramar} disabled={!selectedSlot} />
        </>
      ) : <EmptyState title="Turno no encontrado" />}
    </ScrollView>
  );
}

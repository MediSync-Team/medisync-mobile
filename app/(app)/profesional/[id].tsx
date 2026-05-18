import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { EmptyState, ErrorNotice, PrimaryButton, SecondaryButton, Spinner, sharedStyles } from '../../../src/components/ui';
import { api, type Profesional, type Slot } from '../../../src/lib/api';
import { todayDate } from '../../../src/lib/date';
import { fullName } from '../../../src/lib/utils';
import { colors, spacing, borderRadius } from '../../../src/theme';

export default function ProfesionalProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profesional, setProfesional] = useState<Profesional | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [fecha, setFecha] = useState(todayDate());
  const [modalidad, setModalidad] = useState<'PRESENCIAL' | 'VIRTUAL'>('VIRTUAL');
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [prof, available] = await Promise.all([
        api.profesionales.getById(id),
        api.profesionales.getSlots(id, fecha, modalidad),
      ]);
      setProfesional(prof);
      setSlots(available.filter((slot) => slot.disponible));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el profesional.');
    } finally {
      setLoading(false);
    }
  }, [fecha, id, modalidad]);

  useEffect(() => {
    load();
  }, [load]);

  async function pollPayment(turnoId: string) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const estado = await api.pagos.getEstado(turnoId);
      if (estado.estado && !['PENDIENTE', 'PENDING'].includes(estado.estado.toUpperCase())) {
        router.push(`/pago?turnoId=${turnoId}&estado=${estado.estado}`);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    router.push(`/pago?turnoId=${turnoId}&estado=timeout`);
  }

  async function book() {
    if (!id || !selected) {
      setError('Seleccioná un horario.');
      return;
    }
    setBooking(true);
    setError(null);
    try {
      const fechaHora = new Date(`${fecha}T${selected}:00`).toISOString();
      const result = await api.turnos.reservar({ profesionalId: id, fechaHora, modalidad });
      const preference = await api.pagos.crearPreferencia({ turnoId: result.turno.id });
      if (preference.initPoint) {
        await WebBrowser.openBrowserAsync(preference.initPoint);
        await pollPayment(result.turno.id);
      } else {
        Alert.alert('Turno reservado', preference.mensaje || 'La reserva fue creada correctamente.');
        router.push('/dashboard/paciente');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reservar el turno.');
    } finally {
      setBooking(false);
    }
  }

  if (loading && !profesional) return <Spinner />;

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <SecondaryButton title="Volver" onPress={() => router.back()} />
      <ErrorNotice message={error} />
      {profesional ? (
        <>
          <Text style={sharedStyles.title}>{fullName(profesional)}</Text>
          <Text style={sharedStyles.subtitle}>{profesional.especialidad?.nombre}</Text>
          <Text style={sharedStyles.subtitle}>{profesional.bio || 'Sin bio cargada.'}</Text>
          <Text style={{ color: colors.primary, fontWeight: '800' }}>${Number(profesional.precioConsulta || 0).toLocaleString()}</Text>
          <View style={sharedStyles.row}>
            {(['VIRTUAL', 'PRESENCIAL'] as const).map((item) => (
              <TouchableOpacity key={item} onPress={() => setModalidad(item)} style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: modalidad === item ? colors.primary : colors.surface, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ color: modalidad === item ? colors.white : colors.text, textAlign: 'center', fontWeight: '700' }}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={sharedStyles.label}>Fecha</Text>
          <View style={sharedStyles.row}>
            <TouchableOpacity onPress={() => setFecha(todayDate())} style={{ padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
              <Text>Hoy</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.text }}>{fecha}</Text>
          </View>
          <Text style={sharedStyles.label}>Horarios disponibles</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {slots.map((slot) => (
              <TouchableOpacity key={slot.hora} onPress={() => setSelected(slot.hora)} style={{ padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: selected === slot.hora ? colors.primary : colors.surface, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ color: selected === slot.hora ? colors.white : colors.text, fontWeight: '700' }}>{slot.hora}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {!slots.length ? <EmptyState title="Sin horarios" subtitle="Probá otra modalidad o fecha." /> : null}
          <PrimaryButton title={booking ? 'Reservando...' : 'Reservar turno'} onPress={book} disabled={booking} />
        </>
      ) : <EmptyState title="Profesional no encontrado" />}
    </ScrollView>
  );
}

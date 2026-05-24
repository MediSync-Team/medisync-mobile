import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AppHeader, EmptyState, ErrorNotice, PrimaryButton, SecondaryButton, Spinner, getSharedStyles } from '../../../src/components/ui';
import { api, type Profesional, type Slot } from '../../../src/lib/api';
import { todayDate } from '../../../src/lib/date';
import { fullName } from '../../../src/lib/utils';
import { spacing, borderRadius, fontSize } from '../../../src/theme';
import { useTheme } from '../../../src/contexts/ThemeContext';

export default function ProfesionalProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const s = getSharedStyles(colors);
  const [profesional, setProfesional] = useState<Profesional | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [fecha, setFecha] = useState(todayDate());
  const [modalidad, setModalidad] = useState<'PRESENCIAL' | 'VIRTUAL'>('VIRTUAL');
  const [selected, setSelected] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
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
      const [yr, mo, dy] = fecha.split('-').map(Number);
      const [hh, mi] = selected.split(':').map(Number);
      const fechaHora = new Date(yr, mo - 1, dy, hh, mi, 0).toISOString();
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
    <View style={{ flex: 1 }}>
      <ScrollView style={s.screen} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <AppHeader showBack />
        <ErrorNotice message={error} />
        {profesional ? (
          <>
            <Text style={s.title}>{fullName(profesional)}</Text>
            <Text style={s.subtitle}>{profesional.especialidad?.nombre}</Text>
            <Text style={s.subtitle}>{profesional.bio || 'Sin bio cargada.'}</Text>
            <Text style={{ color: colors.primary, fontWeight: '800' }}>${Number(profesional.precioConsulta || 0).toLocaleString()}</Text>
            <View style={s.row}>
              {(['VIRTUAL', 'PRESENCIAL'] as const).map((item) => (
                <TouchableOpacity key={item} onPress={() => setModalidad(item)} style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: modalidad === item ? colors.primary : colors.surface, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: modalidad === item ? colors.white : colors.text, textAlign: 'center', fontWeight: '700' }}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.label}>Fecha</Text>
            <TouchableOpacity
              onPress={() => { setPickerMonth(fecha.slice(0, 7)); setShowDatePicker(true); }}
              style={[s.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
            >
              <Text style={{ color: colors.text, flex: 1 }}>{fecha}</Text>
              <Text style={{ color: colors.textSecondary }}>📅</Text>
            </TouchableOpacity>
            <Text style={s.label}>Horarios disponibles</Text>
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

      <Modal visible={showDatePicker} transparent animationType="fade">
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: spacing.lg }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <TouchableOpacity
              onPress={() => {
                const [y, m] = pickerMonth.split('-').map(Number);
                const d = new Date(y, m - 2, 1);
                setPickerMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
              }}
              style={{ padding: spacing.sm }}
            >
              <Text style={{ fontSize: fontSize.lg, color: colors.primary }}>◀</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.text }}>
              {new Date(pickerMonth + '-01').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const [y, m] = pickerMonth.split('-').map(Number);
                const d = new Date(y, m, 1);
                setPickerMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
              }}
              style={{ padding: spacing.sm }}
            >
              <Text style={{ fontSize: fontSize.lg, color: colors.primary }}>▶</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', marginBottom: spacing.sm }}>
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
              <View key={`hd-${i}`} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '700' }}>{d}</Text>
              </View>
            ))}
          </View>

          {(() => {
            const [y, m] = pickerMonth.split('-').map(Number);
            const firstDay = new Date(y, m - 1, 1).getDay();
            const daysInMonth = new Date(y, m, 0).getDate();
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const grid: ('blank' | number)[][] = [];
            let week: ('blank' | number)[] = [];
            for (let i = 0; i < firstDay; i++) week.push('blank');
            for (let day = 1; day <= daysInMonth; day++) {
              week.push(day);
              if (week.length === 7) { grid.push(week); week = []; }
            }
            if (week.length) grid.push(week);
            return grid.map((row, ri) => (
              <View key={`${pickerMonth}-row-${ri}`} style={{ flexDirection: 'row', marginBottom: spacing.xs }}>
                {row.map((cell, ci) => {
                  if (cell === 'blank') return <View key={`blank-${ri}-${ci}`} style={{ flex: 1 }} />;
                  const dayStr = `${y}-${String(m).padStart(2, '0')}-${String(cell).padStart(2, '0')}`;
                  const isPast = dayStr < todayStr;
                  const isSelected = dayStr === fecha;
                  return (
                    <TouchableOpacity
                      key={`day-${ri}-${ci}`}
                      onPress={() => { if (!isPast) { setFecha(dayStr); setSelected(null); setShowDatePicker(false); } }}
                      disabled={isPast}
                      style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: isSelected ? colors.primary : 'transparent', opacity: isPast ? 0.3 : 1 }}
                    >
                      <Text style={{ fontSize: fontSize.sm, fontWeight: isSelected ? '700' : '400', color: isSelected ? colors.white : colors.text }}>{cell}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ));
          })()}

          <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ alignSelf: 'center', marginTop: spacing.sm }}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize.md }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </View>
  );
}

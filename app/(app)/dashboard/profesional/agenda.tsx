import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppHeader, EmptyState, ErrorNotice, SecondaryButton, Spinner, TurnoCard, getSharedStyles } from '../../../../src/components/ui';
import { api, type Turno, type TurnoEstado } from '../../../../src/lib/api';
import { useAuth } from '../../../../src/lib/auth-context';
import { canJoinVideoCall, canTransition, estadoColor } from '../../../../src/lib/utils';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { useLang } from '../../../../src/i18n/context';
import { spacing, borderRadius, fontSize } from '../../../../src/theme';

type StatusFilter = 'TODOS' | 'RESERVADO' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO' | 'AUSENTE';
type ModalityFilter = 'TODAS' | 'PRESENCIAL' | 'VIRTUAL';

export default function ProfesionalAgenda() {
  const { colors } = useTheme();
  const s = getSharedStyles(colors);
  const { t } = useLang();
  const { user } = useAuth();
  const professionalId = user?.profesional?.id;

  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fecha, setFecha] = useState(() => new Date());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('TODOS');
  const [modalityFilter, setModalityFilter] = useState<ModalityFilter>('TODAS');
  const [soloRiesgo, setSoloRiesgo] = useState(false);

  const dateKey = (d: Date) => d.toISOString().slice(0, 10);

  const queryRange = useMemo(() => {
    const start = new Date(fecha);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { desde: start.toISOString(), hasta: end.toISOString() };
  }, [fecha]);

  const load = useCallback(async () => {
    if (!professionalId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.turnos.getByProfesional(professionalId, { page: 1, limit: 50, ...queryRange });
      setTurnos(data.turnos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common', 'error'));
    } finally {
      setLoading(false);
    }
  }, [professionalId, queryRange, t]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredTurnos = useMemo(() => {
    return turnos
      .filter(t => statusFilter === 'TODOS' || t.estado === statusFilter)
      .filter(t => modalityFilter === 'TODAS' || t.modalidad === modalityFilter)
      .filter(t => {
        if (!search.trim()) return true;
        const name = t.paciente ? `${t.paciente.nombre} ${t.paciente.apellido}`.toLowerCase() : '';
        return name.includes(search.toLowerCase());
      })
      .filter(t => !soloRiesgo || t.preconsultaRiesgo === 'ALTO' || t.preconsultaRiesgo === 'URGENTE')
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  }, [turnos, statusFilter, modalityFilter, search, soloRiesgo]);

  function changeDay(delta: number) {
    const next = new Date(fecha);
    next.setDate(next.getDate() + delta);
    setFecha(next);
  }

  async function changeEstado(turno: Turno, estado: TurnoEstado) {
    try {
      await api.turnos.updateEstado(turno.id, estado);
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo actualizar el turno.');
    }
  }

  const isToday = dateKey(fecha) === dateKey(new Date());
  const dayLabel = fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  const STATUS_FILTERS: StatusFilter[] = ['TODOS', 'RESERVADO', 'CONFIRMADO', 'COMPLETADO', 'CANCELADO', 'AUSENTE'];
  const MODALITY_FILTERS: ModalityFilter[] = ['TODAS', 'PRESENCIAL', 'VIRTUAL'];

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={s.screen}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <AppHeader showBack />

        {/* Date navigation */}
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <TouchableOpacity onPress={() => changeDay(-1)} style={{ padding: spacing.sm }}>
            <Text style={{ fontSize: fontSize.xl, color: colors.primary }}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFecha(new Date())}>
            <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.text, textTransform: 'capitalize' }}>
              {isToday ? `${t('professional', 'today')} — ` : ''}{dayLabel}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeDay(1)} style={{ padding: spacing.sm }}>
            <Text style={{ fontSize: fontSize.xl, color: colors.primary }}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Filter row: search */}
        <TextInput
          style={s.input}
          placeholder={t('common', 'search')}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors.textSecondary}
        />

        {/* Filter row: status chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
          {STATUS_FILTERS.map(st => {
            const active = statusFilter === st;
            return (
              <TouchableOpacity
                key={st}
                onPress={() => setStatusFilter(st)}
                style={{
                  paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
                  borderRadius: borderRadius.full,
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderWidth: 1, borderColor: active ? colors.primary : colors.border,
                }}
              >
                <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: active ? colors.white : colors.text }}>
                  {st === 'TODOS' ? t('professional', 'statusAll') : st}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Filter row: modality + risk */}
        <View style={s.row}>
          <View style={[s.row, { flex: 1 }]}>
            {MODALITY_FILTERS.map(m => {
              const active = modalityFilter === m;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setModalityFilter(m)}
                  style={{
                    flex: 1, paddingVertical: spacing.xs, alignItems: 'center',
                    borderRadius: borderRadius.md,
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderWidth: 1, borderColor: active ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: active ? colors.white : colors.text }}>
                    {m === 'TODAS' ? t('professional', 'statusAll') : m === 'PRESENCIAL' ? t('professional', 'presencial') : t('professional', 'virtual')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            onPress={() => setSoloRiesgo(!soloRiesgo)}
            style={{
              paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
              borderRadius: borderRadius.md,
              backgroundColor: soloRiesgo ? colors.error : colors.surface,
              borderWidth: 1, borderColor: soloRiesgo ? colors.error : colors.border,
            }}
          >
            <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: soloRiesgo ? colors.white : colors.text }}>
              ⚠ {t('professional', 'highRiskOnly')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={[s.row, { flexWrap: 'wrap' }]}>
          <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginRight: spacing.sm }}>{t('professional', 'legend')}:</Text>
          {(['RESERVADO', 'CONFIRMADO', 'COMPLETADO'] as TurnoEstado[]).map(est => (
            <View key={est} style={[s.row, { marginRight: spacing.md }]}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: estadoColor(est), marginRight: 4 }} />
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{est}</Text>
            </View>
          ))}
        </View>

        <ErrorNotice message={error} />

        {loading && !turnos.length ? <Spinner /> : null}

        {filteredTurnos.map((turno) => (
          <View key={turno.id} style={{ gap: spacing.sm }}>
            <TurnoCard turno={turno} onPress={() => router.push(`/turno/${turno.id}`)} />
            <View style={s.row}>
              {(['CONFIRMADO', 'COMPLETADO', 'AUSENTE', 'CANCELADO'] as TurnoEstado[])
                .filter((next) => canTransition(turno.estado, next))
                .map((next) => (
                  <SecondaryButton key={next} title={next} onPress={() => changeEstado(turno, next)} />
                ))}
              {canJoinVideoCall(turno) ? (
                <SecondaryButton title="Sala de espera" onPress={() => router.push(`/video-call?turnoId=${turno.id}&role=professional&participantName=${encodeURIComponent(turno.paciente ? `${turno.paciente.nombre} ${turno.paciente.apellido}` : '')}`)} />
              ) : null}
            </View>
          </View>
        ))}

        {!filteredTurnos.length && !loading ? (
          <EmptyState title={t('professional', 'agendaEmpty')} subtitle={!search && statusFilter === 'TODOS' ? t('professional', 'agendaFreeDesc') : ''} />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

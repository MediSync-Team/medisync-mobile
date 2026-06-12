import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { AppHeader, EmptyState, ErrorNotice, SecondaryButton, Spinner, TurnoCard, getSharedStyles } from '../../../../src/components/ui';
import { api, type Turno, type PacienteStats, type ListaEsperaItem } from '../../../../src/lib/api';
import { useAuth } from '../../../../src/lib/auth-context';
import { spacing, borderRadius, fontSize } from '../../../../src/theme';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { canJoinVideoCall } from '../../../../src/lib/utils';

type Tab = 'resumen' | 'proximos' | 'pasados' | 'lista' | 'opciones';

const TABS: { key: Tab; label: string }[] = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'proximos', label: 'Próximos' },
  { key: 'pasados', label: 'Pasados' },
  { key: 'lista', label: 'Lista' },
  { key: 'opciones', label: 'Opciones' },
];

export default function PerfilPaciente() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const s = getSharedStyles(colors);
  const [tab, setTab] = useState<Tab>('resumen');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [historial, setHistorial] = useState<Turno[]>([]);
  const [stats, setStats] = useState<PacienteStats | null>(null);
  const [listaEspera, setListaEspera] = useState<ListaEsperaItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [proximosRes, pasadosRes, statsData, listaData] = await Promise.all([
        api.turnos.getMisTurnos({ tipo: 'proximos', page: 1, limit: 10 }),
        api.turnos.getMisTurnos({ tipo: 'pasados', page: 1, limit: 10 }),
        api.pacientes.getMisStats(),
        api.listaEspera.misSuscripciones(),
      ]);
      setTurnos(proximosRes.turnos || []);
      setHistorial(pasadosRes.turnos || []);
      setStats(statsData);
      setListaEspera(listaData);
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

  async function cancelarListaEspera(item: ListaEsperaItem) {
    Alert.alert('Cancelar suscripción', '¿Querés cancelar esta suscripción a la lista de espera?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.listaEspera.cancelar(item.id);
            await load();
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo cancelar.');
          }
        },
      },
    ]);
  }

  function renderResumen() {
    if (!stats) return null;
    const nextTurno = turnos.find((t) => t.estado === 'RESERVADO' || t.estado === 'CONFIRMADO');

    return (
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {[
            { label: 'Próximo turno', value: nextTurno ? `${nextTurno.profesional?.nombre} ${nextTurno.profesional?.apellido}` : 'Sin turnos', color: colors.primary },
            { label: 'Gasto del mes', value: `$${stats.totalGastado.toLocaleString('es-AR')}`, color: colors.warning },
          ].map((card) => (
            <View key={card.label} style={{ flex: 1, padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: card.color + '15', borderWidth: 1, borderColor: card.color + '30' }}>
              <Text style={{ fontSize: fontSize.xs, color: colors.text }}>{card.label}</Text>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.text }}>{card.value}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {[
            { label: 'Completados', value: stats.completados ?? stats.turnosCompletados, color: '#22c55e' },
            { label: 'Total turnos', value: stats.totalTurnos, color: colors.text },
          ].map((card) => (
            <View key={card.label} style={{ flex: 1, padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: card.color + '15', borderWidth: 1, borderColor: card.color + '30' }}>
              <Text style={{ fontSize: fontSize.xs, color: colors.text }}>{card.label}</Text>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.text }}>{card.value}</Text>
            </View>
          ))}
        </View>
        {stats.topProfesionales.length > 0 ? (
          <View style={{ gap: spacing.xs }}>
            <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.text }}>Profesionales más visitados</Text>
            {stats.topProfesionales.slice(0, 5).map((item) => (
              <View key={item.profesional?.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.muted, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: fontSize.sm }}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>{item.profesional?.nombre} {item.profesional?.apellido}</Text>
                  <Text style={{ fontSize: fontSize.xs, color: colors.muted }}>{item.profesional?.especialidad?.nombre} · {item.totalTurnos} turnos</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  function renderTurnos(list: Turno[], isProximos: boolean) {
    return (
      <View style={{ gap: spacing.md }}>
        {list.map((turno) => (
          <View key={turno.id} style={{ gap: spacing.sm }}>
            <TurnoCard turno={turno} onPress={() => router.push(`/turno/${turno.id}`)} />
            {isProximos && turno.estado !== 'CANCELADO' ? (
              <View style={s.row}>
                <SecondaryButton title="Preconsulta" onPress={() => router.push(`/preconsulta/${turno.id}`)} />
                <SecondaryButton title="Cancelar" onPress={() => cancelTurno(turno)} />
                {canJoinVideoCall(turno) ? (
                  <SecondaryButton title="Videoconsulta" onPress={() => router.push(`/video-call?turnoId=${turno.id}&role=patient`)} />
                ) : null}
              </View>
            ) : null}
          </View>
        ))}
        {!list.length ? (
          <EmptyState title={isProximos ? 'No hay turnos próximos' : 'No hay turnos pasados'} subtitle={isProximos ? 'Buscá profesionales para reservar.' : ''} />
        ) : null}
      </View>
    );
  }

  function renderListaEspera() {
    if (!listaEspera.length) {
      return <EmptyState title="Sin suscripciones" subtitle="No estás en ninguna lista de espera." />;
    }
    return (
      <View style={{ gap: spacing.md }}>
        {listaEspera.map((item) => (
          <View key={item.id} style={{ padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.text }}>{item.profesional?.nombre} {item.profesional?.apellido}</Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.muted }}>{item.profesional?.especialidad?.nombre}</Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.muted }}>{new Date(item.fecha).toLocaleDateString('es-AR')} · {item.modalidad}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm }}>
              <View style={{ paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, backgroundColor: item.estado === 'NOTIFICADA' ? '#fef3c7' : '#dbeafe' }}>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: item.estado === 'NOTIFICADA' ? '#92400e' : '#1e40af' }}>{item.estado}</Text>
              </View>
              <SecondaryButton title="Cancelar" onPress={() => cancelarListaEspera(item)} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  function renderOpciones() {
    return (
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
          <View>
            <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.text }}>Modo oscuro</Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.muted }}>{isDark ? 'Activado' : 'Desactivado'}</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={isDark ? colors.text : colors.muted}
          />
        </View>
        <SecondaryButton title="Cerrar sesión" onPress={logout} />
      </View>
    );
  }

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <AppHeader showBack simple />
      <Text style={s.title}>Hola, {user?.paciente?.nombre || 'paciente'}</Text>
      <Text style={[s.subtitle, { marginBottom: spacing.sm }]}>{user?.email}</Text>

      <View style={s.row}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={{
              flex: 1,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.xs,
              borderRadius: borderRadius.md,
              backgroundColor: tab === t.key ? colors.primary + '18' : colors.surface,
              borderWidth: 1,
              borderColor: tab === t.key ? colors.primary : colors.border,
            }}
          >
            <Text style={{ color: tab === t.key ? colors.primary : colors.text, textAlign: 'center', fontWeight: '700', fontSize: fontSize.xs }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ErrorNotice message={error} />
      {loading && !turnos.length && !historial.length && !stats && !listaEspera.length ? <Spinner /> : null}

      {tab === 'resumen' ? renderResumen() : null}
      {tab === 'proximos' ? renderTurnos(turnos, true) : null}
      {tab === 'pasados' ? renderTurnos(historial, false) : null}
      {tab === 'lista' ? renderListaEspera() : null}
      {tab === 'opciones' ? renderOpciones() : null}
    </ScrollView>
  );
}

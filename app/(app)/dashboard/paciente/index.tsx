import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { EmptyState, ErrorNotice, PrimaryButton, ProfesionalCard, SecondaryButton, Spinner, TurnoCard, sharedStyles } from '../../../../src/components/ui';
import { api, type Especialidad, type Profesional, type Turno } from '../../../../src/lib/api';
import { useAuth } from '../../../../src/lib/auth-context';
import { useNotifications } from '../../../../src/lib/notifications-context';
import { colors, spacing, borderRadius } from '../../../../src/theme';

export default function PacienteDashboard() {
  const { user, logout } = useAuth();
  const { unread } = useNotifications();
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [historial, setHistorial] = useState<Turno[]>([]);
  const [tab, setTab] = useState<'buscar' | 'turnos' | 'historial'>('turnos');
  const [filters, setFilters] = useState({ especialidad: '', modalidad: '', obraSocial: '', precioMax: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [esp, profs, proximos, pasados] = await Promise.all([
        api.especialidades.getAll(),
        api.profesionales.getAll({ ...filters, page, limit: 10 }),
        api.turnos.getMisTurnos({ tipo: 'proximos', page: 1, limit: 10 }),
        api.turnos.getMisTurnos({ tipo: 'pasados', page: 1, limit: 10 }),
      ]);
      setEspecialidades(esp);
      setProfesionales(profs.profesionales || []);
      setTotalPages(profs.pagination?.totalPages || 1);
      setTurnos(proximos.turnos || []);
      setHistorial(pasados.turnos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el dashboard.');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

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

  const visibleTurnos = tab === 'historial' ? historial : turnos;

  return (
    <ScrollView
      style={sharedStyles.screen}
      contentContainerStyle={sharedStyles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={sharedStyles.title}>Hola, {user?.paciente?.nombre || 'paciente'}</Text>
          <Text style={sharedStyles.subtitle}>Turnos, búsqueda y notificaciones.</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/notifications')} style={{ padding: spacing.sm }}>
          <Text style={{ color: colors.primary, fontWeight: '800' }}>Avisos {unread ? `(${unread})` : ''}</Text>
        </TouchableOpacity>
      </View>
      <View style={sharedStyles.row}>
        {(['turnos', 'historial', 'buscar'] as const).map((item) => (
          <TouchableOpacity key={item} onPress={() => setTab(item)} style={{ flex: 1, padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: tab === item ? colors.primary : colors.surface, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: tab === item ? colors.white : colors.text, textAlign: 'center', fontWeight: '700' }}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ErrorNotice message={error} />
      {loading && !profesionales.length && !turnos.length ? <Spinner /> : null}

      {tab === 'buscar' ? (
        <View style={{ gap: spacing.md }}>
          <TextInput style={sharedStyles.input} placeholder="Obra social" value={filters.obraSocial} onChangeText={(obraSocial) => setFilters((f) => ({ ...f, obraSocial }))} />
          <View style={sharedStyles.row}>
            <TextInput style={[sharedStyles.input, { flex: 1 }]} placeholder="Precio máx." keyboardType="numeric" value={filters.precioMax} onChangeText={(precioMax) => setFilters((f) => ({ ...f, precioMax }))} />
            <TouchableOpacity onPress={() => setFilters((f) => ({ ...f, modalidad: f.modalidad === 'VIRTUAL' ? 'PRESENCIAL' : 'VIRTUAL' }))} style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.text, textAlign: 'center' }}>{filters.modalidad || 'Modalidad'}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            <TouchableOpacity onPress={() => setFilters((f) => ({ ...f, especialidad: '' }))} style={{ padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: !filters.especialidad ? colors.primary : colors.surface }}>
              <Text style={{ color: !filters.especialidad ? colors.white : colors.text }}>Todas</Text>
            </TouchableOpacity>
            {especialidades.map((esp) => (
              <TouchableOpacity key={esp.id} onPress={() => setFilters((f) => ({ ...f, especialidad: esp.id }))} style={{ padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: filters.especialidad === esp.id ? colors.primary : colors.surface }}>
                <Text style={{ color: filters.especialidad === esp.id ? colors.white : colors.text }}>{esp.nombre}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {profesionales.map((profesional) => (
            <ProfesionalCard key={profesional.id} profesional={profesional} onPress={() => router.push(`/profesional/${profesional.id}`)} />
          ))}
          {!profesionales.length ? <EmptyState title="Sin profesionales" subtitle="Probá cambiar los filtros." /> : null}
          <View style={sharedStyles.row}>
            <SecondaryButton title="Anterior" onPress={() => setPage((p) => Math.max(1, p - 1))} />
            <Text style={{ color: colors.text, flex: 1, textAlign: 'center' }}>{page} / {totalPages}</Text>
            <SecondaryButton title="Siguiente" onPress={() => setPage((p) => Math.min(totalPages, p + 1))} />
          </View>
        </View>
      ) : (
        <View style={{ gap: spacing.md }}>
          {visibleTurnos.map((turno) => (
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
          {!visibleTurnos.length ? <EmptyState title="No hay turnos" subtitle={tab === 'turnos' ? 'Buscá profesionales para reservar.' : 'Todavía no hay historial.'} /> : null}
        </View>
      )}
      <PrimaryButton title="Cerrar sesión" onPress={logout} />
    </ScrollView>
  );
}

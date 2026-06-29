import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { EmptyState, ErrorNotice, SecondaryButton, Spinner, TurnoCard, getSharedStyles } from '../../../src/components/ui';
import SegmentedControl from '../../../src/components/SegmentedControl';
import { api, type Turno, type ListaEsperaItem } from '../../../src/lib/api';
import { canJoinVideoCall } from '../../../src/lib/utils';
import { spacing, borderRadius, fontSize } from '../../../src/theme';
import { useTheme } from '../../../src/contexts/ThemeContext';

type TurnosTab = 'proximos' | 'pasados' | 'lista' | 'historial';

const SEGMENTS: { key: TurnosTab; label: string }[] = [
  { key: 'proximos', label: 'Próximos' },
  { key: 'pasados', label: 'Pasados' },
  { key: 'lista', label: 'Lista de Espera' },
  { key: 'historial', label: 'Historial' },
];

export default function TurnosScreen() {
  const { colors } = useTheme();
  const s = getSharedStyles(colors);

  const [tab, setTab] = useState<TurnosTab>('proximos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [proximos, setProximos] = useState<Turno[]>([]);
  const [pasados, setPasados] = useState<Turno[]>([]);
  const [listaEspera, setListaEspera] = useState<ListaEsperaItem[]>([]);

  const [proximosPage, setProximosPage] = useState(1);
  const [pasadosPage, setPasadosPage] = useState(1);
  const [proximosTotalPages, setProximosTotalPages] = useState(1);
  const [pasadosTotalPages, setPasadosTotalPages] = useState(1);

  const [historial, setHistorial] = useState<Turno[]>([]);
  const [historialPage, setHistorialPage] = useState(1);
  const [historialTotalPages, setHistorialTotalPages] = useState(1);
  const [expandedHistorial, setExpandedHistorial] = useState<string | null>(null);

  const LIMIT = 10;

  const loadProximos = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.turnos.getMisTurnos({ tipo: 'proximos', page, limit: LIMIT });
      setProximos(data.turnos || []);
      setProximosPage(data.pagination?.page || page);
      setProximosTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPasados = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.turnos.getMisTurnos({ tipo: 'pasados', page, limit: LIMIT });
      setPasados(data.turnos || []);
      setPasadosPage(data.pagination?.page || page);
      setPasadosTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadListaEspera = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listaEspera.misSuscripciones();
      setListaEspera(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistorial = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.turnos.miHistorial({ page, limit: LIMIT });
      setHistorial(data.turnos || []);
      setHistorialPage(data.pagination?.page || page);
      setHistorialTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'proximos') loadProximos();
    else if (tab === 'pasados') loadPasados();
    else if (tab === 'lista') loadListaEspera();
    else loadHistorial();
  }, [tab]);

  function handleTabChange(key: string) {
    setTab(key as TurnosTab);
  }

  async function cancelTurno(turno: Turno) {
    Alert.alert('Cancelar turno', '¿Querés cancelar este turno?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.turnos.updateEstado(turno.id, 'CANCELADO', 'Cancelado desde mobile');
            if (tab === 'proximos') loadProximos(proximosPage);
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
            loadListaEspera();
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo cancelar.');
          }
        },
      },
    ]);
  }

  function renderTurnos(list: Turno[], isProximos: boolean, page: number, totalPages: number, onPageChange: (p: number) => void) {
    if (!list.length && !loading) {
      return (
        <EmptyState
          title={isProximos ? 'No hay turnos próximos' : 'No hay turnos pasados'}
          subtitle={isProximos ? 'Buscá profesionales para reservar.' : ''}
        />
      );
    }
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
                  <SecondaryButton
                    title="Videoconsulta"
                    onPress={() =>
                      router.push(
                        `/video-call?turnoId=${turno.id}&role=patient&participantName=${encodeURIComponent(
                          turno.profesional
                            ? `${turno.profesional.nombre} ${turno.profesional.apellido}`
                            : ''
                        )}`
                      )
                    }
                  />
                ) : null}
              </View>
            ) : null}
            {(!isProximos || turno.estado === 'CANCELADO') ? (
              <View style={s.row}>
                <SecondaryButton title="Ver chat" onPress={() => router.push(`/chat/${turno.id}`)} />
              </View>
            ) : null}
          </View>
        ))}
        {totalPages > 1 ? (
          <View style={s.row}>
            <SecondaryButton
              title="Anterior"
              onPress={() => onPageChange(page - 1)}
              disabled={page <= 1}
            />
            <Text style={{ color: colors.text, flex: 1, textAlign: 'center', fontSize: fontSize.sm }}>
              {page} / {totalPages}
            </Text>
            <SecondaryButton
              title="Siguiente"
              onPress={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            />
          </View>
        ) : null}
      </View>
    );
  }

  function renderListaEsperaView() {
    if (!listaEspera.length && !loading) {
      return <EmptyState title="Sin suscripciones" subtitle="No estás en ninguna lista de espera." />;
    }
    return (
      <View style={{ gap: spacing.md }}>
        {listaEspera.map((item) => (
          <View
            key={item.id}
            style={{
              padding: spacing.md,
              borderRadius: borderRadius.md,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.text }}>
              {item.profesional?.nombre} {item.profesional?.apellido}
            </Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.muted }}>
              {item.profesional?.especialidad?.nombre}
            </Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.muted }}>
              {new Date(item.fecha).toLocaleDateString('es-AR')} · {item.modalidad}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm }}>
              <View
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  borderRadius: borderRadius.sm,
                  backgroundColor: item.estado === 'NOTIFICADA' ? '#fef3c7' : '#dbeafe',
                }}
              >
                <Text
                  style={{
                    fontSize: fontSize.xs,
                    fontWeight: '700',
                    color: item.estado === 'NOTIFICADA' ? '#92400e' : '#1e40af',
                  }}
                >
                  {item.estado}
                </Text>
              </View>
              <SecondaryButton title="Cancelar" onPress={() => cancelarListaEspera(item)} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  function renderHistorialView() {
    if (!historial.length && !loading) {
      return <EmptyState title="Sin historial" subtitle="No tenés consultas completadas aún." />;
    }
    return (
      <View style={{ gap: spacing.md }}>
        {historial.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => setExpandedHistorial(expandedHistorial === item.id ? null : item.id)}
            style={{
              padding: spacing.md,
              borderRadius: borderRadius.md,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                {new Date(item.fechaHora).toLocaleDateString('es-AR', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
              <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, backgroundColor: '#22c55e20' }}>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: '#16a34a' }}>COMPLETADO</Text>
              </View>
            </View>

            {/* Profesional */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.muted, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: fontSize.md }}>👤</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>
                  Dr/a. {item.profesional?.nombre} {item.profesional?.apellido}
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                  {item.profesional?.especialidad?.nombre} · {item.modalidad}
                </Text>
              </View>
              <Text style={{ fontSize: fontSize.xs, color: colors.muted }}>
                {expandedHistorial === item.id ? '▲' : '▼'}
              </Text>
            </View>

            {expandedHistorial === item.id ? (
              <View style={{ marginTop: spacing.md, gap: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
                <SecondaryButton title="Ver chat" onPress={() => router.push(`/chat/${item.id}`)} />
                {/* Evolución clínica */}
                {item.evolucion?.contenido ? (
                  <View>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs }}>
                      Evolución clínica
                    </Text>
                    <Text style={{ fontSize: fontSize.sm, color: colors.text, lineHeight: 20 }}>
                      {item.evolucion.contenido}
                    </Text>
                  </View>
                ) : null}

                {/* Receta */}
                {item.recetaIndicacion ? (
                  <View style={{ padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: '#10B98108', borderWidth: 1, borderColor: '#10B98130' }}>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs }}>Receta</Text>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>Diagnóstico</Text>
                    <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm }}>
                      {item.recetaIndicacion.diagnostico}
                    </Text>
                    {item.recetaIndicacion.medicamentos ? (
                      <>
                        <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>Medicamentos</Text>
                        <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm }}>
                          {item.recetaIndicacion.medicamentos}
                        </Text>
                      </>
                    ) : null}
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>Indicaciones</Text>
                    <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
                      {item.recetaIndicacion.indicaciones}
                    </Text>
                    {item.recetaIndicacion.proximoControl ? (
                      <Text style={{ fontSize: fontSize.xs, color: colors.primary, marginTop: spacing.xs }}>
                        Próximo control: {new Date(item.recetaIndicacion.proximoControl).toLocaleDateString('es-AR')}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {/* Certificado */}
                {item.certificado ? (
                  <View style={{ padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: '#3B82F608', borderWidth: 1, borderColor: '#3B82F630' }}>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs }}>Certificado</Text>
                    <Text style={{ fontSize: fontSize.sm, color: colors.text }}>Tipo: {typeof item.certificado === 'object' && 'tipo' in item.certificado ? item.certificado.tipo : '—'}</Text>
                    {typeof item.certificado === 'object' && 'emitidaAt' in item.certificado && item.certificado.emitidaAt ? (
                      <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                        Emitido: {new Date(item.certificado.emitidaAt).toLocaleDateString('es-AR')}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {/* Archivos */}
                {item.archivos && item.archivos.length > 0 ? (
                  <View>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs }}>
                      Archivos adjuntos ({item.archivos.length})
                    </Text>
                    {item.archivos.map((archivo) => (
                      <Text key={archivo.id} style={{ fontSize: fontSize.sm, color: colors.primary, marginBottom: 2 }}>
                        📎 {archivo.nombreOriginal}
                      </Text>
                    ))}
                  </View>
                ) : null}

                {/* Reseña / Calificar */}
                {item.resena ? (
                  <View style={{ padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: '#F59E0B08', borderWidth: 1, borderColor: '#F59E0B30' }}>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs }}>
                      Tu calificación
                    </Text>
                    <Text style={{ fontSize: fontSize.sm, color: colors.text }}>
                      {'★'.repeat(item.resena.rating)}{'☆'.repeat(5 - item.resena.rating)} {item.resena.rating}/5
                    </Text>
                    {item.resena.comentario ? (
                      <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
                        "{item.resena.comentario}"
                      </Text>
                    ) : null}
                    {item.resena.respuesta ? (
                      <View style={{ marginTop: spacing.xs, paddingLeft: spacing.sm, borderLeftWidth: 2, borderLeftColor: colors.primary }}>
                        <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: colors.primary }}>Respuesta del profesional</Text>
                        <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>{item.resena.respuesta}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {!item.resena ? (
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert('Calificar atención', 'Puntuación del 1 al 5', [
                        { text: 'Cancelar', style: 'cancel' },
                        ...[5, 4, 3, 2, 1].map((n) => ({
                          text: `${'★'.repeat(n)}${'☆'.repeat(5 - n)}`,
                          onPress: async () => {
                            try {
                              await api.resenas.crear({ turnoId: item.id, rating: n });
                              loadHistorial(historialPage);
                            } catch (e: unknown) {
                              Alert.alert('Error', e instanceof Error ? e.message : 'Error al calificar');
                            }
                          },
                        })),
                      ]);
                    }}
                    style={{
                      padding: spacing.sm,
                      borderRadius: borderRadius.md,
                      backgroundColor: colors.primary + '12',
                      borderWidth: 1,
                      borderColor: colors.primary + '30',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.primary }}>
                      Calificar consulta
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {!item.evolucion?.contenido && !item.recetaIndicacion && item.archivos?.length === 0 && !item.resena ? (
                  <Text style={{ fontSize: fontSize.sm, color: colors.muted, fontStyle: 'italic' }}>Sin evolución clínica</Text>
                ) : null}
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
        {historialTotalPages > 1 ? (
          <View style={s.row}>
            <SecondaryButton
              title="Anterior"
              onPress={() => loadHistorial(historialPage - 1)}
              disabled={historialPage <= 1}
            />
            <Text style={{ color: colors.text, flex: 1, textAlign: 'center', fontSize: fontSize.sm }}>
              {historialPage} / {historialTotalPages}
            </Text>
            <SecondaryButton
              title="Siguiente"
              onPress={() => loadHistorial(historialPage + 1)}
              disabled={historialPage >= historialTotalPages}
            />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.contentTab, { gap: spacing.md }]}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => {
            if (tab === 'proximos') loadProximos(proximosPage);
            else if (tab === 'pasados') loadPasados(pasadosPage);
            else if (tab === 'lista') loadListaEspera();
            else loadHistorial(historialPage);
          }}
        />
      }
    >
      <SegmentedControl segments={SEGMENTS} selected={tab} onSelect={handleTabChange} />
      <ErrorNotice message={error} />

      {tab === 'lista' ? renderListaEsperaView() : null}
      {tab === 'historial' ? renderHistorialView() : null}
      {tab !== 'lista' && tab !== 'historial'
        ? renderTurnos(
            tab === 'proximos' ? proximos : pasados,
            tab === 'proximos',
            tab === 'proximos' ? proximosPage : pasadosPage,
            tab === 'proximos' ? proximosTotalPages : pasadosTotalPages,
            (p) => (tab === 'proximos' ? loadProximos(p) : loadPasados(p))
          )
        : null}
    </ScrollView>
  );
}

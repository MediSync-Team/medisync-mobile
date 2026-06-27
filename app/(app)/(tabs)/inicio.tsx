import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Spinner, TurnoCard, getSharedStyles } from '../../../src/components/ui';
import { api, type Turno, type PacienteStats } from '../../../src/lib/api';
import { useAuth } from '../../../src/lib/auth-context';
import { spacing, borderRadius, fontSize } from '../../../src/theme';
import { useTheme } from '../../../src/contexts/ThemeContext';

export default function InicioScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const s = getSharedStyles(colors);

  const [loading, setLoading] = useState(true);
  const [proximos, setProximos] = useState<Turno[]>([]);
  const [proximosTotal, setProximosTotal] = useState(0);
  const [stats, setStats] = useState<PacienteStats | null>(null);
  const [recetasCount, setRecetasCount] = useState(0);
  const [certificadosCount, setCertificadosCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [proximosRes, statsData, recetas, certificados] = await Promise.all([
        api.turnos.getMisTurnos({ tipo: 'proximos', page: 1, limit: 5 }),
        api.pacientes.getMisStats(),
        api.pacientes.getMisRecetas().catch(() => [] as any[]),
        api.pacientes.getMisCertificados().catch(() => [] as any[]),
      ]);
      setProximos(proximosRes.turnos || []);
      setProximosTotal(proximosRes.pagination?.total || 0);
      setStats(statsData);
      setRecetasCount(Array.isArray(recetas) ? recetas.length : 0);
      setCertificadosCount(Array.isArray(certificados) ? certificados.length : 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const nextTurno = proximos.find((t) => t.estado === 'RESERVADO' || t.estado === 'CONFIRMADO');
  const diasHastaProximo = nextTurno
    ? Math.ceil((new Date(nextTurno.fechaHora).getTime() - Date.now()) / 86_400_000)
    : null;

  const pacSub = !nextTurno
    ? 'No tenés turnos programados'
    : diasHastaProximo !== null && diasHastaProximo <= 0
      ? 'Tenés un turno hoy'
      : diasHastaProximo === 1
        ? 'Tenés un turno mañana'
        : `Tenés un turno en ${diasHastaProximo} días`;

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <View style={s.contentTab}>
        {loading && !stats ? (
          <Spinner />
        ) : (
          <>
            {/* Hero */}
            <View
              style={{
                padding: spacing.lg,
                borderRadius: borderRadius.xl,
                backgroundColor: colors.primary + '10',
                borderWidth: 1,
                borderColor: colors.primary + '20',
              }}
            >
              <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: colors.primary }}>
                MediSync
              </Text>
              <Text
                style={{
                  fontSize: fontSize.xxxl,
                  fontWeight: '700',
                  color: colors.text,
                  marginTop: spacing.xs,
                }}
              >
                Hola, {user?.paciente?.nombre || 'paciente'}
              </Text>
              <Text
                style={{
                  fontSize: fontSize.sm,
                  color: colors.textSecondary,
                  marginTop: spacing.xs,
                }}
              >
                {pacSub}
              </Text>
            </View>

            {/* Buscar profesionales */}
            <TouchableOpacity
              onPress={() => router.push('/dashboard/paciente')}
              style={{
                padding: spacing.md,
                borderRadius: borderRadius.md,
                backgroundColor: colors.primary,
              }}
            >
              <Text
                style={{
                  color: colors.white,
                  fontWeight: '700',
                  fontSize: fontSize.md,
                  textAlign: 'center',
                }}
              >
                Buscar profesionales
              </Text>
            </TouchableOpacity>

            {/* Próximo turno destacado */}
            {nextTurno ? (
              <View
                style={{
                  borderRadius: borderRadius.xl,
                  borderWidth: 1,
                  borderColor: colors.primary + '20',
                  backgroundColor: colors.surface,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    padding: spacing.sm,
                    backgroundColor: colors.primary + '12',
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSize.xs,
                      fontWeight: '700',
                      color: colors.primary,
                      textAlign: 'center',
                    }}
                  >
                    PRÓXIMO TURNO
                  </Text>
                </View>
                <TurnoCard
                  turno={nextTurno}
                  onPress={() => router.push(`/turno/${nextTurno.id}`)}
                />
                <View style={{ padding: spacing.md, paddingTop: 0 }}>
                  <TouchableOpacity
                    onPress={() => router.push(`/turno/${nextTurno.id}`)}
                    style={{
                      padding: spacing.sm,
                      borderRadius: borderRadius.md,
                      backgroundColor: colors.primary,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.white,
                        fontWeight: '700',
                        fontSize: fontSize.sm,
                        textAlign: 'center',
                      }}
                    >
                      Ver detalle
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* Métricas 2x2 */}
            {stats ? (
              <View style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  {[
                    { label: 'Próximos', value: proximosTotal, color: colors.primary },
                    {
                      label: 'Recetas activas',
                      value: recetasCount,
                      color: '#10B981',
                    },
                  ].map((card) => (
                    <View
                      key={card.label}
                      style={{
                        flex: 1,
                        padding: spacing.md,
                        borderRadius: borderRadius.lg,
                        backgroundColor: card.color + '12',
                        borderWidth: 1,
                        borderColor: card.color + '25',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: fontSize.xxxl,
                          fontWeight: '700',
                          color: card.color,
                        }}
                      >
                        {card.value}
                      </Text>
                      <Text
                        style={{
                          fontSize: fontSize.xs,
                          color: colors.textSecondary,
                          marginTop: spacing.xs,
                        }}
                      >
                        {card.label}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  {[
                    {
                      label: 'Certificados',
                      value: certificadosCount,
                      color: '#3B82F6',
                    },
                    {
                      label: 'Completados',
                      value: stats.completados ?? stats.turnosCompletados,
                      color: '#8B5CF6',
                    },
                  ].map((card) => (
                    <View
                      key={card.label}
                      style={{
                        flex: 1,
                        padding: spacing.md,
                        borderRadius: borderRadius.lg,
                        backgroundColor: card.color + '12',
                        borderWidth: 1,
                        borderColor: card.color + '25',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: fontSize.xxxl,
                          fontWeight: '700',
                          color: card.color,
                        }}
                      >
                        {card.value}
                      </Text>
                      <Text
                        style={{
                          fontSize: fontSize.xs,
                          color: colors.textSecondary,
                          marginTop: spacing.xs,
                        }}
                      >
                        {card.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Profesionales más visitados */}
            {stats && stats.topProfesionales.length > 0 ? (
              <View style={{ gap: spacing.sm }}>
                <Text
                  style={{
                    fontSize: fontSize.md,
                    fontWeight: '700',
                    color: colors.text,
                  }}
                >
                  Profesionales más visitados
                </Text>
                {stats.topProfesionales.slice(0, 5).map((item) => (
                  <TouchableOpacity
                    key={item.profesional?.id}
                    onPress={() => {
                      if (item.profesional?.id)
                        router.push(`/profesional/${item.profesional.id}`);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      padding: spacing.sm,
                      borderRadius: borderRadius.md,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: colors.muted,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: fontSize.md }}>👤</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: fontSize.sm,
                          fontWeight: '600',
                          color: colors.text,
                        }}
                      >
                        {item.profesional?.nombre} {item.profesional?.apellido}
                      </Text>
                      <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                        {item.profesional?.especialidad?.nombre} · {item.totalTurnos} turnos
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </>
        )}
      </View>
    </ScrollView>
  );
}

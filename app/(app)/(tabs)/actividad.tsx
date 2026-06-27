import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { EmptyState, Spinner, getSharedStyles } from '../../../src/components/ui';
import { api, type PacienteStats } from '../../../src/lib/api';
import { spacing, borderRadius, fontSize } from '../../../src/theme';
import { useTheme } from '../../../src/contexts/ThemeContext';

export default function ActividadScreen() {
  const { colors } = useTheme();
  const s = getSharedStyles(colors);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PacienteStats | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.pacientes.getMisStats();
      setStats(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !stats) return <Spinner />;

  if (!stats || stats.totalTurnos === 0) {
    return (
      <ScrollView style={s.screen} contentContainerStyle={s.contentTab}>
        <EmptyState title="Sin actividad aún" subtitle="Reservá tu primer turno para ver estadísticas." />
      </ScrollView>
    );
  }

  const maxMonth = Math.max(...stats.turnosPorMes.map((m) => m.total), 1);

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.contentTab, { gap: spacing.lg }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      {/* Stat cards 2x2 */}
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {[
            { label: 'Total turnos', value: stats.totalTurnos, color: '#3B82F6' },
            { label: 'Completados', value: stats.completados ?? stats.turnosCompletados, color: '#10B981' },
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
              <Text style={{ fontSize: fontSize.xxxl, fontWeight: '700', color: card.color }}>
                {card.value}
              </Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.xs }}>
                {card.label}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {[
            { label: 'Cancelados', value: stats.cancelados ?? stats.turnosCancelados, color: '#EF4444' },
            { label: 'Gasto total', value: `$${stats.totalGastado.toLocaleString('es-AR')}`, color: '#F59E0B' },
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
              <Text style={{ fontSize: fontSize.xxxl, fontWeight: '700', color: card.color }}>
                {card.value}
              </Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.xs }}>
                {card.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bar chart: turnos por mes */}
      {stats.turnosPorMes.length > 0 ? (
        <View
          style={{
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.md }}>
            Turnos por mes
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, height: 120 }}>
            {stats.turnosPorMes.map((item) => {
              const pct = (item.total / maxMonth) * 100;
              return (
                <View key={item.mes} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: fontSize.xs - 1, color: colors.textSecondary, marginBottom: 2 }}>
                    {item.total}
                  </Text>
                  <View
                    style={{
                      width: '100%',
                      height: `${Math.max(pct, 4)}%`,
                      backgroundColor: colors.primary,
                      borderRadius: borderRadius.sm,
                      opacity: 0.8,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: fontSize.xs - 2,
                      color: colors.textSecondary,
                      marginTop: spacing.xs,
                    }}
                  >
                    {item.mes.slice(0, 3)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Top profesionales */}
      {stats.topProfesionales.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.text }}>
            Profesionales más visitados
          </Text>
          {stats.topProfesionales.slice(0, 5).map((item, idx) => (
            <View
              key={item.profesional?.id ?? idx}
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
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.primary + '18',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.primary }}>
                  {idx + 1}
                </Text>
              </View>
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
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>
                  {item.profesional?.nombre} {item.profesional?.apellido}
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                  {item.profesional?.especialidad?.nombre} · {item.totalTurnos} turnos
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* Historial de pagos */}
      {stats.pagos.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.text }}>
            Historial de pagos
          </Text>
          {stats.pagos.map((pago) => (
            <View
              key={pago.id}
              style={{
                padding: spacing.md,
                borderRadius: borderRadius.md,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>
                  {pago.profesional}
                </Text>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.primary }}>
                  ${pago.monto.toLocaleString('es-AR')}
                </Text>
              </View>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.xs }}>
                {pago.especialidad} · {new Date(pago.fecha).toLocaleDateString('es-AR')}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

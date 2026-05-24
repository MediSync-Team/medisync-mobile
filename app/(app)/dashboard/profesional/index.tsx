import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AppHeader, EmptyState, ErrorNotice, PrimaryButton, SecondaryButton, Spinner, TurnoCard, getSharedStyles } from '../../../../src/components/ui';
import { api, type Turno, type TurnoEstado } from '../../../../src/lib/api';
import { useAuth } from '../../../../src/lib/auth-context';
import { useNotifications } from '../../../../src/lib/notifications-context';
import { canTransition } from '../../../../src/lib/utils';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { useLang } from '../../../../src/i18n/context';
import { spacing, borderRadius, fontSize } from '../../../../src/theme';

export default function ProfesionalDashboard() {
  const { colors } = useTheme();
  const s = getSharedStyles(colors);
  const { t } = useLang();
  const { user, logout } = useAuth();
  const { unread } = useNotifications();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const professionalId = user?.profesional?.id;

  const todayRange = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { desde: start.toISOString(), hasta: end.toISOString() };
  }, []);

  const load = useCallback(async () => {
    if (!professionalId) return;
    setLoading(true);
    setError(null);
    try {
      const [agenda] = await Promise.all([
        api.turnos.getByProfesional(professionalId, { page: 1, limit: 20, ...todayRange }),
        api.profesional.getStats().catch(() => null),
      ]);
      setTurnos(agenda.turnos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common', 'error'));
    } finally {
      setLoading(false);
    }
  }, [professionalId, todayRange, t]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmedCount = turnos.filter(t => t.estado === 'CONFIRMADO').length;
  const notifLabel = unread + ' ' + t('professional', 'avisos');

  async function changeEstado(turno: Turno, estado: TurnoEstado) {
    try {
      await api.turnos.updateEstado(turno.id, estado);
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo actualizar el turno.');
    }
  }

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={s.screen}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <AppHeader />

        {/* Greeting */}
        <View>
          <Text style={s.title}>
            {t('professional', 'greeting')} {user?.profesional?.nombre}
          </Text>
          <Text style={s.subtitle}>
            {user?.profesional?.especialidad?.nombre} · {unread > 0 ? notifLabel : t('professional', 'sinAvisos')}
          </Text>
        </View>

        {/* Quick stat pills */}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{
            flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg,
            padding: spacing.md, borderWidth: 1, borderColor: colors.border,
          }}>
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{t('professional', 'todayAppointments')}</Text>
            <Text style={{ fontSize: fontSize.xxl, fontWeight: '700', color: colors.primary }}>{turnos.length}</Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{confirmedCount} {t('professional', 'confirmed')}</Text>
          </View>
          <View style={{
            flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg,
            padding: spacing.md, borderWidth: 1, borderColor: colors.border,
          }}>
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{t('professional', 'notifications')}</Text>
            <Text style={{ fontSize: fontSize.xxl, fontWeight: '700', color: colors.success }}>{unread}</Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{t('professional', 'avisos')}</Text>
          </View>
        </View>

        {/* Navigation shortlinks */}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity
            onPress={() => router.push('/dashboard/profesional/agenda')}
            style={{
              flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg,
              padding: spacing.md, borderWidth: 1, borderColor: colors.border,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 24 }}>📅</Text>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginTop: spacing.xs }}>
              {t('professional', 'agenda')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/dashboard/profesional/disponibilidad')}
            style={{
              flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg,
              padding: spacing.md, borderWidth: 1, borderColor: colors.border,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 24 }}>⏰</Text>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginTop: spacing.xs }}>
              {t('professional', 'myAvailability')}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity
            onPress={() => router.push('/dashboard/profesional/perfil')}
            style={{
              flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg,
              padding: spacing.md, borderWidth: 1, borderColor: colors.border,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 24 }}>👤</Text>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginTop: spacing.xs }}>
              {t('professional', 'profile')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/dashboard/profesional/buscar')}
            style={{
              flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg,
              padding: spacing.md, borderWidth: 1, borderColor: colors.border,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 24 }}>🔍</Text>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginTop: spacing.xs }}>
              Buscar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Today's agenda */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[s.title, { fontSize: fontSize.lg }]}>{t('professional', 'agendaTitle')}</Text>
          <SecondaryButton title={t('professional', 'agenda')} onPress={() => router.push('/dashboard/profesional/agenda')} />
        </View>

        <ErrorNotice message={error} />

        {loading && !turnos.length ? <Spinner /> : null}

        {turnos.map((turno) => (
          <View key={turno.id} style={{ gap: spacing.sm }}>
            <TurnoCard turno={turno} onPress={() => router.push(`/turno/${turno.id}`)} />
            <View style={s.row}>
              {(['CONFIRMADO', 'COMPLETADO', 'AUSENTE', 'CANCELADO'] as TurnoEstado[])
                .filter((next) => canTransition(turno.estado, next))
                .map((next) => (
                  <SecondaryButton key={next} title={next} onPress={() => changeEstado(turno, next)} />
                ))}
            </View>
          </View>
        ))}

        {!turnos.length && !loading ? (
          <EmptyState title={t('professional', 'agendaFree')} subtitle={t('professional', 'agendaFreeDesc')} />
        ) : null}

        <Text style={[s.subtitle, { fontSize: fontSize.xs, textAlign: 'center', marginTop: spacing.md }]}>
          Los campos de riesgo de preconsulta se muestran en el detalle del turno.
        </Text>

        <PrimaryButton title={t('common', 'logout')} onPress={logout} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

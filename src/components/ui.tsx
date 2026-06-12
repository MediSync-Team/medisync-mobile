import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { useNotifications } from '../lib/notifications-context';
import { useTheme } from '../contexts/ThemeContext';
import { colors as lightColors, spacing, fontSize, borderRadius } from '../theme';
import { canJoinVideoCall, estadoColor, fullName, turnoLocation } from '../lib/utils';
import { formatDateTime } from '../lib/date';
import type { Profesional, Turno } from '../lib/api';

export function Spinner({ label = 'Cargando...' }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.muted, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

export function ErrorNotice({ message }: { message?: string | null }) {
  const { colors } = useTheme();
  if (!message) return null;
  return <Text style={[styles.error, { color: colors.error }]}>{message}</Text>;
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.empty, { backgroundColor: colors.background }]}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.muted, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.primary }, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, { color: colors.white }]}>{title}</Text>
    </TouchableOpacity>
  );
}

export function SecondaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
      onPress={onPress}
    >
      <Text style={[styles.secondaryText, { color: colors.primary }]}>{title}</Text>
    </TouchableOpacity>
  );
}

export function EstadoBadge({ estado }: { estado: Turno['estado'] }) {
  return (
    <View style={[styles.badge, { backgroundColor: estadoColor(estado) }]}>
      <Text style={styles.badgeText}>{estado}</Text>
    </View>
  );
}

export function ProfesionalCard({ profesional, onPress }: { profesional: Profesional; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>{fullName(profesional)}</Text>
      <Text style={[styles.muted, { color: colors.textSecondary }]}>{profesional.especialidad?.nombre || 'Especialidad'}</Text>
      <Text style={[styles.muted, { color: colors.textSecondary }]}>
        {profesional.obrasSociales && profesional.obrasSociales.length > 0
          ? (profesional.obrasSociales.length <= 3
              ? profesional.obrasSociales.join(', ')
              : `${profesional.obrasSociales.slice(0, 3).join(', ')}, +${profesional.obrasSociales.length - 3}`)
          : 'Particular'}
      </Text>
      <Text style={[styles.price, { color: colors.primary }]}>${Number(profesional.precioConsulta || 0).toLocaleString()}</Text>
    </TouchableOpacity>
  );
}

export function TurnoCard({ turno, onPress }: { turno: Turno; onPress: () => void }) {
  const { colors } = useTheme();
  const counterpart = turno.profesional || turno.paciente;
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress}>
      <View style={styles.rowBetween}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{fullName(counterpart)}</Text>
        <EstadoBadge estado={turno.estado} />
      </View>
      <Text style={[styles.muted, { color: colors.textSecondary }]}>{formatDateTime(turno.fechaHora)}</Text>
      <Text style={[styles.muted, { color: colors.textSecondary }]}>{turno.modalidad} · {turnoLocation(turno)}</Text>
      {canJoinVideoCall(turno) ? (
        <Text style={[styles.muted, { color: colors.primary, marginTop: 6, fontWeight: '700' }]}>Videoconsulta disponible</Text>
      ) : null}
    </TouchableOpacity>
  );
}

export function AppHeader({ showBack = false, simple = false }: { showBack?: boolean; simple?: boolean }) {
  const router = useRouter();
  const { user } = useAuth();
  const { unread } = useNotifications();
  const { colors } = useTheme();
  const profileRoute = user?.rol === 'PROFESIONAL' ? '/dashboard/profesional/perfil' : '/dashboard/paciente/perfil';

  return (
    <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, backgroundColor: 'transparent' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ fontSize: fontSize.xl, color: colors.primary }}>←</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={{ fontSize: fontSize.xxl, fontWeight: '800', color: colors.primary }}>MediSync</Text>
      </View>
      {simple ? null : (
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.push('/notifications')} style={{ padding: spacing.xs }}>
            <Text style={{ fontSize: fontSize.xl }}>🔔</Text>
            {unread > 0 ? (
              <View style={{ position: 'absolute', top: 0, right: 0, backgroundColor: colors.error, borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.white, fontSize: 10, fontWeight: '700' }}>{unread}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(profileRoute)}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.muted, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
          >
            <Text style={{ fontSize: fontSize.lg }}>👤</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export function getSharedStyles(c: typeof import('../theme').colors) {
  return {
    screen: { flex: 1, backgroundColor: c.background } as const,
    content: { padding: spacing.md, paddingTop: Platform.OS === 'ios' ? spacing.xxl : spacing.lg, gap: spacing.md } as const,
    title: { fontSize: fontSize.xxl, fontWeight: '700' as const, color: c.text },
    subtitle: { fontSize: fontSize.md, color: c.textSecondary },
    input: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      color: c.text,
      fontSize: fontSize.md,
    },
    label: { color: c.text, fontWeight: '600' as const, marginBottom: spacing.xs },
    row: { flexDirection: 'row' as const, gap: spacing.sm, alignItems: 'center' as const },
  };
}

export const sharedStyles = {
  screen: { flex: 1, backgroundColor: lightColors.background } as const,
  content: { padding: spacing.md, paddingTop: Platform.OS === 'ios' ? spacing.xxl : spacing.lg, gap: spacing.md } as const,
  title: { fontSize: fontSize.xxl, fontWeight: '700' as const, color: lightColors.text },
  subtitle: { fontSize: fontSize.md, color: lightColors.textSecondary },
  input: {
    backgroundColor: lightColors.surface,
    borderWidth: 1,
    borderColor: lightColors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: lightColors.text,
    fontSize: fontSize.md,
  },
  label: { color: lightColors.text, fontWeight: '600' as const, marginBottom: spacing.xs },
  row: { flexDirection: 'row' as const, gap: spacing.sm, alignItems: 'center' as const },
};

const styles = StyleSheet.create({
  center: { padding: spacing.lg, alignItems: 'center', gap: spacing.sm },
  empty: { padding: spacing.lg, alignItems: 'center', gap: spacing.xs },
  emptyTitle: { fontWeight: '700', fontSize: fontSize.md },
  muted: { fontSize: fontSize.sm },
  error: { fontSize: fontSize.sm, fontWeight: '600' },
  button: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  disabled: { opacity: 0.55 },
  buttonText: { fontWeight: '700', fontSize: fontSize.md },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  secondaryText: { fontWeight: '700' },
  badge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  badgeText: { color: '#FFFFFF', fontSize: fontSize.xs, fontWeight: '700' },
  card: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: '700', flex: 1 },
  price: { fontWeight: '700', marginTop: spacing.xs },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
});

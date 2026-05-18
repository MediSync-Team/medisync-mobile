import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import { estadoColor, fullName, turnoLocation } from '../lib/utils';
import { formatDateTime } from '../lib/date';
import type { Profesional, Turno } from '../lib/api';

export function Spinner({ label = 'Cargando...' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function ErrorNotice({ message }: { message?: string | null }) {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
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
  return (
    <TouchableOpacity style={[styles.button, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function SecondaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.secondaryButton} onPress={onPress}>
      <Text style={styles.secondaryText}>{title}</Text>
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
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.cardTitle}>{fullName(profesional)}</Text>
      <Text style={styles.muted}>{profesional.especialidad?.nombre || 'Especialidad'}</Text>
      <Text style={styles.muted}>{profesional.obrasSociales?.join(', ') || 'Particular'}</Text>
      <Text style={styles.price}>${Number(profesional.precioConsulta || 0).toLocaleString()}</Text>
    </TouchableOpacity>
  );
}

export function TurnoCard({ turno, onPress }: { turno: Turno; onPress: () => void }) {
  const counterpart = turno.profesional || turno.paciente;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle}>{fullName(counterpart)}</Text>
        <EstadoBadge estado={turno.estado} />
      </View>
      <Text style={styles.muted}>{formatDateTime(turno.fechaHora)}</Text>
      <Text style={styles.muted}>{turno.modalidad} · {turnoLocation(turno)}</Text>
    </TouchableOpacity>
  );
}

export const sharedStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
  },
  label: { color: colors.text, fontWeight: '600', marginBottom: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
});

const styles = StyleSheet.create({
  center: { padding: spacing.lg, alignItems: 'center', gap: spacing.sm },
  empty: { padding: spacing.lg, alignItems: 'center', gap: spacing.xs },
  emptyTitle: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
  muted: { color: colors.textSecondary, fontSize: fontSize.sm },
  error: { color: colors.error, fontSize: fontSize.sm, fontWeight: '600' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  disabled: { opacity: 0.55 },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: fontSize.md },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  secondaryText: { color: colors.primary, fontWeight: '700' },
  badge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  badgeText: { color: colors.white, fontSize: fontSize.xs, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700', flex: 1 },
  price: { color: colors.primary, fontWeight: '700', marginTop: spacing.xs },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
});

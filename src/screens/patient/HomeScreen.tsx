import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../i18n/context';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { t } = useLang();

  return (
    <View style={styles.container}>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          {user?.paciente?.nombre ? `Hola, ${user.paciente.nombre}` : 'Bienvenido'}
        </Text>
        <Text style={styles.greetingSub}>Buscá profesionales y reservá turnos</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionIcon}>🔍</Text>
          <Text style={styles.actionText}>{t('patient', 'searchProfessionals')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionIcon}>📅</Text>
          <Text style={styles.actionText}>{t('patient', 'bookAppointment')}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>{t('common', 'logout')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  greeting: { marginBottom: spacing.xl },
  greetingText: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text },
  greetingSub: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
  quickActions: { flexDirection: 'row', gap: spacing.md },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: { fontSize: 32, marginBottom: spacing.sm },
  actionText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, textAlign: 'center' },
  logoutBtn: { marginTop: 'auto', padding: spacing.md, alignItems: 'center' },
  logoutText: { color: colors.error, fontSize: fontSize.md },
});

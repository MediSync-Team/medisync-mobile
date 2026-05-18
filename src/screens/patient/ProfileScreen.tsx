import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../i18n/context';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { t } = useLang();

  return (
    <View style={styles.container}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>
          {user?.paciente?.nombre?.[0]}{user?.paciente?.apellido?.[0]}
        </Text>
      </View>
      <Text style={styles.name}>
        {user?.paciente?.nombre} {user?.paciente?.apellido}
      </Text>
      <Text style={styles.email}>{user?.email}</Text>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>{t('common', 'logout')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', padding: spacing.lg },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    marginTop: spacing.xl, marginBottom: spacing.md,
  },
  avatarText: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.white },
  name: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text },
  email: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
  logoutBtn: {
    marginTop: spacing.xxl, paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.error,
  },
  logoutText: { color: colors.error, fontSize: fontSize.md, fontWeight: '600' },
});

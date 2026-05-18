import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../i18n/context';
import { AuthStackParamList } from '../../navigation/AuthStack';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

type RoleOption = 'PACIENTE' | 'PROFESIONAL' | 'CLINICA';

const ROLES: { key: RoleOption; labelKey: string }[] = [
  { key: 'PACIENTE', labelKey: 'patient' },
  { key: 'PROFESIONAL', labelKey: 'professional' },
  { key: 'CLINICA', labelKey: 'clinic' },
];

export default function RegisterScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { register } = useAuth();
  const { t } = useLang();
  const [rol, setRol] = useState<RoleOption>('PACIENTE');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nombre.trim() || !apellido.trim() || !email.trim() || !password) {
      Alert.alert(t('common', 'error'), 'Completá todos los campos obligatorios.');
      return;
    }
    setLoading(true);
    try {
      await register({ email, password, rol, nombre, apellido });
    } catch (err: any) {
      Alert.alert(t('auth', 'registerError'), err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>MediSync</Text>
          <Text style={styles.subtitle}>{t('auth', 'register')}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t('auth', 'role')}</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.roleBtn, rol === r.key && styles.roleBtnActive]}
                onPress={() => setRol(r.key)}
              >
                <Text style={[styles.roleBtnText, rol === r.key && styles.roleBtnTextActive]}>
                  {t('auth', r.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t('auth', 'name')}</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
          />

          <Text style={styles.label}>{t('auth', 'lastName')}</Text>
          <TextInput
            style={styles.input}
            value={apellido}
            onChangeText={setApellido}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
          />

          <Text style={styles.label}>{t('auth', 'email')}</Text>
          <TextInput
            style={styles.input}
            placeholder="correo@ejemplo.com"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>{t('auth', 'password')}</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>{t('auth', 'register')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth', 'hasAccount')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>{t('auth', 'login')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing.lg },
  header: { alignItems: 'center', marginVertical: spacing.xl },
  logo: { fontSize: fontSize.xxxl, fontWeight: '700', color: colors.primary },
  subtitle: { fontSize: fontSize.lg, color: colors.textSecondary, marginTop: spacing.xs },
  form: { width: '100%' },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
  roleRow: { flexDirection: 'row', gap: spacing.sm },
  roleBtn: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  roleBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  roleBtnText: { fontSize: fontSize.sm, color: colors.textSecondary },
  roleBtnTextActive: { color: colors.primary, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginVertical: spacing.xl },
  footerText: { color: colors.textSecondary, fontSize: fontSize.sm },
  footerLink: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
});

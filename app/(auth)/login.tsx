import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { ErrorNotice, PrimaryButton, sharedStyles } from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth-context';
import { colors, spacing, fontSize } from '../../src/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!email.trim() || !password) {
      setError('Completá email y contraseña.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={sharedStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[sharedStyles.content, { flexGrow: 1, justifyContent: 'center' }]} keyboardShouldPersistTaps="handled">
        <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
          <Text style={{ fontSize: fontSize.display, fontWeight: '800', color: colors.primary }}>MediSync</Text>
          <Text style={sharedStyles.subtitle}>Ingresá para gestionar tus turnos.</Text>
        </View>
        <Text style={sharedStyles.label}>Email</Text>
        <TextInput style={sharedStyles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="correo@ejemplo.com" />
        <Text style={sharedStyles.label}>Contraseña</Text>
        <TextInput style={sharedStyles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
        <ErrorNotice message={error} />
        <PrimaryButton title={loading ? 'Ingresando...' : 'Ingresar'} onPress={submit} disabled={loading} />
        <Link href="/forgot-password" style={{ color: colors.primary, textAlign: 'center', fontWeight: '600' }}>Olvidé mi contraseña</Link>
        <Link href="/register" style={{ color: colors.primary, textAlign: 'center', fontWeight: '700' }}>Crear cuenta</Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

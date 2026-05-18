import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput } from 'react-native';
import { ErrorNotice, PrimaryButton, sharedStyles } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { colors } from '../../src/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api.auth.forgotPassword(email.trim());
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la recuperación.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={[sharedStyles.content, { flexGrow: 1, justifyContent: 'center' }]}>
      <Text style={sharedStyles.title}>Recuperar contraseña</Text>
      <Text style={sharedStyles.subtitle}>Te enviaremos instrucciones si el email está registrado.</Text>
      <Text style={sharedStyles.label}>Email</Text>
      <TextInput style={sharedStyles.input} autoCapitalize="none" keyboardType="email-address" placeholder="correo@ejemplo.com" value={email} onChangeText={setEmail} />
      <ErrorNotice message={error} />
      {message ? <Text style={{ color: colors.success }}>{message}</Text> : null}
      <PrimaryButton title={loading ? 'Enviando...' : 'Enviar instrucciones'} onPress={submit} disabled={loading} />
      <Link href="/login" style={{ color: colors.primary, textAlign: 'center', fontWeight: '700' }}>Volver al login</Link>
    </ScrollView>
  );
}

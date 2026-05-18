import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ErrorNotice, PrimaryButton, sharedStyles } from '../../src/components/ui';
import { api, type Especialidad, type RegisterData } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth-context';
import { colors, spacing, borderRadius } from '../../src/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [rol, setRol] = useState<RegisterData['rol']>('PACIENTE');
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [especialidadId, setEspecialidadId] = useState('');
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', telefono: '', matricula: '', precioConsulta: '', lugarAtencion: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.especialidades.getAll().then((items) => {
      setEspecialidades(items);
      if (items[0]) setEspecialidadId(items[0].id);
    }).catch(() => undefined);
  }, []);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    if (!form.nombre || !form.apellido || !form.email || !form.password) {
      setError('Completá los campos obligatorios.');
      return;
    }
    if (rol === 'PROFESIONAL' && (!form.matricula || !especialidadId)) {
      setError('Completá matrícula y especialidad.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register({
        rol,
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email.trim(),
        password: form.password,
        telefono: form.telefono || undefined,
        matricula: rol === 'PROFESIONAL' ? form.matricula : undefined,
        especialidadId: rol === 'PROFESIONAL' ? especialidadId : undefined,
        precioConsulta: rol === 'PROFESIONAL' ? Number(form.precioConsulta || 0) : undefined,
        lugarAtencion: rol === 'PROFESIONAL' ? form.lugarAtencion : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={sharedStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={sharedStyles.content} keyboardShouldPersistTaps="handled">
        <Text style={sharedStyles.title}>Crear cuenta</Text>
        <View style={sharedStyles.row}>
          {(['PACIENTE', 'PROFESIONAL'] as const).map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setRol(item)}
              style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: rol === item ? colors.primary : colors.surface, borderWidth: 1, borderColor: colors.border }}
            >
              <Text style={{ color: rol === item ? colors.white : colors.text, textAlign: 'center', fontWeight: '700' }}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {(['nombre', 'apellido', 'email', 'password', 'telefono'] as const).map((key) => (
          <View key={key}>
            <Text style={sharedStyles.label}>{key === 'password' ? 'Contraseña' : key}</Text>
            <TextInput style={sharedStyles.input} value={form[key]} onChangeText={(value) => update(key, value)} secureTextEntry={key === 'password'} autoCapitalize={key === 'email' ? 'none' : undefined} />
          </View>
        ))}
        {rol === 'PROFESIONAL' ? (
          <>
            <Text style={sharedStyles.label}>Especialidad</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {especialidades.map((esp) => (
                <TouchableOpacity key={esp.id} onPress={() => setEspecialidadId(esp.id)} style={{ padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: especialidadId === esp.id ? colors.primary : colors.surface, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: especialidadId === esp.id ? colors.white : colors.text }}>{esp.nombre}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={sharedStyles.label}>Matrícula</Text>
            <TextInput style={sharedStyles.input} value={form.matricula} onChangeText={(value) => update('matricula', value)} />
            <Text style={sharedStyles.label}>Precio consulta</Text>
            <TextInput style={sharedStyles.input} value={form.precioConsulta} onChangeText={(value) => update('precioConsulta', value)} keyboardType="numeric" />
            <Text style={sharedStyles.label}>Lugar de atención</Text>
            <TextInput style={sharedStyles.input} value={form.lugarAtencion} onChangeText={(value) => update('lugarAtencion', value)} />
          </>
        ) : null}
        <ErrorNotice message={error} />
        <PrimaryButton title={loading ? 'Creando...' : 'Crear cuenta'} onPress={submit} disabled={loading} />
        <Link href="/login" style={{ color: colors.primary, textAlign: 'center', fontWeight: '700' }}>Ya tengo cuenta</Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

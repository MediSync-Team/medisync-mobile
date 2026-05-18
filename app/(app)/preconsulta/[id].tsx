import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { ErrorNotice, PrimaryButton, SecondaryButton, Spinner, sharedStyles } from '../../../src/components/ui';
import { api, type PreconsultaInput, type PreconsultaTurno } from '../../../src/lib/api';
import { colors, spacing } from '../../../src/theme';

export default function PreconsultaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [preconsulta, setPreconsulta] = useState<PreconsultaTurno | null>(null);
  const [form, setForm] = useState<PreconsultaInput>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.turnos.getPreconsulta(id)
      .then((data) => {
        setPreconsulta(data);
        setForm({
          motivo: data?.motivo || '',
          sintomas: data?.sintomas || '',
          alergias: data?.alergias || '',
          medicacion: data?.medicacion || '',
          historia: data?.historia || '',
          escalaDolor: data?.escalaDolor ?? null,
          escalaAnsiedad: data?.escalaAnsiedad ?? null,
          temperatura: data?.temperatura ?? null,
          notasPaciente: data?.notasPaciente || '',
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar la preconsulta.'))
      .finally(() => setLoading(false));
  }, [id]);

  function update(key: keyof PreconsultaInput, value: string) {
    const numeric = key === 'escalaDolor' || key === 'escalaAnsiedad' || key === 'temperatura';
    setForm((current) => ({ ...current, [key]: numeric ? (value ? Number(value) : null) : value }));
  }

  async function save() {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.turnos.updatePreconsulta(id, form);
      setPreconsulta(updated);
      Alert.alert('Preconsulta guardada', updated.riesgo ? `Riesgo actualizado: ${updated.riesgo}` : 'Guardada correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <SecondaryButton title="Volver" onPress={() => router.back()} />
      <Text style={sharedStyles.title}>Preconsulta</Text>
      <ErrorNotice message={error} />
      {(['motivo', 'sintomas', 'alergias', 'medicacion', 'historia', 'notasPaciente'] as const).map((key) => (
        <View key={key}>
          <Text style={sharedStyles.label}>{key}</Text>
          <TextInput
            style={[sharedStyles.input, { minHeight: key === 'motivo' ? undefined : 80 }]}
            value={String(form[key] || '')}
            onChangeText={(value) => update(key, value)}
            multiline={key !== 'motivo'}
          />
        </View>
      ))}
      <View style={sharedStyles.row}>
        <TextInput style={[sharedStyles.input, { flex: 1 }]} placeholder="Dolor 0-10" keyboardType="numeric" value={form.escalaDolor == null ? '' : String(form.escalaDolor)} onChangeText={(value) => update('escalaDolor', value)} />
        <TextInput style={[sharedStyles.input, { flex: 1 }]} placeholder="Ansiedad 0-10" keyboardType="numeric" value={form.escalaAnsiedad == null ? '' : String(form.escalaAnsiedad)} onChangeText={(value) => update('escalaAnsiedad', value)} />
      </View>
      <TextInput style={sharedStyles.input} placeholder="Temperatura" keyboardType="numeric" value={form.temperatura == null ? '' : String(form.temperatura)} onChangeText={(value) => update('temperatura', value)} />
      <View style={{ gap: spacing.xs }}>
        <Text style={sharedStyles.label}>Riesgo generado por backend</Text>
        <Text style={{ color: colors.text }}>Riesgo: {preconsulta?.riesgo || 'Sin clasificar'}</Text>
        <Text style={{ color: colors.text }}>Resumen: {preconsulta?.resumen || '-'}</Text>
        <Text style={{ color: colors.text }}>Flags: {preconsulta?.flags?.join(', ') || '-'}</Text>
      </View>
      <PrimaryButton title={saving ? 'Guardando...' : 'Guardar preconsulta'} onPress={save} disabled={saving} />
    </ScrollView>
  );
}

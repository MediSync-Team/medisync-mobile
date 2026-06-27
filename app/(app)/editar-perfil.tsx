import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ErrorNotice, Spinner, getSharedStyles } from '../../src/components/ui';
import { api, type Genero, type Paciente } from '../../src/lib/api';
import { spacing, borderRadius, fontSize } from '../../src/theme';
import { useTheme } from '../../src/contexts/ThemeContext';

const GENEROS = ['NO_ESPECIFICADO', 'MASCULINO', 'FEMENINO', 'OTRO'] as const;

export default function EditarPerfilScreen() {
  const { colors } = useTheme();
  const s = getSharedStyles(colors);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<Paciente>>({});
  const [showGeneros, setShowGeneros] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.pacientes.getPerfil();
      setForm(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar perfil.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function setField(key: keyof Paciente, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'fotoUrl') setImgError(false);
  }

  function validate(): string | null {
    if (!form.nombre?.trim() || !form.apellido?.trim()) return 'Nombre y apellido son requeridos.';
    if (form.telefono && !/^[\d\s\-\+\(\)]{8,20}$/.test(form.telefono)) return 'Teléfono inválido (8-20 dígitos).';
    if (form.dni && !/^\d{7,8}$/.test(form.dni)) return 'DNI inválido (7-8 dígitos).';
    if (form.fechaNacimiento) {
      const d = new Date(form.fechaNacimiento);
      if (isNaN(d.getTime())) return 'Fecha de nacimiento inválida.';
      if (d > new Date()) return 'La fecha de nacimiento no puede ser futura.';
    }
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) { Alert.alert('Error', err); return; }

    setSaving(true);
    setError(null);
    try {
      await api.pacientes.updatePerfil({
        nombre: form.nombre,
        apellido: form.apellido,
        telefono: form.telefono || null,
        genero: (form.genero as Genero) || 'NO_ESPECIFICADO',
        fechaNacimiento: form.fechaNacimiento || null,
        dni: form.dni || null,
        obraSocial: form.obraSocial || null,
        fotoUrl: form.fotoUrl || null,
      });
      setSaved(true);
      setTimeout(() => router.back(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  const hasFoto = form.fotoUrl && !imgError;

  return (
    <ScrollView style={s.screen} contentContainerStyle={[s.content, { gap: spacing.md, paddingBottom: spacing.xxl }]}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary, fontSize: fontSize.md }}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={[s.title, { marginBottom: 0 }]}>Editar Perfil</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={{ color: saving ? colors.muted : colors.primary, fontSize: fontSize.md, fontWeight: '700' }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      </View>

      <ErrorNotice message={error} />

      {saved ? (
        <View style={{ padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: '#10B98112', borderWidth: 1, borderColor: '#10B981' }}>
          <Text style={{ color: '#10B981', fontWeight: '700', textAlign: 'center' }}>✓ Perfil actualizado</Text>
        </View>
      ) : null}

      {/* Foto */}
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: colors.muted,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {hasFoto ? (
            <Image source={{ uri: form.fotoUrl! }} style={{ width: 88, height: 88 }} onError={() => setImgError(true)} />
          ) : (
            <Text style={{ fontSize: fontSize.xxxl }}>
              {form.nombre?.[0]?.toUpperCase() || form.apellido?.[0]?.toUpperCase() || '👤'}
            </Text>
          )}
        </View>
        <TextInput
          value={form.fotoUrl || ''}
          onChangeText={(v) => setField('fotoUrl', v)}
          placeholder="URL de la foto"
          placeholderTextColor={colors.muted}
          style={{
            width: '100%',
            padding: spacing.sm,
            borderRadius: borderRadius.md,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            color: colors.text,
            fontSize: fontSize.sm,
          }}
        />
      </View>

      {/* Nombre */}
      <View>
        <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs }}>Nombre *</Text>
        <TextInput
          value={form.nombre || ''}
          onChangeText={(v) => setField('nombre', v)}
          placeholder="Nombre"
          placeholderTextColor={colors.muted}
          style={{
            padding: spacing.sm,
            borderRadius: borderRadius.md,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            color: colors.text,
            fontSize: fontSize.sm,
          }}
        />
      </View>

      {/* Apellido */}
      <View>
        <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs }}>Apellido *</Text>
        <TextInput
          value={form.apellido || ''}
          onChangeText={(v) => setField('apellido', v)}
          placeholder="Apellido"
          placeholderTextColor={colors.muted}
          style={{
            padding: spacing.sm,
            borderRadius: borderRadius.md,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            color: colors.text,
            fontSize: fontSize.sm,
          }}
        />
      </View>

      {/* Género */}
      <View>
        <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs }}>Género</Text>
        <TouchableOpacity
          onPress={() => setShowGeneros(!showGeneros)}
          style={{
            padding: spacing.sm,
            borderRadius: borderRadius.md,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.text, fontSize: fontSize.sm }}>
            {form.genero || 'Seleccionar...'}
          </Text>
        </TouchableOpacity>
        {showGeneros ? (
          <View style={{ marginTop: spacing.xs, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
            {GENEROS.map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => { setField('genero', g); setShowGeneros(false); }}
                style={{
                  padding: spacing.sm,
                  backgroundColor: form.genero === g ? colors.primary + '18' : colors.surface,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ color: form.genero === g ? colors.primary : colors.text, fontSize: fontSize.sm, fontWeight: form.genero === g ? '700' : '400' }}>
                  {g === 'NO_ESPECIFICADO' ? 'No especificado' : g.charAt(0) + g.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>

      {/* Teléfono */}
      <View>
        <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs }}>Teléfono</Text>
        <TextInput
          value={form.telefono || ''}
          onChangeText={(v) => setField('telefono', v)}
          placeholder="+54 11 1234-5678"
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
          style={{
            padding: spacing.sm,
            borderRadius: borderRadius.md,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            color: colors.text,
            fontSize: fontSize.sm,
          }}
        />
      </View>

      {/* Fecha de nacimiento */}
      <View>
        <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs }}>Fecha de nacimiento</Text>
        <TextInput
          value={form.fechaNacimiento ? form.fechaNacimiento.slice(0, 10) : ''}
          onChangeText={(v) => setField('fechaNacimiento', v)}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.muted}
          style={{
            padding: spacing.sm,
            borderRadius: borderRadius.md,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            color: colors.text,
            fontSize: fontSize.sm,
          }}
        />
      </View>

      {/* DNI */}
      <View>
        <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs }}>DNI</Text>
        <TextInput
          value={form.dni || ''}
          onChangeText={(v) => setField('dni', v)}
          placeholder="12345678"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          maxLength={8}
          style={{
            padding: spacing.sm,
            borderRadius: borderRadius.md,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            color: colors.text,
            fontSize: fontSize.sm,
          }}
        />
      </View>

      {/* Obra Social */}
      <View>
        <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs }}>Obra social</Text>
        <TextInput
          value={form.obraSocial || ''}
          onChangeText={(v) => setField('obraSocial', v)}
          placeholder="Nombre de la obra social"
          placeholderTextColor={colors.muted}
          style={{
            padding: spacing.sm,
            borderRadius: borderRadius.md,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            color: colors.text,
            fontSize: fontSize.sm,
          }}
        />
      </View>

      {/* Botón guardar */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        style={{
          padding: spacing.md,
          borderRadius: borderRadius.md,
          backgroundColor: colors.primary,
          opacity: saving ? 0.6 : 1,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: colors.white, fontWeight: '700', fontSize: fontSize.md }}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ErrorNotice, SecondaryButton, Spinner, getSharedStyles } from '../../../src/components/ui';
import { api, type Paciente, type PacienteStats } from '../../../src/lib/api';
import { useAuth } from '../../../src/lib/auth-context';
import { spacing, borderRadius, fontSize } from '../../../src/theme';
import { useTheme } from '../../../src/contexts/ThemeContext';

type Tab = 'resumen' | 'datos' | 'opciones';

const TABS: { key: Tab; label: string }[] = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'datos', label: 'Datos Médicos' },
  { key: 'opciones', label: 'Opciones' },
];

const DATOS_MEDICOS_FIELDS: { key: keyof Paciente; label: string; placeholder: string }[] = [
  { key: 'antecedentesPersonales', label: 'Antecedentes personales', placeholder: 'Enfermedades previas, cirugías...' },
  { key: 'antecedentesFamiliares', label: 'Antecedentes familiares', placeholder: 'Enfermedades hereditarias...' },
  { key: 'alergias', label: 'Alergias', placeholder: 'Medicamentos, alimentos...' },
  { key: 'medicacionActual', label: 'Medicación actual', placeholder: 'Medicamentos con dosis y frecuencia...' },
  { key: 'habitos', label: 'Habitos', placeholder: 'Tabaco, alcohol, actividad física...' },
  { key: 'diagnosticosPrevios', label: 'Diagnósticos previos', placeholder: 'Diagnósticos confirmados...' },
];

export default function PerfilPaciente() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const s = getSharedStyles(colors);
  const [tab, setTab] = useState<Tab>('resumen');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [stats, setStats] = useState<PacienteStats | null>(null);
  const [perfil, setPerfil] = useState<Paciente | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'resumen') {
        const statsData = await api.pacientes.getMisStats();
        setStats(statsData);
      } else if (tab === 'datos') {
        const data = await api.pacientes.getPerfil();
        setPerfil(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveDatosMedicos() {
    if (!perfil) return;
    setSaving(true);
    try {
      await api.pacientes.updatePerfil({
        antecedentesPersonales: perfil.antecedentesPersonales,
        antecedentesFamiliares: perfil.antecedentesFamiliares,
        alergias: perfil.alergias,
        medicacionActual: perfil.medicacionActual,
        habitos: perfil.habitos,
        diagnosticosPrevios: perfil.diagnosticosPrevios,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudieron guardar los datos.');
    } finally {
      setSaving(false);
    }
  }

  function updateDatosField(key: keyof Paciente, value: string) {
    setPerfil((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function renderResumen() {
    if (!stats) return null;

    return (
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {[
            { label: 'Total turnos', value: stats.totalTurnos, color: colors.primary },
            { label: 'Gasto del mes', value: `$${stats.totalGastado.toLocaleString('es-AR')}`, color: colors.warning },
          ].map((card) => (
            <View key={card.label} style={{ flex: 1, padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: card.color + '15', borderWidth: 1, borderColor: card.color + '30' }}>
              <Text style={{ fontSize: fontSize.xs, color: colors.text }}>{card.label}</Text>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.text }}>{card.value}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {[
            { label: 'Completados', value: stats.completados ?? stats.turnosCompletados, color: '#22c55e' },
            { label: 'Cancelados', value: stats.cancelados ?? stats.turnosCancelados, color: '#EF4444' },
          ].map((card) => (
            <View key={card.label} style={{ flex: 1, padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: card.color + '15', borderWidth: 1, borderColor: card.color + '30' }}>
              <Text style={{ fontSize: fontSize.xs, color: colors.text }}>{card.label}</Text>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.text }}>{card.value}</Text>
            </View>
          ))}
        </View>
        {stats.topProfesionales.length > 0 ? (
          <View style={{ gap: spacing.xs }}>
            <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.text }}>Profesionales más visitados</Text>
            {stats.topProfesionales.slice(0, 5).map((item) => (
              <View key={item.profesional?.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.muted, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: fontSize.sm }}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>{item.profesional?.nombre} {item.profesional?.apellido}</Text>
                  <Text style={{ fontSize: fontSize.xs, color: colors.muted }}>{item.profesional?.especialidad?.nombre} · {item.totalTurnos} turnos</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  function renderDatosMedicos() {
    if (!perfil) return null;
    return (
      <View style={{ gap: spacing.md }}>
        {DATOS_MEDICOS_FIELDS.map((field) => (
          <View key={field.key}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs }}>
              {field.label}
            </Text>
            <TextInput
              value={(perfil[field.key] as string) || ''}
              onChangeText={(v) => updateDatosField(field.key, v)}
              placeholder={field.placeholder}
              placeholderTextColor={colors.muted}
              multiline
              textAlignVertical="top"
              style={{
                padding: spacing.sm,
                borderRadius: borderRadius.md,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                fontSize: fontSize.sm,
                minHeight: 80,
              }}
            />
          </View>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm }}>
          <TouchableOpacity
            onPress={saveDatosMedicos}
            disabled={saving}
            style={{
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.lg,
              borderRadius: borderRadius.md,
              backgroundColor: colors.primary,
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Text style={{ color: colors.white, fontWeight: '700', fontSize: fontSize.sm }}>
              {saving ? 'Guardando...' : 'Guardar datos médicos'}
            </Text>
          </TouchableOpacity>
          {saved ? (
            <Text style={{ color: '#10B981', fontSize: fontSize.sm, fontWeight: '600' }}>
              ✓ Datos guardados
            </Text>
          ) : null}
        </View>
        <Text style={{ fontSize: fontSize.xs, color: colors.muted, lineHeight: 18 }}>
          Esta información es visible para los profesionales que te atiendan en MediSync.
        </Text>
      </View>
    );
  }

  function renderOpciones() {
    return (
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
          <View>
            <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.text }}>Modo oscuro</Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.muted }}>{isDark ? 'Activado' : 'Desactivado'}</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={isDark ? colors.text : colors.muted}
          />
        </View>
        <SecondaryButton title="Cerrar sesión" onPress={logout} />
      </View>
    );
  }

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.contentTab, { paddingBottom: spacing.xxl }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Text style={s.title}>Hola, {user?.paciente?.nombre || 'paciente'}</Text>
      <Text style={[s.subtitle, { marginBottom: spacing.xs }]}>{user?.email}</Text>

      <TouchableOpacity
        onPress={() => router.push('/editar-perfil')}
        style={{
          alignSelf: 'flex-start',
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
          borderRadius: borderRadius.md,
          backgroundColor: colors.primary + '12',
          borderWidth: 1,
          borderColor: colors.primary + '25',
          marginBottom: spacing.md,
        }}
      >
        <Text style={{ color: colors.primary, fontSize: fontSize.xs, fontWeight: '600' }}>Editar perfil</Text>
      </TouchableOpacity>

      <View style={s.row}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={{
              flex: 1,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.xs,
              borderRadius: borderRadius.md,
              backgroundColor: tab === t.key ? colors.primary + '18' : colors.surface,
              borderWidth: 1,
              borderColor: tab === t.key ? colors.primary : colors.border,
            }}
          >
            <Text style={{ color: tab === t.key ? colors.primary : colors.text, textAlign: 'center', fontWeight: '700', fontSize: fontSize.xs }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ErrorNotice message={error} />
      {loading && !stats && !perfil ? <Spinner /> : null}

      {tab === 'resumen' ? renderResumen() : null}
      {tab === 'datos' ? renderDatosMedicos() : null}
      {tab === 'opciones' ? renderOpciones() : null}
    </ScrollView>
  );
}

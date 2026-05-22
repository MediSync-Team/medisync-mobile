import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppHeader, PrimaryButton, getSharedStyles } from '../../../../src/components/ui';
import { api } from '../../../../src/lib/api';
import { useAuth } from '../../../../src/lib/auth-context';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { useLang } from '../../../../src/i18n/context';
import { spacing, borderRadius, fontSize } from '../../../../src/theme';

type Tab = 'perfil' | 'opciones';

const TABS: { key: Tab; label: string }[] = [
  { key: 'perfil', label: 'Perfil' },
  { key: 'opciones', label: 'Opciones' },
];

function PerfilTab() {
  const { colors } = useTheme();
  const s = getSharedStyles(colors);
  const { t } = useLang();
  const { user, refreshUser } = useAuth();
  const prof = user?.profesional;

  const [editing, setEditing] = useState(false);
  const [nombre, setNombre] = useState(prof?.nombre || '');
  const [apellido, setApellido] = useState(prof?.apellido || '');
  const [telefono, setTelefono] = useState(prof?.telefono || '');
  const [bio, setBio] = useState(prof?.bio || '');
  const [precio, setPrecio] = useState(String(prof?.precioConsulta || ''));
  const [lugar, setLugar] = useState(prof?.lugarAtencion || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!prof?.id) return;
    setSaving(true);
    try {
      await api.profesional.updatePerfil(prof.id, {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim() || null,
        bio: bio.trim() || undefined,
        precioConsulta: parseFloat(precio) || 0,
        lugarAtencion: lugar.trim() || undefined,
      });
      await refreshUser();
      setEditing(false);
      Alert.alert('', t('professional', 'profileSaved'));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ gap: spacing.md }}>
      {editing ? (
        <View style={{ gap: spacing.sm, width: '100%' }}>
          <TextInput
            style={s.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder={t('auth', 'name')}
            placeholderTextColor={colors.textSecondary}
          />
          <TextInput
            style={s.input}
            value={apellido}
            onChangeText={setApellido}
            placeholder={t('auth', 'lastName')}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      ) : null}

      <View>
        <Text style={s.label}>{t('professional', 'phone')}</Text>
        <TextInput
          style={s.input}
          value={telefono}
          onChangeText={setTelefono}
          placeholder="+54 9 11 ..."
          placeholderTextColor={colors.textSecondary}
          editable={editing}
          keyboardType="phone-pad"
        />
      </View>

      <View>
        <Text style={s.label}>{t('professional', 'location')}</Text>
        <TextInput
          style={s.input}
          value={lugar}
          onChangeText={setLugar}
          placeholder={t('professional', 'locationOptional')}
          placeholderTextColor={colors.textSecondary}
          editable={editing}
        />
      </View>

      <View>
        <Text style={s.label}>{t('professional', 'price')}</Text>
        <TextInput
          style={s.input}
          value={precio}
          onChangeText={setPrecio}
          placeholder="$0"
          placeholderTextColor={colors.textSecondary}
          editable={editing}
          keyboardType="numeric"
        />
      </View>

      <View>
        <Text style={s.label}>{t('professional', 'bio')}</Text>
        <TextInput
          style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]}
          value={bio}
          onChangeText={setBio}
          placeholder={t('professional', 'bio')}
          placeholderTextColor={colors.textSecondary}
          multiline
          editable={editing}
        />
      </View>

      {editing ? (
        <PrimaryButton title={saving ? t('common', 'loading') : t('professional', 'saveProfile')} onPress={handleSave} disabled={saving} />
      ) : (
        <PrimaryButton title={t('professional', 'editProfile')} onPress={() => setEditing(true)} />
      )}
    </View>
  );
}

function OpcionesTab() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t } = useLang();
  const { logout } = useAuth();

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: spacing.md, borderRadius: borderRadius.md,
        backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      }}>
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

      <TouchableOpacity
        onPress={logout}
        style={{
          padding: spacing.md, alignItems: 'center',
          borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.error,
        }}
      >
        <Text style={{ color: colors.error, fontSize: fontSize.md, fontWeight: '600' }}>{t('common', 'logout')}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ProfesionalPerfil() {
  const { colors } = useTheme();
  const s = getSharedStyles(colors);
  const { user } = useAuth();
  const prof = user?.profesional;
  const [tab, setTab] = useState<Tab>('perfil');

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content}>
        <AppHeader showBack simple />

        {/* Avatar + name */}
        <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
            marginBottom: spacing.md,
          }}>
            <Text style={{ fontSize: fontSize.xxl, fontWeight: '700', color: colors.white }}>
              {prof?.nombre?.[0]}{prof?.apellido?.[0]}
            </Text>
          </View>
          <Text style={[s.title, { textAlign: 'center' }]}>
            Dr/a. {prof?.nombre} {prof?.apellido}
          </Text>
          <Text style={[s.subtitle, { textAlign: 'center' }]}>{prof?.especialidad?.nombre}</Text>
          <Text style={[s.subtitle, { textAlign: 'center', color: colors.textSecondary }]}>{user?.email}</Text>
        </View>

        {/* Tabs */}
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

        {tab === 'perfil' ? <PerfilTab /> : null}
        {tab === 'opciones' ? <OpcionesTab /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

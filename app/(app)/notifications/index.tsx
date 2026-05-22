import { useState } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { AppHeader, EmptyState, Spinner, getSharedStyles } from '../../../src/components/ui';
import { useAuth } from '../../../src/lib/auth-context';
import { useNotifications } from '../../../src/lib/notifications-context';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { spacing, borderRadius, fontSize } from '../../../src/theme';

type Tab = 'notificaciones' | 'opciones';

const TABS: { key: Tab; label: string }[] = [
  { key: 'notificaciones', label: 'Notificaciones' },
  { key: 'opciones', label: 'Opciones' },
];

function NotificacionesTab() {
  const { colors } = useTheme();
  const s = getSharedStyles(colors);
  const { notifications, unread, isLoading, markRead, markAllRead } = useNotifications();
  const [marking, setMarking] = useState(false);

  async function handleMarkAllRead() {
    setMarking(true);
    try {
      await markAllRead();
    } catch {
      Alert.alert('Error', 'No se pudo marcar.');
    } finally {
      setMarking(false);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await markRead(id);
    } catch {
      // silent
    }
  }

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={s.title}>Notificaciones</Text>
        {unread > 0 ? (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            disabled={marking}
            style={{ padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.primary + '18' }}
          >
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize.sm }}>
              {marking ? '...' : 'Marcar todas leídas'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {isLoading && !notifications.length ? <Spinner /> : null}

      {!notifications.length && !isLoading ? (
        <EmptyState title="Sin notificaciones" subtitle="No tenés avisos nuevos." />
      ) : (
        notifications.map((notif) => (
          <TouchableOpacity
            key={notif.id}
            onPress={() => { if (!notif.leida) handleMarkRead(notif.id); }}
            style={{
              padding: spacing.md,
              borderRadius: borderRadius.md,
              backgroundColor: notif.leida ? colors.surface : colors.primary + '08',
              borderWidth: 1,
              borderColor: notif.leida ? colors.border : colors.primary + '20',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={{ fontSize: fontSize.md, fontWeight: notif.leida ? '400' : '700', color: colors.text, flex: 1 }}>
                {notif.titulo}
              </Text>
              {!notif.leida ? (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 }} />
              ) : null}
            </View>
            <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
              {notif.cuerpo}
            </Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.muted, marginTop: spacing.xs }}>
              {new Date(notif.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </>
  );
}

function OpcionesTab() {
  const { colors, isDark, toggleTheme } = useTheme();
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
        <Text style={{ color: colors.error, fontSize: fontSize.md, fontWeight: '600' }}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function NotificacionesPage() {
  const { colors } = useTheme();
  const s = getSharedStyles(colors);
  const [tab, setTab] = useState<Tab>('notificaciones');

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
    >
      <AppHeader showBack simple />

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

      {tab === 'notificaciones' ? <NotificacionesTab /> : null}
      {tab === 'opciones' ? <OpcionesTab /> : null}
    </ScrollView>
  );
}

import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AppHeader, EmptyState, Spinner, getSharedStyles } from '../../../src/components/ui';
import { useNotifications } from '../../../src/lib/notifications-context';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { spacing, borderRadius, fontSize } from '../../../src/theme';

export default function NotificacionesPage() {
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
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <AppHeader showBack simple />

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
    </ScrollView>
  );
}

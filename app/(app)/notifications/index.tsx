import { router } from 'expo-router';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AppHeader, EmptyState, SecondaryButton, Spinner, sharedStyles } from '../../../src/components/ui';
import { useNotifications } from '../../../src/lib/notifications-context';
import { colors, spacing, borderRadius } from '../../../src/theme';

export default function NotificationsScreen() {
  const { notifications, unread, isLoading, refresh, markRead, markAllRead } = useNotifications();

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}>
      <AppHeader showBack simple />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={sharedStyles.title}>Notificaciones</Text>
          <Text style={sharedStyles.subtitle}>{unread} sin leer</Text>
        </View>
        <SecondaryButton title="Marcar todas" onPress={markAllRead} />
      </View>
      {isLoading && !notifications.length ? <Spinner /> : null}
      {notifications.map((notif) => (
        <TouchableOpacity
          key={notif.id}
          onPress={() => markRead(notif.id)}
          style={{
            backgroundColor: notif.leida ? colors.surface : '#EFF6FF',
            borderWidth: 1,
            borderColor: notif.leida ? colors.border : colors.primaryLight,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            gap: spacing.xs,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: '800' }}>{notif.titulo}</Text>
          <Text style={{ color: colors.textSecondary }}>{notif.mensaje || notif.cuerpo}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{new Date(notif.createdAt).toLocaleString()}</Text>
        </TouchableOpacity>
      ))}
      {!notifications.length && !isLoading ? <EmptyState title="Sin notificaciones" /> : null}
    </ScrollView>
  );
}

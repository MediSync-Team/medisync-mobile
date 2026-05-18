import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { useLang } from '../i18n/context';
import DashboardScreen from '../screens/admin/DashboardScreen';

export type AdminTabParamList = {
  AdminDashboard: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = { Dashboard: '📊' };
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.emoji, focused && styles.emojiFocused]}>{icons[label] || '•'}</Text>
    </View>
  );
}

export default function AdminTabs() {
  const { t } = useLang();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={DashboardScreen}
        options={{
          title: t('admin', 'dashboard'),
          tabBarIcon: ({ focused }) => <TabIcon label="Dashboard" focused={focused} />,
          headerTitle: 'MediSync Admin',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIcon: { alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 22, opacity: 0.5 },
  emojiFocused: { opacity: 1 },
});

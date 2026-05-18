import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { useLang } from '../i18n/context';
import DashboardScreen from '../screens/professional/DashboardScreen';
import AgendaScreen from '../screens/professional/AgendaScreen';
import ProfileScreen from '../screens/professional/ProfileScreen';

export type ProfessionalTabParamList = {
  ProfDashboard: undefined;
  ProfAgenda: undefined;
  ProfProfile: undefined;
};

const Tab = createBottomTabNavigator<ProfessionalTabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = { Dashboard: '📊', Agenda: '📅', Perfil: '👤' };
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.emoji, focused && styles.emojiFocused]}>{icons[label] || '•'}</Text>
    </View>
  );
}

export default function ProfessionalTabs() {
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
        name="ProfDashboard"
        component={DashboardScreen}
        options={{
          title: t('professional', 'dashboard'),
          tabBarIcon: ({ focused }) => <TabIcon label="Dashboard" focused={focused} />,
          headerTitle: 'MediSync',
        }}
      />
      <Tab.Screen
        name="ProfAgenda"
        component={AgendaScreen}
        options={{
          title: t('professional', 'agenda'),
          tabBarIcon: ({ focused }) => <TabIcon label="Agenda" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfProfile"
        component={ProfileScreen}
        options={{
          title: t('professional', 'profile'),
          tabBarIcon: ({ focused }) => <TabIcon label="Perfil" focused={focused} />,
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

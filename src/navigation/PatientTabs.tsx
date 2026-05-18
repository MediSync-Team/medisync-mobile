import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { useLang } from '../i18n/context';
import HomeScreen from '../screens/patient/HomeScreen';
import AppointmentsScreen from '../screens/patient/AppointmentsScreen';
import ProfileScreen from '../screens/patient/ProfileScreen';

export type PatientTabParamList = {
  PatientHome: undefined;
  PatientAppointments: undefined;
  PatientProfile: undefined;
};

const Tab = createBottomTabNavigator<PatientTabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = { Inicio: '🏠', Turnos: '📅', Perfil: '👤' };
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.emoji, focused && styles.emojiFocused]}>{icons[label] || '•'}</Text>
    </View>
  );
}

export default function PatientTabs() {
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
        name="PatientHome"
        component={HomeScreen}
        options={{
          title: t('patient', 'home'),
          tabBarIcon: ({ focused }) => <TabIcon label="Inicio" focused={focused} />,
          headerTitle: 'MediSync',
        }}
      />
      <Tab.Screen
        name="PatientAppointments"
        component={AppointmentsScreen}
        options={{
          title: t('patient', 'appointments'),
          tabBarIcon: ({ focused }) => <TabIcon label="Turnos" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="PatientProfile"
        component={ProfileScreen}
        options={{
          title: t('patient', 'profile'),
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

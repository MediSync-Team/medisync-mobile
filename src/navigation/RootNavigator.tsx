import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { colors } from '../theme';
import AuthStack from './AuthStack';
import PatientTabs from './PatientTabs';
import ProfessionalTabs from './ProfessionalTabs';
import ClinicTabs from './ClinicTabs';
import AdminTabs from './AdminTabs';

export type RootStackParamList = {
  Auth: undefined;
  PatientDashboard: undefined;
  ProfessionalDashboard: undefined;
  ClinicDashboard: undefined;
  AdminDashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated, isLoading, userRole } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : userRole === 'PACIENTE' ? (
          <Stack.Screen name="PatientDashboard" component={PatientTabs} />
        ) : userRole === 'PROFESIONAL' ? (
          <Stack.Screen name="ProfessionalDashboard" component={ProfessionalTabs} />
        ) : userRole === 'CLINICA' ? (
          <Stack.Screen name="ClinicDashboard" component={ClinicTabs} />
        ) : userRole === 'ADMIN' ? (
          <Stack.Screen name="AdminDashboard" component={AdminTabs} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
});

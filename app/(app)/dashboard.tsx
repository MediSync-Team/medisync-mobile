import { Redirect } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';

export default function DashboardRouter() {
  const { userRole } = useAuth();
  if (userRole === 'PACIENTE') return <Redirect href="/dashboard/paciente" />;
  if (userRole === 'PROFESIONAL') return <Redirect href="/dashboard/profesional" />;
  if (userRole === 'CLINICA') return <Redirect href="/dashboard/clinica" />;
  if (userRole === 'ADMIN') return <Redirect href="/dashboard/admin" />;
  return <Redirect href="/login" />;
}

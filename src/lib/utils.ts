import type { Turno, TurnoEstado } from './api';

export function fullName(person?: { nombre?: string; apellido?: string } | null) {
  return [person?.nombre, person?.apellido].filter(Boolean).join(' ') || 'Sin nombre';
}

export function turnoLocation(turno: Turno) {
  return turno.lugarAtencion || turno.profesional?.lugarAtencion || 'Ubicación a confirmar';
}

export function canTransition(current: TurnoEstado, next: TurnoEstado) {
  if (next === 'CANCELADO') return current === 'RESERVADO' || current === 'CONFIRMADO';
  if (current === 'RESERVADO') return next === 'CONFIRMADO';
  if (current === 'CONFIRMADO') return next === 'COMPLETADO' || next === 'AUSENTE';
  return false;
}

export function estadoColor(estado: TurnoEstado) {
  switch (estado) {
    case 'CONFIRMADO':
      return '#10B981';
    case 'COMPLETADO':
      return '#2563EB';
    case 'CANCELADO':
      return '#EF4444';
    case 'AUSENTE':
      return '#F59E0B';
    default:
      return '#64748B';
  }
}

export function canJoinVideoCall(turno: Turno) {
  const modalidad = turno.modalidad?.toUpperCase();
  const esVirtual = modalidad === 'VIRTUAL' || modalidad === 'AMBOS';
  return esVirtual && (turno.estado === 'RESERVADO' || turno.estado === 'CONFIRMADO');
}

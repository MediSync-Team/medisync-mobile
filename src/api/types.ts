export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export type Genero = 'MASCULINO' | 'FEMENINO' | 'OTRO' | 'NO_ESPECIFICADO';
export type Rol = 'PROFESIONAL' | 'PACIENTE' | 'ADMIN' | 'CLINICA';
export type TurnoEstado = 'RESERVADO' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO' | 'AUSENTE';
export type Modalidad = 'PRESENCIAL' | 'VIRTUAL' | 'AMBOS';
export type TipoDescuento = 'PORCENTAJE' | 'MONTO_FIJO';
export type PlanProfesional = 'FREE' | 'PRO';
export type TipoCertificado = 'REPOSO' | 'CONSULTA' | 'APTITUD' | 'LIBRE';
export type InvitacionEstado = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'EXPIRADA';
export type Riesgo = 'BAJO' | 'MEDIO' | 'ALTO' | 'URGENTE';

export interface User {
  id: string;
  email: string;
  rol: Rol;
  profesional?: Profesional;
  paciente?: Paciente;
  clinica?: Clinica;
}

export interface AuthResponse {
  token?: string;
  user: {
    id: string;
    email: string;
    rol: Rol;
    perfil?: Profesional | Paciente;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  rol: 'PROFESIONAL' | 'PACIENTE' | 'CLINICA';
  nombre: string;
  apellido: string;
  telefono?: string;
  genero?: Genero;
  matricula?: string;
  especialidadId?: string;
  precioConsulta?: number;
  lugarAtencion?: string;
  bio?: string;
  fotoUrl?: string;
}

export interface Especialidad {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
}

export interface Profesional {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  genero: Genero;
  precioConsulta: number;
  matricula?: string | null;
  bio?: string;
  lugarAtencion?: string | null;
  obrasSociales?: string[];
  fotoUrl?: string | null;
  activo?: boolean;
  clinicaId?: string | null;
  especialidad: Especialidad;
  disponibilidades?: Disponibilidad[];
  ratingPromedio?: number | null;
  totalResenas?: number;
}

export interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string | null;
  genero?: Genero;
  fotoUrl?: string | null;
  fechaNacimiento?: string | null;
  obrasSociales?: string[];
  dni?: string | null;
  obraSocial?: string | null;
  antecedentesPersonales?: string;
  antecedentesFamiliares?: string;
  alergias?: string;
  medicacionActual?: string;
  habitos?: string;
  diagnosticosPrevios?: string;
  notasClinicasGenerales?: string;
}

export interface Clinica {
  id: string;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
}

export interface Disponibilidad {
  id: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  modalidad: Modalidad;
  lugarAtencion?: string;
  activo: boolean;
}

export interface Slot {
  hora: string;
  disponible: boolean;
  lugarAtencion?: string | null;
}

export interface Turno {
  id: string;
  pacienteId: string;
  profesionalId: string;
  fechaHora: string;
  duracionMin: number;
  estado: TurnoEstado;
  modalidad: 'PRESENCIAL' | 'VIRTUAL';
  motivo?: string;
  precio: number;
  cuponId?: string;
  createdAt: string;
  updatedAt: string;
  lugarAtencion?: string | null;
  preconsultaRiesgo?: string;
  preconsultaCompletadaAt?: string;
  notasCancelacion?: string;
  paciente?: Paciente | null;
  profesional?: Profesional;
  preconsulta?: PreconsultaTurno;
  evolucion?: Evolucion | null;
  recetaIndicacion?: RecetaIndicacion | null;
  certificado?: CertificadoConDatos | { id: string; tipo: TipoCertificado; emitidaAt?: string } | null;
  archivos?: ArchivoTurno[];
  pago?: Pago | null;
  resena?: Resena;
}

export interface TurnosPaginatedResponse {
  turnos: Turno[];
  total?: number;
  page?: number;
  limit?: number;
  pagination: { total: number; totalPages: number; page: number; limit: number };
}

export interface ProfesionalesPaginatedResponse {
  profesionales: Profesional[];
  total?: number;
  page?: number;
  limit?: number;
  pagination: { total: number; totalPages: number; page: number; limit: number };
}

export interface PreconsultaTurno {
  id: string;
  turnoId: string;
  motivo?: string;
  sintomas?: string;
  alergias?: string;
  medicacion?: string;
  historia?: string;
  completadaAt?: string;
  riesgo?: Riesgo;
  escalaDolor?: number | null;
  escalaAnsiedad?: number | null;
  inicioSintomas?: string | null;
  temperatura?: number | null;
  notasPaciente?: string | null;
  aiGenerated?: boolean;
  resumen?: string;
  flags?: string[];
}

export interface PreconsultaInput {
  motivo?: string;
  sintomas?: string;
  alergias?: string;
  medicacion?: string;
  historia?: string;
  escalaDolor?: number | null;
  escalaAnsiedad?: number | null;
  inicioSintomas?: string | null;
  temperatura?: number | null;
  notasPaciente?: string | null;
}

export interface RecetaIndicacion {
  id: string;
  turnoId: string;
  diagnostico: string;
  indicaciones: string;
  planTratamiento?: string;
  medicamentos?: string | null;
  estudiosSolicitados?: string | null;
  proximoControl?: string | null;
  advertencias?: string | null;
  observaciones?: string | null;
  emitidaAt: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RecetaIndicacionInput {
  diagnostico: string;
  indicaciones: string;
  planTratamiento?: string;
  medicamentos?: string;
  estudiosSolicitados?: string;
  proximoControl?: string;
  advertencias?: string;
  observaciones?: string;
}

export interface Evolucion {
  id: string;
  turnoId: string;
  contenido: string;
  createdAt: string;
}

export interface HistorialPaginatedResponse {
  turnos: Turno[];
  total?: number;
  page?: number;
  limit?: number;
  pagination: { total: number; totalPages: number; page: number; limit: number };
}

export interface PacienteStats {
  totalTurnos: number;
  turnosCompletados: number;
  turnosCancelados: number;
  completados: number;
  cancelados: number;
  totalGastado: number;
  turnosPorMes: { mes: string; total: number }[];
  topProfesionales: { profesional: Profesional | null; totalTurnos: number }[];
  pagos: PacientePago[];
}

export interface PacientePago {
  id: string;
  monto: number;
  fecha: string;
  profesional: string;
  especialidad: string;
  mpPaymentId?: string | null;
}

export interface RecetaPaciente {
  id: string;
  turnoId: string;
  fechaHora: string;
  receta: {
    diagnostico: string;
    medicamentos?: string | null;
    indicaciones: string;
    planTratamiento?: string;
    estudiosSolicitados?: string;
    proximoControl?: string | null;
    advertencias?: string;
    observaciones?: string;
    emitidaAt: string;
  };
  profesional: { nombre: string; apellido: string; especialidad: string; fotoUrl?: string | null };
}

export interface CertificadoPaciente {
  id: string;
  turnoId: string;
  fechaHora: string;
  certificado: {
    id: string;
    turnoId: string;
    tipo: TipoCertificado;
    diagnostico: string;
    texto: string;
    diasReposo?: number;
    emitidaAt: string;
    createdAt: string;
  };
  profesional: { nombre: string; apellido: string; especialidad?: { nombre: string } | string };
}

export interface Pago {
  id: string;
  turnoId: string;
  monto: number;
  montoNeto: number;
  comisionPorcentaje: number;
  mpPaymentId?: string;
  estado: string;
  metodo?: string;
  fechaPago?: string;
  createdAt: string;
  turno: Turno;
}

export interface PagosDashboardResponse {
  pagos: Pago[];
  total?: number;
  page?: number;
  limit?: number;
  mesesResumen: { mes: string; bruto: number; neto: number; cantidad: number }[];
  totales: { bruto: number; neto: number; pendiente: number; aprobados: number; pendientes: number };
  pagination: { total: number; totalPages?: number; page?: number; limit?: number; pages?: number };
}

export interface PagoEstado {
  estado: string | null;
  monto?: number;
  necesitaPago?: boolean;
  initPoint?: string | null;
}

export interface PagoPreferenciaResponse {
  initPoint?: string;
  necesitaPago?: boolean;
  mensaje?: string;
}

export interface SuscripcionEstado {
  plan: PlanProfesional;
  estado: string;
  fechaInicio?: string;
  fechaVencimiento?: string;
  planVenceAt?: string;
  turnosEsteMes: number;
  limiteTurnos: number;
  turnosRestantes?: number;
}

export interface Cupon {
  id: string;
  codigo: string;
  tipo: TipoDescuento;
  valor: number;
  descripcion?: string;
  maxUsos?: number;
  usosActuales: number;
  activo: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface CuponValidado {
  cuponId: string;
  tipo: string;
  valor: number;
  descripcion: string | null;
  montoOriginal: number;
  montoDescuento: number;
  montoFinal: number;
}

export interface Notificacion {
  id: string;
  usuarioId: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  usuarioId?: string;
  tipo: string;
  titulo: string;
  mensaje?: string;
  cuerpo: string;
  link?: string | null;
  leida: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  notifEmail?: boolean;
  notifWhatsapp?: boolean;
  aceptaRecordatorios?: boolean;
  notifRecordatorio24h?: boolean;
  notifRecordatorio2h?: boolean;
  notifPush?: boolean;
  pushTurno?: boolean;
  pushPago?: boolean;
  pushRecordatorio?: boolean;
  pushCancelacion?: boolean;
  pushReceta?: boolean;
  pushChat?: boolean;
}

export interface RecordatorioTurno {
  id: string;
  fechaHora: string;
  paciente?: { nombre: string; apellido: string };
  profesional?: { nombre: string; apellido: string };
  estado: string;
  modalidad: string;
}

export interface AuditoriaDisponibilidad {
  id: string;
  tipoEvento: string;
  profesionalId: string;
  disponibilidadId?: string;
  turnoId?: string;
  datosAnteriores?: Record<string, unknown>;
  datosNuevos?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditoriaPaginatedResponse {
  auditoria: AuditoriaDisponibilidad[];
  data?: AuditoriaDisponibilidad[];
  total: number;
  page: number;
  limit: number;
  meta?: { total: number };
}

export interface StatsResponse {
  turnosPorMes: {
    mes: string;
    total: number;
    completados: number;
    cancelados: number;
    ausentes: number;
  }[];
  ingresosPorMes: {
    mes: string;
    bruto: number;
    neto: number;
  }[];
  resumen: {
    totalTurnos: number;
    totalPacientes: number;
  };
}

export interface HistoriaClinicaEditableFields {
  motivo?: string;
  diagnostico?: string;
  tratamiento?: string;
  observaciones?: string;
  antecedentesPersonales?: string;
  antecedentesFamiliares?: string;
  alergias?: string;
  medicacionActual?: string;
  habitos?: string;
  diagnosticosPrevios?: string;
  notasClinicasGenerales?: string;
}

export interface HistoriaClinicaPaciente {
  paciente: Paciente & HistoriaClinicaEditableFields;
  resumen: {
    totalConsultas: number;
    consultasCompletadas: number;
    ultimaConsulta: string | null;
  };
  timeline: {
    id: string;
    fechaHora: string;
    modalidad: string;
    estado: string;
    profesional: { id: string; nombre: string; apellido: string; especialidad: string };
    evolucion: (Evolucion & { updatedAt?: string }) | null;
    archivos: ArchivoTurno[];
  }[];
}

export interface TurnoPaciente {
  id: string;
  fechaHora: string;
  estado: string;
  modalidad: string;
  precio: number;
  profesional?: { nombre: string; apellido: string; especialidad: { nombre: string } };
  preconsulta?: PreconsultaTurno;
  resena?: Resena;
}

export interface ArchivoTurno {
  id: string;
  turnoId?: string;
  tipo?: string;
  url?: string;
  nombreOriginal?: string;
  tamanoBytes?: number;
  mimeType?: string;
  createdAt?: string;
}

export interface BloqueoDisponibilidad {
  id: string;
  profesionalId: string;
  fechaInicio: string;
  fechaFin: string;
  horaInicio?: string;
  horaFin?: string;
  motivo?: string;
  createdAt: string;
}

export interface CertificadoConDatos {
  id: string;
  turnoId: string;
  tipo: TipoCertificado;
  datos?: Record<string, string>;
  diagnostico: string;
  texto: string;
  diasReposo?: number;
  contenido?: string;
  emitidaAt?: string;
  createdAt: string;
  turno: {
    fechaHora: string;
    modalidad: string;
    profesional: {
      nombre: string;
      apellido: string;
      especialidad: { nombre: string };
      matricula?: string | null;
      telefono?: string | null;
      fotoUrl?: string | null;
      lugarAtencion?: string | null;
    };
    paciente?: (Partial<Paciente> & { dni?: string | null; fechaNacimiento?: string | null; obraSocial?: string | null }) | null;
  };
}

export interface ChatMensaje {
  id: string;
  turnoId?: string;
  remitenteId: string;
  contenido: string;
  createdAt: string;
  leidoAt?: string | null;
}

export interface ListaEsperaItem {
  id: string;
  profesionalId: string;
  fecha: string;
  modalidad: string;
  estado: string;
  profesional?: { nombre: string; apellido: string; especialidad?: { nombre: string } };
}

export interface Resena {
  id: string;
  pacienteId: string;
  profesionalId: string;
  turnoId: string;
  rating: number;
  comentario?: string;
  respuesta?: string;
  respondidaAt?: string;
  createdAt: string;
  paciente?: { nombre: string; apellido: string; fotoUrl?: string };
  turno?: { fechaHora: string };
}

export interface ResenasStats {
  promedio: number | null;
  total: number;
  distribucion?: Record<string, number>;
}

export interface AdminStats {
  totalUsuarios: number;
  totalProfesionales: number;
  totalPacientes: number;
  totalTurnos: number;
  totalEspecialidades: number;
  totalResenas: number;
  ingresosAprobados: number;
  turnosUltimos30: number;
  registrosUltimos30: number;
  turnosPorEstado: Record<string, number>;
}

export interface AdminAnalytics {
  revenueTotal: number;
  comisionesTotal: number;
  tasaCompletado: number;
  tasaCancelacion: number;
  revenueByMonth: { month: string; revenue: number }[];
  turnosByMonth: { month: string; count: number }[];
  turnosPorEspecialidad: { especialidad: string; count: number }[];
  topProfesionales: { id: string; nombre: string; apellido: string; especialidad: string; completados: number; revenue: number }[];
}

export interface AdminUsuario {
  id: string;
  email: string;
  rol: string;
  createdAt: string;
  profesional?: AdminProfesional;
  paciente?: Paciente;
}

export interface AdminProfesional {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  especialidad: Especialidad;
  precioConsulta: number;
  ratingPromedio: number | null;
  totalResenas: number;
  activo: boolean;
  usuario: { email: string };
  _count: { turnos: number };
}

export interface AdminTurno {
  id: string;
  fechaHora: string;
  estado: string;
  modalidad: string;
  profesional: { nombre: string; apellido: string; especialidad: { nombre: string } };
  paciente?: { nombre: string; apellido: string };
  pago?: { monto: number };
}

export interface ClinicaConRelaciones {
  id: string;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  profesionales: Profesional[];
  invitaciones: InvitacionClinica[];
}

export interface ClinicaStats {
  turnosHoy: number;
  turnosMes: number;
  ingresosMes: number;
  profesionalesActivos: number;
  cancelacionesMes: number;
}

export interface ClinicaAgendaTurno {
  id: string;
  fechaHora: string;
  estado: string;
  modalidad: string;
  paciente?: { nombre: string; apellido: string };
  profesional: { nombre: string; apellido: string; especialidad?: { nombre: string } };
}

export interface InvitacionClinica {
  id: string;
  email: string;
  estado: InvitacionEstado;
  expiresAt: string;
  createdAt: string;
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  eventos: string[];
  activo: boolean;
}

export interface WebhookEvento {
  id: string;
  tipo: string;
  payload: Record<string, unknown>;
  exito: boolean;
  respuestaHttp?: number;
  createdAt: string;
}

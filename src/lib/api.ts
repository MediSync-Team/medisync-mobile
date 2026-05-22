import * as SecureStore from 'expo-secure-store';
import type {
  AuthResponse,
  LoginData,
  RegisterData,
  User,
  Especialidad,
  ProfesionalesPaginatedResponse,
  Profesional,
  Disponibilidad,
  Slot,
  TurnosPaginatedResponse,
  Turno,
  TurnoEstado,
  PreconsultaTurno,
  PreconsultaInput,
  PagoEstado,
  PagoPreferenciaResponse,
  InAppNotification,
  StatsResponse,
  PacienteStats,
  ListaEsperaItem,
  BloqueoDisponibilidad,
  SuscripcionEstado,
  Resena,
  ResenasStats,
  Cupon,
  TipoDescuento,
  Pago,
} from '../api/types';

export type * from '../api/types';

export const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
export const TOKEN_KEY = 'token';

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
};

export async function getToken() {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers = new Headers(options.headers as HeadersInit);
  const hasBody = options.body !== undefined && options.body !== null;

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (hasBody && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }

  const body = await response.text();
  if (!body.trim()) {
    if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
    return undefined as T;
  }

  let payload: ApiEnvelope<T>;
  try {
    payload = JSON.parse(body) as ApiEnvelope<T>;
  } catch {
    throw new Error('Respuesta inválida del servidor.');
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.error?.message || `Error HTTP ${response.status}`);
  }

  return payload.data as T;
}

function query(params: Record<string, string | number | boolean | undefined | null>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') q.set(key, String(value));
  });
  const text = q.toString();
  return text ? `?${text}` : '';
}

export const api = {
  auth: {
    login: (data: LoginData) => fetchApi<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: RegisterData) => fetchApi<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => fetchApi<User>('/auth/me'),
    forgotPassword: (email: string) =>
      fetchApi<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    logout: () => fetchApi<{ logged_out: boolean }>('/auth/logout', { method: 'POST' }),
  },
  especialidades: {
    getAll: () => fetchApi<Especialidad[]>('/especialidades'),
  },
  profesionales: {
    getAll: (params?: {
      especialidad?: string;
      precioMin?: string;
      precioMax?: string;
      modalidad?: string;
      obraSocial?: string;
      page?: number;
      limit?: number;
    }) => fetchApi<ProfesionalesPaginatedResponse>(`/profesionales${query(params ?? {})}`),
    getById: (id: string) => fetchApi<Profesional>(`/profesionales/${id}`),
    getSlots: (id: string, fecha: string, modalidad: 'PRESENCIAL' | 'VIRTUAL') =>
      fetchApi<Slot[]>(`/profesionales/${id}/slots-disponibles${query({ fecha, modalidad })}`),
    crearDisponibilidad: (id: string, data: { diaSemana: number; horaInicio: string; horaFin: string; modalidad: 'PRESENCIAL' | 'VIRTUAL' | 'AMBOS'; lugarAtencion?: string }) =>
      fetchApi<Disponibilidad>(`/profesionales/${id}/disponibilidad`, { method: 'POST', body: JSON.stringify(data) }),
    eliminarDisponibilidad: (id: string, dispId: string) =>
      fetchApi<void>(`/profesionales/${id}/disponibilidad/${dispId}`, { method: 'DELETE' }),
  },
  turnos: {
    getMisTurnos: (params?: { tipo?: 'proximos' | 'pasados'; estado?: string; page?: number; limit?: number }) =>
      fetchApi<TurnosPaginatedResponse>(`/turnos/mis-turnos${query(params ?? {})}`),
    getByProfesional: (id: string, params?: { page?: number; limit?: number; desde?: string; hasta?: string }) =>
      fetchApi<TurnosPaginatedResponse>(`/turnos/profesional/${id}${query(params ?? {})}`),
    getById: (id: string) => fetchApi<Turno>(`/turnos/${id}`),
    updateEstado: (id: string, estado: TurnoEstado, notasCancelacion?: string) =>
      fetchApi<Turno>(`/turnos/${id}`, { method: 'PATCH', body: JSON.stringify({ estado, notasCancelacion }) }),
    reservar: (data: { profesionalId: string; fechaHora: string; modalidad: 'PRESENCIAL' | 'VIRTUAL' }) =>
      fetchApi<{ turno: Turno; linkPago: null }>('/turnos/reservar', { method: 'POST', body: JSON.stringify(data) }),
    reprogramar: (id: string, data: { fechaHora: string; modalidad?: 'PRESENCIAL' | 'VIRTUAL' }) =>
      fetchApi<Turno>(`/turnos/${id}/reprogramar`, { method: 'POST', body: JSON.stringify(data) }),
    getPreconsulta: (id: string) => fetchApi<PreconsultaTurno>(`/turnos/${id}/preconsulta`),
    updatePreconsulta: (id: string, data: PreconsultaInput) =>
      fetchApi<PreconsultaTurno>(`/turnos/${id}/preconsulta`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  pagos: {
    crearPreferencia: (data: { turnoId: string; cuponCodigo?: string }) =>
      fetchApi<PagoPreferenciaResponse>('/pagos/crear-preferencia', { method: 'POST', body: JSON.stringify(data) }),
    getEstado: (turnoId: string) => fetchApi<PagoEstado>(`/pagos/estado/${turnoId}`),
  },
  notifications: {
    getInbox: () => fetchApi<{ notifs: InAppNotification[]; unread: number }>('/notifications/inbox'),
    markRead: (id: string) => fetchApi<void>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => fetchApi<void>('/notifications/read-all', { method: 'PATCH' }),
  },
  obrasSociales: {
    getAll: () => fetchApi<string[]>('/obras-sociales'),
  },
  pacientes: {
    getMisStats: () => fetchApi<PacienteStats>('/pacientes/mis-stats'),
    getMisRecetas: () =>
      fetchApi<{ id: string; turnoId: string; fechaHora: string; receta: { diagnostico: string; medicamentos?: string | null; indicaciones: string }; profesional: { nombre: string; apellido: string; especialidad: string } }[]>('/pacientes/mis-recetas'),
    getMisCertificados: () => fetchApi<{ id: string; turnoId: string; fechaHora: string; certificado: { id: string; tipo: string; emitidaAt: string }; profesional: { nombre: string; apellido: string; especialidad?: { nombre: string } | string } }[]>('/pacientes/mis-certificados'),
  },
  listaEspera: {
    misSuscripciones: () => fetchApi<ListaEsperaItem[]>('/lista-espera/mis-suscripciones'),
    cancelar: (id: string) => fetchApi<void>(`/lista-espera/${id}`, { method: 'DELETE' }),
  },

  bloqueos: {
    getMisBloqueos: () => fetchApi<BloqueoDisponibilidad[]>('/bloqueos'),
    crear: (data: { fechaInicio: string; fechaFin: string; horaInicio?: string; horaFin?: string; motivo?: string }) =>
      fetchApi<BloqueoDisponibilidad>('/bloqueos', { method: 'POST', body: JSON.stringify(data) }),
    eliminar: (id: string) => fetchApi<void>(`/bloqueos/${id}`, { method: 'DELETE' }),
  },

  profesional: {
    updatePerfil: (id: string, data: Partial<Profesional>) =>
      fetchApi<Profesional>(`/profesionales/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getStats: () => fetchApi<StatsResponse>('/profesional/stats'),
    getPagos: (params?: { desde?: string; hasta?: string; estado?: string; page?: number; limit?: number }) =>
      fetchApi<{ pagos: Pago[]; totales: { bruto: number; neto: number; pendiente: number; aprobados: number; pendientes: number }; mesesResumen: { mes: string; bruto: number; neto: number; cantidad: number }[] }>(
        `/profesional/pagos${query(params ?? {})}`
      ),
    getMisObrasSociales: () => fetchApi<{ obrasSociales: string[] }>('/profesional/obras-sociales'),
  },

  suscripciones: {
    estado: () => fetchApi<SuscripcionEstado>('/suscripciones/estado'),
    iniciar: () => fetchApi<{ initPoint: string }>('/suscripciones/iniciar', { method: 'POST' }),
    cancelar: () => fetchApi<{ cancelada: boolean }>('/suscripciones/cancelar', { method: 'POST' }),
  },

  cupones: {
    listar: () => fetchApi<Cupon[]>('/cupones'),
    crear: (data: { codigo: string; tipo: TipoDescuento; valor: number; descripcion?: string; maxUsos?: number; expiresAt?: string }) =>
      fetchApi<Cupon>('/cupones', { method: 'POST', body: JSON.stringify(data) }),
    actualizar: (id: string, data: Partial<Cupon>) =>
      fetchApi<Cupon>(`/cupones/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    eliminar: (id: string) => fetchApi<void>(`/cupones/${id}`, { method: 'DELETE' }),
  },

  resenas: {
    getMisResenas: (params?: { page?: number; limit?: number; rating?: number }) =>
      fetchApi<{ resenas: Resena[]; stats: ResenasStats; pagination: { page: number; totalPages: number; total: number } }>(
        '/resenas/mis-resenas' + query(params ?? {})
      ),
    responder: (id: string, respuesta: string) =>
      fetchApi<Resena>(`/resenas/${id}/respuesta`, { method: 'PATCH', body: JSON.stringify({ respuesta }) }),
    borrarRespuesta: (id: string) => fetchApi<Resena>(`/resenas/${id}/respuesta`, { method: 'DELETE' }),
  },
};

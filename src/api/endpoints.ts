import { fetchApi, buildQuery } from './client';
import type * as T from './types';

export const api = {
  auth: {
    login: (data: T.LoginData) =>
      fetchApi<T.AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: T.RegisterData) =>
      fetchApi<T.AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => fetchApi<T.User>('/auth/me'),
    exchangeCode: (code: string) =>
      fetchApi<{ token?: string; dest: string }>('/auth/exchange-code', { method: 'POST', body: JSON.stringify({ code }) }),
    logout: () =>
      fetchApi<{ logged_out: boolean }>('/auth/logout', { method: 'POST' }),
  },

  especialidades: {
    getAll: () => fetchApi<T.Especialidad[]>('/especialidades'),
  },

  profesionales: {
    getAll: (params?: {
      especialidad?: string; precioMin?: string; precioMax?: string;
      modalidad?: string; fecha?: string; disponibleEstaSemana?: string;
      obraSocial?: string; orderBy?: string; page?: string; limit?: string;
    }) => fetchApi<T.ProfesionalesPaginatedResponse>('/profesionales' + buildQuery(params ?? {})),
    getById: (id: string) => fetchApi<T.Profesional>(`/profesionales/${id}`),
    getSlots: (id: string, fecha: string, modalidad: string) =>
      fetchApi<T.Slot[]>(`/profesionales/${id}/slots-disponibles?fecha=${fecha}&modalidad=${modalidad}`),
    crearDisponibilidad: (id: string, data: { diaSemana: number; horaInicio: string; horaFin: string; modalidad: 'PRESENCIAL' | 'VIRTUAL' | 'AMBOS'; lugarAtencion?: string }) =>
      fetchApi<T.Disponibilidad>(`/profesionales/${id}/disponibilidad`, { method: 'POST', body: JSON.stringify(data) }),
    eliminarDisponibilidad: (id: string, dispId: string) =>
      fetchApi<void>(`/profesionales/${id}/disponibilidad/${dispId}`, { method: 'DELETE' }),
  },

  turnos: {
    getAll: (params?: { page?: number; limit?: number }) =>
      fetchApi<T.TurnosPaginatedResponse>('/turnos' + buildQuery(params ?? {})),
    getMisTurnos: (params?: { tipo?: string; estado?: string; page?: number; limit?: number }) =>
      fetchApi<T.TurnosPaginatedResponse>('/turnos/mis-turnos' + buildQuery(params ?? {})),
    getByProfesional: (id: string, params?: Record<string, string | number | boolean | undefined>) =>
      fetchApi<T.TurnosPaginatedResponse>(`/turnos/profesional/${id}${buildQuery(params ?? {})}`),
    getById: (id: string) => fetchApi<T.Turno>(`/turnos/${id}`),
    updateEstado: (id: string, estado: T.TurnoEstado, notasCancelacion?: string) =>
      fetchApi<T.Turno>(`/turnos/${id}`, { method: 'PATCH', body: JSON.stringify({ estado, notasCancelacion }) }),
    reprogramar: (id: string, data: { fechaHora: string; modalidad?: 'PRESENCIAL' | 'VIRTUAL' }) =>
      fetchApi<T.Turno>(`/turnos/${id}/reprogramar`, { method: 'POST', body: JSON.stringify(data) }),
    reservar: (data: { profesionalId: string; fechaHora: string; modalidad: 'PRESENCIAL' | 'VIRTUAL' }) =>
      fetchApi<{ turno: T.Turno; linkPago: null }>('/turnos/reservar', { method: 'POST', body: JSON.stringify(data) }),
    getPoliticaCancelacion: () => fetchApi<{ horasMinimas: number }>('/turnos/politica-cancelacion'),
    getEvolucion: (id: string) => fetchApi<T.Evolucion | null>(`/turnos/${id}/evolucion`),
    guardarEvolucion: (id: string, contenido: string) =>
      fetchApi<T.Evolucion>(`/turnos/${id}/evolucion`, { method: 'POST', body: JSON.stringify({ contenido }) }),
    getPreconsulta: (id: string) => fetchApi<T.PreconsultaTurno>(`/turnos/${id}/preconsulta`),
    updatePreconsulta: (id: string, data: T.PreconsultaInput) =>
      fetchApi<T.PreconsultaTurno>(`/turnos/${id}/preconsulta`, { method: 'PUT', body: JSON.stringify(data) }),
    getVideoToken: (id: string) => fetchApi<{ ticket: string; roomId: string; iceServers?: T.IceServer[] }>(`/turnos/${id}/video-token`),
    getReceta: (id: string) => fetchApi<T.RecetaIndicacion | null>(`/turnos/${id}/receta`),
    guardarReceta: (id: string, data: T.RecetaIndicacionInput) =>
      fetchApi<{ receta: T.RecetaIndicacion; shareText: string }>(`/turnos/${id}/receta`, { method: 'POST', body: JSON.stringify(data) }),
    miHistorial: (params?: { page?: number; limit?: number }) =>
      fetchApi<T.HistorialPaginatedResponse>('/turnos/mi-historial' + buildQuery(params ?? {})),
    getAuditoriaCancelacion: (id: string) =>
      fetchApi<T.AuditoriaDisponibilidad | null>(`/turnos/${id}/auditoria-cancelacion`),
  },

  pagos: {
    getByProfesional: (params?: { desde?: string; hasta?: string; estado?: string; page?: number; limit?: number }) =>
      fetchApi<T.PagosDashboardResponse>('/profesional/pagos' + buildQuery(params ?? {})),
    getEstado: (turnoId: string) => fetchApi<T.PagoEstado>(`/pagos/estado/${turnoId}`),
    crearPreferencia: (data: { turnoId: string; cuponCodigo?: string }) =>
      fetchApi<T.PagoPreferenciaResponse>('/pagos/crear-preferencia', { method: 'POST', body: JSON.stringify(data) }),
    confirmarPago: (turnoId: string) =>
      fetchApi<{ confirmed: boolean; estado: string | null }>(`/pagos/confirmar-pago?turnoId=${turnoId}`, { method: 'POST' }),
  },

  pacientes: {
    updatePerfil: (data: Partial<T.Paciente>) =>
      fetchApi<T.Paciente>('/pacientes/perfil', { method: 'PUT', body: JSON.stringify(data) }),
    getPerfil: () => fetchApi<T.Paciente & {
      antecedentesPersonales?: string; antecedentesFamiliares?: string;
      alergias?: string; medicacionActual?: string; habitos?: string;
      diagnosticosPrevios?: string; notasClinicasGenerales?: string;
    }>('/pacientes/perfil'),
    getHistorial: () => fetchApi<{ turnos: T.TurnoPaciente[] }>('/pacientes/mi-historial'),
    updateHistoriaClinica: (pacienteId: string, data: Partial<T.HistoriaClinicaEditableFields>) =>
      fetchApi<T.HistoriaClinicaEditableFields & { id: string; updatedAt: string }>(
        `/pacientes/${pacienteId}/historia-clinica`, { method: 'PUT', body: JSON.stringify(data) }
      ),
    getHistoriaClinica: (pacienteId: string) =>
      fetchApi<T.HistoriaClinicaPaciente>(`/pacientes/${pacienteId}/historia-clinica`),
    getMisStats: () => fetchApi<T.PacienteStats>('/pacientes/mis-stats'),
    getMisRecetas: () => fetchApi<{ recetas: T.RecetaPaciente[] }>('/pacientes/mis-recetas'),
    getMisCertificados: () => fetchApi<{ certificados: T.CertificadoPaciente[] }>('/pacientes/mis-certificados'),
  },

  profesional: {
    updatePerfil: (id: string, data: Partial<T.Profesional>) =>
      fetchApi<T.Profesional>(`/profesionales/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getPagos: (params?: { desde?: string; hasta?: string; estado?: string; page?: number; limit?: number }) =>
      fetchApi<T.PagosDashboardResponse>('/profesional/pagos' + buildQuery(params ?? {})),
    getAuditoria: (id: string, params?: { page?: number; limit?: number; tipoEvento?: string; desde?: string; hasta?: string }) =>
      fetchApi<T.AuditoriaPaginatedResponse>(`/profesionales/${id}/auditoria${buildQuery(params ?? {})}`),
    getStats: () => fetchApi<T.StatsResponse>('/profesional/stats'),
    getMisObrasSociales: () => fetchApi<{ obrasSociales: string[] }>('/profesional/obras-sociales'),
  },

  suscripciones: {
    estado: () => fetchApi<T.SuscripcionEstado>('/suscripciones/estado'),
    iniciar: () => fetchApi<{ initPoint: string }>('/suscripciones/iniciar', { method: 'POST' }),
    cancelar: () => fetchApi<{ cancelada: boolean }>('/suscripciones/cancelar', { method: 'POST' }),
  },

  cupones: {
    getAll: () => fetchApi<T.Cupon[]>('/cupones'),
    listar: () => fetchApi<T.Cupon[]>('/cupones'),
    crear: (data: { codigo: string; tipo: T.TipoDescuento; valor: number; descripcion?: string; maxUsos?: number; expiresAt?: string }) =>
      fetchApi<T.Cupon>('/cupones', { method: 'POST', body: JSON.stringify(data) }),
    actualizar: (id: string, data: Partial<T.Cupon>) =>
      fetchApi<T.Cupon>(`/cupones/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    eliminar: (id: string) => fetchApi<void>(`/cupones/${id}`, { method: 'DELETE' }),
    validar: (codigo: string, turnoId: string) =>
      fetchApi<T.CuponValidado>('/cupones/validar', { method: 'POST', body: JSON.stringify({ codigo, turnoId }) }),
  },

  notificaciones: {
    getUnreadCount: () => fetchApi<{ count: number }>('/notificaciones/unread-count'),
    getAll: () => fetchApi<T.Notificacion[]>('/notificaciones'),
    marcarLeida: (id: string) => fetchApi<T.Notificacion>(`/notificaciones/${id}/leer`, { method: 'POST' }),
    marcarTodasLeidas: () => fetchApi<{ updated: number }>('/notificaciones/marcar-todas-leidas', { method: 'POST' }),
  },

  bloqueos: {
    getMisBloqueos: () => fetchApi<T.BloqueoDisponibilidad[]>('/bloqueos'),
    crear: (data: { fechaInicio: string; fechaFin: string; horaInicio?: string; horaFin?: string; motivo?: string }) =>
      fetchApi<T.BloqueoDisponibilidad>('/bloqueos', { method: 'POST', body: JSON.stringify(data) }),
    eliminar: (id: string) => fetchApi<void>(`/bloqueos/${id}`, { method: 'DELETE' }),
  },

  certificados: {
    getByTurno: (turnoId: string) => fetchApi<T.CertificadoConDatos>(`/certificados/turno/${turnoId}`),
    emitir: (data: { turnoId: string; tipo: T.TipoCertificado; diagnostico: string; texto: string; diasReposo?: number }) =>
      fetchApi<T.CertificadoConDatos>('/certificados', { method: 'POST', body: JSON.stringify(data) }),
  },

  archivos: {
    getByTurno: (turnoId: string) => fetchApi<T.ArchivoTurno[]>(`/archivos/turno/${turnoId}`),
    subir: (turnoId: string, formData: FormData) =>
      fetchApi<T.ArchivoTurno>(`/archivos/${turnoId}`, { method: 'POST', body: formData }),
    eliminar: (id: string) => fetchApi<{ deleted: boolean }>(`/archivos/${id}`, { method: 'DELETE' }),
  },

  chat: {
    getUnread: (turnoId: string) => fetchApi<{ count: number }>(`/chat/${turnoId}/unread`),
    getMensajes: (turnoId: string) =>
      fetchApi<{ id: string; remitenteId: string; contenido: string; createdAt: string }[]>(`/chat/${turnoId}`),
    enviar: (turnoId: string, contenido: string) =>
      fetchApi<T.ChatMensaje>(`/chat/${turnoId}`, { method: 'POST', body: JSON.stringify({ contenido }) }),
  },

  google: {
    getStatus: () => fetchApi<{ connected: boolean }>('/google/status'),
    getAuthUrl: () => fetchApi<{ url: string }>('/google/auth-url'),
    disconnect: () => fetchApi<void>('/google/disconnect', { method: 'DELETE' }),
  },

  resenas: {
    getByProfesional: (profesionalId: string, params?: { page?: number; limit?: number }) =>
      fetchApi<{ resenas: T.Resena[]; stats: T.ResenasStats; pagination: { page: number; totalPages: number; total: number } }>(
        `/resenas/profesional/${profesionalId}${buildQuery(params ?? {})}`
      ),
    getMisResenas: (params?: { page?: number; limit?: number; rating?: number }) =>
      fetchApi<{ resenas: T.Resena[]; stats: T.ResenasStats; pagination: { page: number; totalPages: number; total: number } }>(
        '/resenas/mis-resenas' + buildQuery(params ?? {})
      ),
    getMiResena: (turnoId: string) => fetchApi<T.Resena | null>(`/resenas/mi-resena/${turnoId}`),
    crear: (data: { turnoId: string; rating: number; comentario?: string }) =>
      fetchApi<T.Resena>('/resenas', { method: 'POST', body: JSON.stringify(data) }),
    responder: (id: string, respuesta: string) =>
      fetchApi<T.Resena>(`/resenas/${id}/respuesta`, { method: 'PATCH', body: JSON.stringify({ respuesta }) }),
    borrarRespuesta: (id: string) => fetchApi<T.Resena>(`/resenas/${id}/respuesta`, { method: 'DELETE' }),
  },

  admin: {
    getStats: () => fetchApi<T.AdminStats>('/admin/stats'),
    getAnalytics: () => fetchApi<T.AdminAnalytics>('/admin/analytics'),
    getUsuarios: (params?: { page?: number; limit?: number; search?: string }) =>
      fetchApi<{ usuarios: T.AdminUsuario[]; pagination: { page: number; totalPages: number; total: number; limit: number } }>(
        '/admin/usuarios' + buildQuery(params ?? {})
      ),
    toggleActivo: (id: string) => fetchApi<{ activo: boolean }>(`/admin/usuarios/${id}/toggle-activo`, { method: 'PATCH' }),
    getProfesionales: (params?: { page?: number; limit?: number; search?: string }) =>
      fetchApi<{ profesionales: T.AdminProfesional[]; pagination: { page: number; totalPages: number; total: number; limit: number } }>(
        '/admin/profesionales' + buildQuery(params ?? {})
      ),
    getTurnos: (params?: { page?: number; limit?: number; search?: string; estado?: string }) =>
      fetchApi<{ turnos: T.AdminTurno[]; pagination: { page: number; totalPages: number; total: number; limit: number } }>(
        '/admin/turnos' + buildQuery(params ?? {})
      ),
    crearEspecialidad: (data: { nombre: string; descripcion?: string; icono?: string }) =>
      fetchApi<T.Especialidad>('/admin/especialidades', { method: 'POST', body: JSON.stringify(data) }),
    editarEspecialidad: (id: string, data: { nombre: string; descripcion?: string; icono?: string }) =>
      fetchApi<T.Especialidad>(`/admin/especialidades/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    eliminarEspecialidad: (id: string) => fetchApi<void>(`/admin/especialidades/${id}`, { method: 'DELETE' }),
  },

  listaEspera: {
    misSuscripciones: () => fetchApi<T.ListaEsperaItem[]>('/lista-espera/mis-suscripciones'),
    suscribirme: (data: { profesionalId: string; fecha: string; modalidad: string }) =>
      fetchApi<T.ListaEsperaItem>('/lista-espera/suscribirme', { method: 'POST', body: JSON.stringify(data) }),
    cancelar: (id: string) => fetchApi<void>(`/lista-espera/${id}`, { method: 'DELETE' }),
  },

  notifications: {
    getPreferences: () => fetchApi<T.NotificationPreferences>('/notifications/preferences'),
    updatePreferences: (data: Partial<T.NotificationPreferences>) =>
      fetchApi<T.NotificationPreferences>('/notifications/preferences', { method: 'PUT', body: JSON.stringify(data) }),
    getInbox: () => fetchApi<{ notifs: T.InAppNotification[]; unread: number }>('/notifications/inbox'),
    markRead: (id: string) => fetchApi<void>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => fetchApi<void>('/notifications/read-all', { method: 'PATCH' }),
  },

  recordatorios: {
    getProfesional: () => fetchApi<{ turnos: T.RecordatorioTurno[] }>('/recordatorios/profesional'),
    getPaciente: () => fetchApi<{ turnos: T.RecordatorioTurno[] }>('/recordatorios/paciente'),
  },
};

export const clinicasApi = {
  getMe: () => fetchApi<T.ClinicaConRelaciones>('/clinicas/me'),
  updateMe: (data: Partial<T.ClinicaConRelaciones>) =>
    fetchApi<T.ClinicaConRelaciones>('/clinicas/me', { method: 'PUT', body: JSON.stringify(data) }),
  getStats: () => fetchApi<T.ClinicaStats>('/clinicas/me/stats'),
  getAgenda: (fecha: string) => fetchApi<T.ClinicaAgendaTurno[]>(`/clinicas/me/agenda?fecha=${fecha}`),
  invitar: (email: string) =>
    fetchApi<{ id: string; email: string; expiresAt: string }>('/clinicas/me/invitar', { method: 'POST', body: JSON.stringify({ email }) }),
  cancelarInvitacion: (id: string) =>
    fetchApi<{ cancelled: boolean }>(`/clinicas/me/invitaciones/${id}`, { method: 'DELETE' }),
  removerProfesional: (id: string) =>
    fetchApi<{ removed: boolean }>(`/clinicas/me/profesionales/${id}`, { method: 'DELETE' }),
  getInvitacion: (token: string) =>
    fetchApi<T.InvitacionClinica & { clinica: Pick<T.Clinica, 'nombre' | 'descripcion' | 'logoUrl' | 'direccion'> }>(
      `/clinicas/invitaciones/${token}`
    ),
  aceptarInvitacion: (token: string) =>
    fetchApi<{ accepted: boolean; clinica: string }>(`/clinicas/invitaciones/${token}/aceptar`, { method: 'POST' }),
  rechazarInvitacion: (token: string) =>
    fetchApi<{ rejected: boolean }>(`/clinicas/invitaciones/${token}/rechazar`, { method: 'POST' }),
};

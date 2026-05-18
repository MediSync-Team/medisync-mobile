import * as SecureStore from 'expo-secure-store';

export const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

const TOKEN_KEY = 'auth_token';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T> | null> {
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = await response.text();
  if (!body.trim()) return null;
  if (!isJson) return null;
  try {
    return JSON.parse(body) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error: { code: 'INVALID_JSON', message: 'Respuesta inválida del servidor' },
    };
  }
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const hasBody = options.body !== undefined && options.body !== null;
  const headers = new Headers(options.headers);

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (hasBody && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const data = await parseApiResponse<T>(response);

    if (!response.ok) {
      throw new Error(data?.error?.message || `Error HTTP ${response.status}`);
    }

    if (!data?.success) {
      throw new Error(data?.error?.message || 'Error desconocido');
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('No se pudo conectar con el servidor. Verificá la conexión.');
    }
    throw error;
  }
}

export function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  const q = new URLSearchParams();
  for (const [k, v] of entries) {
    q.set(k, String(v));
  }
  return '?' + q.toString();
}

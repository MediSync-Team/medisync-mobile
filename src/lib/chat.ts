import { API_BASE } from './api';

/** A unified chat row: either a text message (ChatMensaje) or a shared file (Archivo). */
export type ChatItem =
  | { kind: 'text'; id: string; senderId?: string; text: string; at: string }
  | { kind: 'file'; id: string; senderId?: string; name: string; url: string; mime?: string; at: string };

/** Resolve an `/uploads/...` (or already-absolute) file URL against the API origin. */
export function resolveUploadUrl(url?: string): string {
  if (!url) return '';
  if (/^https?:\/\//.test(url)) return url;
  const origin = API_BASE.replace(/\/api\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** Merge dedupe + chronological sort for chat items. */
export function sortChatItems(items: ChatItem[]): ChatItem[] {
  return [...items].sort((a, b) => a.at.localeCompare(b.at));
}

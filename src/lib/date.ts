export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function combineLocalDateTimeToIso(date: string, time: string) {
  const next = new Date(`${date}T${time}:00`);
  if (Number.isNaN(next.getTime())) throw new Error('Fecha u hora inválida.');
  if (next.getTime() <= Date.now()) throw new Error('La nueva fecha debe ser futura.');
  return next.toISOString();
}

export function todayDate() {
  return formatDate(new Date());
}

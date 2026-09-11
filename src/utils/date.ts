import { Timestamp } from 'firebase/firestore'

export function toDate(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate()
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value)
  }

  return new Date()
}

export function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(value)
}

/** Dia/mes e hora, sem ano: "13/10, 13:45". Para onde a data completa nao cabe. */
export function formatShortDateTime(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)
}

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

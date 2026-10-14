import type { DocumentData } from 'firebase/firestore'
import { defaultNotificationPreferences } from '../constants'
import type { Player } from '../types'

/**
 * Perfil completo, de users/{uid}. So o proprio jogador e o admin conseguem ler
 * (tem e-mail e preferencias); os outros veem o perfil publico de profiles/{uid}.
 */
export function userDocToPlayer(id: string, data: DocumentData, fallback?: { email?: string | null; name?: string | null; photoURL?: string | null }): Player {
  const role = data.role === 'admin' ? ('admin' as const) : ('user' as const)

  return {
    id,
    name: String(data.name ?? fallback?.name ?? 'Jogador'),
    email: String(data.email ?? fallback?.email ?? ''),
    photoURL: String(fallback?.photoURL ?? data.photoURL ?? '') || null,
    role,
    approved: role === 'admin' || data.approved === true,
    notificationsEnabled:
      typeof data.notificationsEnabled === 'boolean'
        ? data.notificationsEnabled
        : defaultNotificationPreferences.notificationsEnabled,
    notifyOnRoundPublished:
      typeof data.notifyOnRoundPublished === 'boolean'
        ? data.notifyOnRoundPublished
        : defaultNotificationPreferences.notifyOnRoundPublished,
    notifyOnDeadlineReminder:
      typeof data.notifyOnDeadlineReminder === 'boolean'
        ? data.notifyOnDeadlineReminder
        : defaultNotificationPreferences.notifyOnDeadlineReminder,
    reminderDaysBefore:
      typeof data.reminderDaysBefore === 'number'
        ? data.reminderDaysBefore
        : defaultNotificationPreferences.reminderDaysBefore,
    preferredNotificationTime:
      typeof data.preferredNotificationTime === 'string'
        ? data.preferredNotificationTime
        : defaultNotificationPreferences.preferredNotificationTime,
  }
}

/**
 * Perfil publico, de profiles/{uid}: so nome, foto e se e jogador liberado —
 * o que o ranking e a aba "Palpites dos jogadores" precisam. E-mail, papel e
 * preferencias nao existem aqui, entao saem vazios/padrao.
 */
export function publicProfileToPlayer(id: string, data: DocumentData): Player {
  return {
    id,
    name: String(data.name ?? 'Jogador'),
    email: '',
    photoURL: typeof data.photoURL === 'string' ? data.photoURL : null,
    role: 'user',
    approved: data.approved === true,
    ...defaultNotificationPreferences,
  }
}

/** Campos que vao para profiles/{uid}. As regras so aceitam exatamente estes. */
export function toPublicProfile(player: Pick<Player, 'approved' | 'name' | 'photoURL'>) {
  return {
    approved: player.approved,
    name: player.name,
    photoURL: player.photoURL ?? null,
  }
}

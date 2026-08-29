import type { NotificationPreferences, View } from './types'

export const competitionId = 'champions-2026'

export const defaultNotificationPreferences: NotificationPreferences = {
  notificationsEnabled: true,
  notifyOnRoundPublished: true,
  notifyOnDeadlineReminder: true,
  reminderDaysBefore: 2,
  preferredNotificationTime: '18:00',
}

export const viewLabels: Record<View, string> = {
  palpites: 'Palpites',
  previsoes: 'Previsões',
  ranking: 'Ranking',
  champions: 'Tabela',
  statistics: 'Estatísticas',
  'mata-mata': 'Chaveamento',
  regras: 'Regras',
}

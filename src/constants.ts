import type { NotificationPreferences, View } from './types'

export const competitionId = 'champions-2026'

/** Versao do site, mostrada na aba Sobre. Espelha o "version" do package.json. */
export const appVersion = '1.0.0'

export const githubUrl = 'https://github.com/Vitallzin'

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
  sobre: 'Sobre',
}

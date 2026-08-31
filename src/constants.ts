import type { NotificationPreferences, View } from './types'

export const competitionId = 'champions-2026'

/** Versao do site, mostrada na aba Sobre. Espelha o "version" do package.json. */
export const appVersion = '1.0.0'

export const githubUrl = 'https://github.com/Vitallzin'

/**
 * Faixas de horario que o jogador escolhe para receber o lembrete de prazo.
 * Sao periodos do dia, nao horarios exatos: o cron do GitHub Actions atrasa e
 * agrupa as execucoes (na pratica roda a cada 3 a 6 horas), entao o aviso sai na
 * primeira verificacao a partir do horario escolhido, ainda dentro daquele periodo.
 *
 * Copia deliberada em scripts/notify/index.mjs — o script roda fora do app e nao
 * consegue importar daqui. AO MUDAR ESTA LISTA, MUDE NOS DOIS LUGARES.
 */
export const notificationTimeSlots = [
  { value: '08:00', label: 'De manha (a partir das 08:00)' },
  { value: '12:00', label: 'Meio-dia (a partir das 12:00)' },
  { value: '18:00', label: 'Fim de tarde (a partir das 18:00)' },
  { value: '21:00', label: 'A noite (a partir das 21:00)' },
]

/**
 * Aproxima um horario qualquer da faixa mais proxima. Contas antigas guardaram um
 * horario livre (o campo era um input de hora), entao o valor salvo nem sempre e
 * uma das opcoes da lista.
 */
export function roundToNotificationSlot(time: string) {
  const target = toMinutesOfDay(time)

  if (target === null) {
    return defaultNotificationPreferences.preferredNotificationTime
  }

  return notificationTimeSlots.reduce((closest, slot) => {
    const slotMinutes = toMinutesOfDay(slot.value) ?? 0
    const closestMinutes = toMinutesOfDay(closest) ?? 0

    return Math.abs(slotMinutes - target) < Math.abs(closestMinutes - target) ? slot.value : closest
  }, notificationTimeSlots[0].value)
}

function toMinutesOfDay(time: string) {
  const [hours, minutes] = String(time).split(':').map(Number)

  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null
}

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

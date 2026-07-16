export type Role = 'user' | 'admin'

export type View = 'palpites' | 'previsoes' | 'ranking' | 'champions' | 'statistics' | 'mata-mata'

export type MatchStatus = 'scheduled' | 'finished'

export type RoundStatus = 'draft' | 'published'

export type Team = {
  id: string
  name: string
  shortName: string
  countryCode: string
  countryName?: string
  color?: string
}

export type PlayerStat = {
  id: string
  name: string
  teamId: string
  nationalityCode: string
  goals: number
  assists: number
}

export type Round = {
  id: string
  name: string
  deadline: Date
  number?: number
  status?: RoundStatus
  scoresPublished?: boolean
}

export type Match = {
  id: string
  roundId: string
  roundNumber?: number
  day?: 1 | 2
  slot?: number
  homeTeamId: string
  awayTeamId: string
  startsAt: Date
  status: MatchStatus
  realHomeScore: number | null
  realAwayScore: number | null
  scorePublished?: boolean
}

export type Prediction = {
  id: string
  userId: string
  matchId: string
  homeScore: number
  awayScore: number
}

export type KnockoutPrediction = {
  id: string
  userId: string
  tieId: string
  leg: 'home' | 'away'
  homeScore: number
  awayScore: number
}

export type CompetitionPrediction = {
  id: string
  userId: string
  topScorers: string[]
  topAssists: string[]
  bestPlayer: string
  bestGoalkeeper: string
  championTeamId: string
  runnerUpTeamId: string
}

export type CompetitionPredictionResult = {
  id: string
  topScorers: string[]
  topAssists: string[]
  bestPlayer: string
  bestGoalkeeper: string
  championTeamId: string
  runnerUpTeamId: string
  published?: boolean
}

export type NotificationPreferences = {
  notificationsEnabled: boolean
  notifyOnRoundPublished: boolean
  notifyOnDeadlineReminder: boolean
  reminderDaysBefore: number
  preferredNotificationTime: string
}

export type Player = {
  id: string
  name: string
  email: string
  photoURL?: string | null
  role: Role
  approved: boolean
  notificationsEnabled?: boolean
  notifyOnRoundPublished?: boolean
  notifyOnDeadlineReminder?: boolean
  reminderDaysBefore?: number
  preferredNotificationTime?: string
}

export type KnockoutTie = {
  id: string
  stage: string
  order: number
  nextTieId?: string
  nextSlot?: 'home' | 'away'
  homeTeamId?: string | null
  awayTeamId?: string | null
  winnerTeamId?: string | null
  homeLegHomeScore?: number | null
  homeLegAwayScore?: number | null
  awayLegHomeScore?: number | null
  awayLegAwayScore?: number | null
  homeLegDeadline?: Date | null
  awayLegDeadline?: Date | null
  homeLegScorePublished?: boolean
  awayLegScorePublished?: boolean
  scorePublished?: boolean
}

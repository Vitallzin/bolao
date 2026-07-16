import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { collection, onSnapshot } from 'firebase/firestore'
import { competitionId, defaultNotificationPreferences } from '../constants'
import { db } from '../firebase'
import type {
  CompetitionPrediction,
  CompetitionPredictionResult,
  KnockoutPrediction,
  KnockoutTie,
  Match,
  Player,
  PlayerStat,
  Prediction,
  Round,
  Team,
} from '../types'
import { toDate } from '../utils/date'

export function useCompetitionData(authUser: User | null) {
  const [teams, setTeams] = useState<Team[]>([])
  const [rounds, setRounds] = useState<Round[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [competitionPredictions, setCompetitionPredictions] = useState<CompetitionPrediction[]>([])
  const [competitionPredictionResult, setCompetitionPredictionResult] = useState<CompetitionPredictionResult>()
  const [players, setPlayers] = useState<Player[]>([])
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([])
  const [knockout, setKnockout] = useState<KnockoutTie[]>([])
  const [knockoutPredictions, setKnockoutPredictions] = useState<KnockoutPrediction[]>([])

  useEffect(() => {
    if (!authUser) {
      return
    }

    const unsubscribers = [
      onSnapshot(collection(db, 'users'), (snapshot) => {
        setPlayers(
          snapshot.docs
            .map((item) => {
              const data = item.data()
              const role = data.role === 'admin' ? ('admin' as const) : ('user' as const)

              return {
                id: item.id,
                name: String(data.name ?? 'Jogador'),
                email: String(data.email ?? ''),
                photoURL: typeof data.photoURL === 'string' ? data.photoURL : null,
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
            })
            .sort((a, b) => a.name.localeCompare(b.name)),
        )
      }),
      onSnapshot(collection(db, 'competitions', competitionId, 'teams'), (snapshot) => {
        setTeams(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Team))
      }),
      onSnapshot(collection(db, 'competitions', competitionId, 'playerStats'), (snapshot) => {
        setPlayerStats(
          snapshot.docs
            .map((item) => {
              const data = item.data()

              return {
                id: item.id,
                name: String(data.name ?? ''),
                teamId: String(data.teamId ?? ''),
                nationalityCode: String(data.nationalityCode ?? '').toUpperCase(),
                goals: Number(data.goals ?? 0),
                assists: Number(data.assists ?? 0),
              }
            })
            .sort((a, b) => a.name.localeCompare(b.name)),
        )
      }),
      onSnapshot(collection(db, 'competitions', competitionId, 'rounds'), (snapshot) => {
        const nextRounds = snapshot.docs
          .map((item) => {
            const data = item.data()
            return {
              id: item.id,
              name: String(data.name ?? ''),
              deadline: toDate(data.deadline),
              number: typeof data.number === 'number' ? data.number : undefined,
              status: data.status === 'published' ? ('published' as const) : ('draft' as const),
              scoresPublished: Boolean(data.scoresPublished),
            }
          })
          .sort((a, b) => (a.number ?? 99) - (b.number ?? 99) || a.deadline.getTime() - b.deadline.getTime())

        setRounds(nextRounds)
      }),
      onSnapshot(collection(db, 'competitions', competitionId, 'matches'), (snapshot) => {
        setMatches(
          snapshot.docs
            .map((item) => {
              const data = item.data()
              return {
                id: item.id,
                roundId: String(data.roundId ?? ''),
                roundNumber: typeof data.roundNumber === 'number' ? data.roundNumber : undefined,
                day: data.day === 2 ? (2 as const) : data.day === 1 ? (1 as const) : undefined,
                slot: typeof data.slot === 'number' ? data.slot : undefined,
                homeTeamId: String(data.homeTeamId ?? ''),
                awayTeamId: String(data.awayTeamId ?? ''),
                startsAt: toDate(data.startsAt),
                status: data.status === 'finished' ? ('finished' as const) : ('scheduled' as const),
                realHomeScore: typeof data.realHomeScore === 'number' ? data.realHomeScore : null,
                realAwayScore: typeof data.realAwayScore === 'number' ? data.realAwayScore : null,
                scorePublished: Boolean(data.scorePublished),
              }
            })
            .sort(
              (a, b) =>
                (a.roundNumber ?? 99) - (b.roundNumber ?? 99) ||
                (a.day ?? 9) - (b.day ?? 9) ||
                (a.slot ?? 99) - (b.slot ?? 99) ||
                a.startsAt.getTime() - b.startsAt.getTime(),
            ),
        )
      }),
      onSnapshot(collection(db, 'competitions', competitionId, 'predictions'), (snapshot) => {
        setPredictions(
          snapshot.docs.map((item) => {
            const data = item.data()
            return {
              id: item.id,
              userId: String(data.userId ?? ''),
              matchId: String(data.matchId ?? ''),
              homeScore: Number(data.homeScore ?? 0),
              awayScore: Number(data.awayScore ?? 0),
            }
          }),
        )
      }),
      onSnapshot(collection(db, 'competitions', competitionId, 'competitionPredictions'), (snapshot) => {
        setCompetitionPredictions(
          snapshot.docs.map((item) => {
            const data = item.data()

            return {
              id: item.id,
              userId: String(data.userId ?? ''),
              topScorers: toStringList(data.topScorers),
              topAssists: toStringList(data.topAssists),
              bestPlayer: String(data.bestPlayer ?? ''),
              bestGoalkeeper: String(data.bestGoalkeeper ?? ''),
              championTeamId: String(data.championTeamId ?? ''),
              runnerUpTeamId: String(data.runnerUpTeamId ?? ''),
            }
          }),
        )
      }),
      onSnapshot(collection(db, 'competitions', competitionId, 'competitionPredictionResults'), (snapshot) => {
        const resultDoc = snapshot.docs.find((item) => item.id === 'official')
        const data = resultDoc?.data()

        setCompetitionPredictionResult(
          resultDoc && data
            ? {
              id: resultDoc.id,
              topScorers: toStringList(data.topScorers),
              topAssists: toStringList(data.topAssists),
              bestPlayer: String(data.bestPlayer ?? ''),
              bestGoalkeeper: String(data.bestGoalkeeper ?? ''),
              championTeamId: String(data.championTeamId ?? ''),
              runnerUpTeamId: String(data.runnerUpTeamId ?? ''),
              published: Boolean(data.published),
            }
            : undefined,
        )
      }),
      onSnapshot(collection(db, 'competitions', competitionId, 'knockoutPredictions'), (snapshot) => {
        setKnockoutPredictions(
          snapshot.docs.map((item) => {
            const data = item.data()

            return {
              id: item.id,
              userId: String(data.userId ?? ''),
              tieId: String(data.tieId ?? ''),
              leg: data.leg === 'away' ? ('away' as const) : ('home' as const),
              homeScore: Number(data.homeScore ?? 0),
              awayScore: Number(data.awayScore ?? 0),
            }
          }),
        )
      }),
      onSnapshot(collection(db, 'competitions', competitionId, 'knockout'), (snapshot) => {
        setKnockout(
          snapshot.docs
            .map((item) => {
              const data = item.data()

              return {
                id: item.id,
                stage: String(data.stage ?? ''),
                order: Number(data.order ?? 0),
                nextTieId: typeof data.nextTieId === 'string' ? data.nextTieId : undefined,
                nextSlot: data.nextSlot === 'home' || data.nextSlot === 'away' ? data.nextSlot : undefined,
                homeTeamId: typeof data.homeTeamId === 'string' ? data.homeTeamId : null,
                awayTeamId: typeof data.awayTeamId === 'string' ? data.awayTeamId : null,
                winnerTeamId: typeof data.winnerTeamId === 'string' ? data.winnerTeamId : null,
                homeLegHomeScore: typeof data.homeLegHomeScore === 'number' ? data.homeLegHomeScore : null,
                homeLegAwayScore: typeof data.homeLegAwayScore === 'number' ? data.homeLegAwayScore : null,
                awayLegHomeScore: typeof data.awayLegHomeScore === 'number' ? data.awayLegHomeScore : null,
                awayLegAwayScore: typeof data.awayLegAwayScore === 'number' ? data.awayLegAwayScore : null,
                homeLegDeadline: data.homeLegDeadline ? toDate(data.homeLegDeadline) : null,
                awayLegDeadline: data.awayLegDeadline ? toDate(data.awayLegDeadline) : null,
                homeLegScorePublished: Boolean(data.homeLegScorePublished),
                awayLegScorePublished: Boolean(data.awayLegScorePublished),
                scorePublished: Boolean(data.scorePublished),
              }
            })
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        )
      }),
    ]

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [authUser])

  return {
    competitionPredictionResult,
    competitionPredictions,
    knockout,
    knockoutPredictions,
    matches,
    players,
    playerStats,
    predictions,
    rounds,
    teams,
  }
}

function toStringList(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item ?? '')) : []
}

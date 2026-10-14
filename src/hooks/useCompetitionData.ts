import { useEffect, useMemo, useState } from 'react'
import type { User } from 'firebase/auth'
import { collection, onSnapshot, query, where, type Query } from 'firebase/firestore'
import { competitionId } from '../constants'
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
  RankingEntry,
  Round,
  Team,
} from '../types'
import { toDate } from '../utils/date'
import { publicProfileToPlayer, userDocToPlayer } from '../utils/userProfile'

/**
 * Dados da competicao em tempo real. Os palpites nao vem mais da colecao
 * inteira: as regras do Firestore so deixam cada um ler os proprios, os da
 * rodada que ja fechou e (admin) todos — entao as consultas pedem exatamente
 * isso, senao o servidor recusaria a leitura.
 */
export function useCompetitionData(authUser: User | null, isAdmin: boolean) {
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
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [lastScoredRoundId, setLastScoredRoundId] = useState<string | null>(null)
  const [competitionPredictionDeadline, setCompetitionPredictionDeadline] = useState<Date | null>(null)
  const [rankingLoaded, setRankingLoaded] = useState(false)

  useEffect(() => {
    if (!authUser) {
      return
    }

    const unsubscribers = [
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
      onSnapshot(collection(db, 'competitions', competitionId, 'settings'), (snapshot) => {
        const settings = snapshot.docs.find((item) => item.id === 'competitionPredictions')
        const deadline = settings?.data()?.deadline

        setCompetitionPredictionDeadline(deadline ? toDate(deadline) : null)
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
      onSnapshot(collection(db, 'competitions', competitionId, 'ranking'), (snapshot) => {
        const current = snapshot.docs.find((item) => item.id === 'current')
        const entries = current?.data()?.entries
        const lastRound = current?.data()?.lastScoredRoundId

        setLastScoredRoundId(typeof lastRound === 'string' ? lastRound : null)
        setRankingLoaded(true)
        setRanking(
          Array.isArray(entries)
            ? entries.map((entry, index) => ({
              userId: String(entry?.userId ?? ''),
              name: String(entry?.name ?? 'Jogador'),
              photoURL: typeof entry?.photoURL === 'string' ? entry.photoURL : null,
              points: Number(entry?.points ?? 0),
              roundPoints:
                entry?.roundPoints && typeof entry.roundPoints === 'object' ? entry.roundPoints : {},
              position: typeof entry?.position === 'number' ? entry.position : index + 1,
              previousPosition:
                typeof entry?.previousPosition === 'number' ? entry.previousPosition : null,
            }))
            : [],
        )
      }),
    ]

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [authUser])

  // Jogadores: o admin le os perfis completos (e-mail, preferencias); os demais
  // so o perfil publico — nome, foto e se e jogador liberado.
  useEffect(() => {
    if (!authUser) {
      return
    }

    return onSnapshot(collection(db, isAdmin ? 'users' : 'profiles'), (snapshot) => {
      setPlayers(
        snapshot.docs
          .map((item) => (isAdmin ? userDocToPlayer(item.id, item.data()) : publicProfileToPlayer(item.id, item.data())))
          .sort((a, b) => a.name.localeCompare(b.name)),
      )
    })
  }, [authUser, isAdmin])

  // Rodadas cujo prazo ja passou: os palpites delas ficam visiveis para todos.
  // Um timer avisa quando o proximo prazo vence, para liberar sem recarregar.
  const [now, setNow] = useState(() => Date.now())
  const closedRoundIds = useMemo(
    () => rounds.filter((round) => round.deadline.getTime() <= now).map((round) => round.id),
    [now, rounds],
  )
  const closedRoundsKey = closedRoundIds.join('|')

  useEffect(() => {
    const next = rounds
      .map((round) => round.deadline.getTime())
      .filter((time) => time > now)
      .sort((a, b) => a - b)[0]

    // setTimeout nao aceita mais que ~24 dias; prazos mais longes esperam o proximo recarregamento.
    if (next === undefined || next - now > 2 ** 31 - 1) {
      return
    }

    const timer = window.setTimeout(() => setNow(Date.now()), next - now + 1000)

    return () => window.clearTimeout(timer)
  }, [now, rounds])

  useEffect(() => {
    if (!authUser) {
      return
    }

    const competition = (name: string) => collection(db, 'competitions', competitionId, name)
    const mine = (name: string) => query(competition(name), where('userId', '==', authUser.uid))
    const predictionQueries: Query[] = isAdmin
      ? [competition('predictions')]
      : [
        mine('predictions'),
        ...closedRoundsKey
          .split('|')
          .filter(Boolean)
          .map((roundId) => query(competition('predictions'), where('roundId', '==', roundId))),
      ]

    // Cada consulta guarda o seu pedaco; a lista final junta tudo sem repetir
    // (o meu palpite de uma rodada fechada vem nas duas consultas).
    const predictionParts = new Map<number, Prediction[]>()
    const publishPredictions = () => {
      const byId = new Map<string, Prediction>()
      predictionParts.forEach((part) => part.forEach((item) => byId.set(item.id, item)))
      setPredictions([...byId.values()])
    }

    const unsubscribers = [
      ...predictionQueries.map((predictionQuery, index) =>
        onSnapshot(predictionQuery, (snapshot) => {
          predictionParts.set(
            index,
            snapshot.docs.map((item) => {
              const data = item.data()
              return {
                id: item.id,
                userId: String(data.userId ?? ''),
                matchId: String(data.matchId ?? ''),
                roundId: typeof data.roundId === 'string' ? data.roundId : undefined,
                homeScore: Number(data.homeScore ?? 0),
                awayScore: Number(data.awayScore ?? 0),
              }
            }),
          )
          publishPredictions()
        }),
      ),
      onSnapshot(isAdmin ? competition('competitionPredictions') : mine('competitionPredictions'), (snapshot) => {
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
      onSnapshot(isAdmin ? competition('knockoutPredictions') : mine('knockoutPredictions'), (snapshot) => {
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
    ]

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [authUser, closedRoundsKey, isAdmin])

  return {
    competitionPredictionDeadline,
    competitionPredictionResult,
    competitionPredictions,
    knockout,
    knockoutPredictions,
    lastScoredRoundId,
    matches,
    players,
    playerStats,
    predictions,
    ranking,
    rankingLoaded,
    rounds,
    teams,
  }
}

function toStringList(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item ?? '')) : []
}

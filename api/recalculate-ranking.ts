import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp, type QuerySnapshot } from 'firebase-admin/firestore'

const COMPETITION_ID = process.env.COMPETITION_ID || 'champions-2026'

if (getApps().length === 0) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
  initializeApp({ credential: cert(serviceAccount) })
}

const db = getFirestore()

// Um campo opcional ausente vira undefined, e o Firestore recusa undefined na escrita.
try {
  db.settings({ ignoreUndefinedProperties: true })
} catch {
  // settings() so aceita ser chamado uma vez; se ja foi, seguimos com o que esta valendo.
}

// ---------------------------------------------------------------------------
// Regras de pontuacao — copia deliberada de src/utils/scoring.ts.
//
// Esta funcao roda como ESM na Vercel, e um import relativo para fora da pasta
// api/ quebrava o carregamento do modulo (FUNCTION_INVOCATION_FAILED). Manter o
// arquivo sem imports relativos e o que garante que ela sobe.
//
// AO MUDAR A PONTUACAO, MUDE NOS DOIS LUGARES.
// ---------------------------------------------------------------------------

type PointTable = { exact: number; offByOne: number; offByTwo: number; resultBonus: number }

const stagePointTables: Record<string, PointTable> = {
  early: { exact: 100, offByOne: 50, offByTwo: 25, resultBonus: 15 },
  quartas: { exact: 150, offByOne: 75, offByTwo: 40, resultBonus: 25 },
  semis: { exact: 200, offByOne: 100, offByTwo: 50, resultBonus: 35 },
  final: { exact: 300, offByOne: 150, offByTwo: 75, resultBonus: 50 },
}

const competitionPredictionPoints = {
  topFiveExactPosition: 100,
  topFiveWrongPosition: 50,
  bestPlayer: 150,
  bestGoalkeeper: 100,
  champion: 300,
  runnerUp: 150,
  swappedFinalist: 100,
}

type Match = {
  id: string
  roundId: string
  roundNumber?: number
  status: string
  realHomeScore?: number | null
  realAwayScore?: number | null
}

type Prediction = { userId: string; matchId: string; homeScore: number; awayScore: number }

type KnockoutTie = {
  id: string
  stage: string
  homeLegHomeScore?: number | null
  homeLegAwayScore?: number | null
  awayLegHomeScore?: number | null
  awayLegAwayScore?: number | null
  homeLegScorePublished?: boolean
  awayLegScorePublished?: boolean
  scorePublished?: boolean
}

type KnockoutPrediction = {
  userId: string
  tieId: string
  leg: 'home' | 'away'
  homeScore: number
  awayScore: number
}

type CompetitionPrediction = {
  userId: string
  topScorers: string[]
  topAssists: string[]
  bestPlayer: string
  bestGoalkeeper: string
  championTeamId: string
  runnerUpTeamId: string
}

type CompetitionPredictionResult = CompetitionPrediction & { published?: boolean }

type PlayerPointsInput = {
  competitionPredictionResult?: CompetitionPredictionResult
  competitionPredictions: CompetitionPrediction[]
  knockout: KnockoutTie[]
  knockoutPredictions: KnockoutPrediction[]
  matches: Match[]
  predictions: Prediction[]
}

function getPredictionPointTable(stage: string): PointTable {
  return stagePointTables[stage] ?? stagePointTables.early
}

function calculateScorePoints({
  actualAwayScore,
  actualHomeScore,
  predictedAwayScore,
  predictedHomeScore,
  stage,
}: {
  actualAwayScore?: number | null
  actualHomeScore?: number | null
  predictedAwayScore: number
  predictedHomeScore: number
  stage: string
}) {
  if (typeof actualHomeScore !== 'number' || typeof actualAwayScore !== 'number') {
    return 0
  }

  const table = getPredictionPointTable(stage)
  const goalError =
    Math.abs(predictedHomeScore - actualHomeScore) + Math.abs(predictedAwayScore - actualAwayScore)
  const predictedResult = Math.sign(predictedHomeScore - predictedAwayScore)
  const realResult = Math.sign(actualHomeScore - actualAwayScore)
  const resultBonus = predictedResult === realResult ? table.resultBonus : 0

  if (goalError === 0) {
    return table.exact
  }

  if (goalError === 1) {
    return table.offByOne + resultBonus
  }

  if (goalError === 2) {
    return table.offByTwo + resultBonus
  }

  return resultBonus
}

function calculatePredictionPoints(prediction: Prediction, match: Match) {
  return calculateScorePoints({
    actualAwayScore: match.realAwayScore,
    actualHomeScore: match.realHomeScore,
    predictedAwayScore: prediction.awayScore,
    predictedHomeScore: prediction.homeScore,
    stage: 'early',
  })
}

function calculateKnockoutPredictionPoints({
  awayScore,
  homeScore,
  leg,
  tie,
}: {
  awayScore: number
  homeScore: number
  leg: 'home' | 'away'
  tie: KnockoutTie
}) {
  return calculateScorePoints({
    actualAwayScore: leg === 'home' ? tie.homeLegAwayScore : tie.awayLegAwayScore,
    actualHomeScore: leg === 'home' ? tie.homeLegHomeScore : tie.awayLegHomeScore,
    predictedAwayScore: awayScore,
    predictedHomeScore: homeScore,
    stage: tie.stage,
  })
}

function isKnockoutLegPublished(tie: KnockoutTie, leg: 'home' | 'away') {
  if (tie.stage === 'final' && leg === 'away') {
    return false
  }

  return leg === 'home'
    ? Boolean(tie.homeLegScorePublished || tie.scorePublished)
    : Boolean(tie.awayLegScorePublished || tie.scorePublished)
}

function normalizeName(value: string) {
  return String(value ?? '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function calculateTopFivePoints(predicted: string[], actual: string[]) {
  const normalizedActual = (actual ?? []).map(normalizeName)

  return (predicted ?? []).reduce((total, player, index) => {
    const normalizedPlayer = normalizeName(player)

    if (!normalizedPlayer) {
      return total
    }

    if (normalizedActual[index] === normalizedPlayer) {
      return total + competitionPredictionPoints.topFiveExactPosition
    }

    return normalizedActual.includes(normalizedPlayer)
      ? total + competitionPredictionPoints.topFiveWrongPosition
      : total
  }, 0)
}

function calculateExactNamePoints(predicted: string, actual: string, points: number) {
  return normalizeName(predicted) && normalizeName(predicted) === normalizeName(actual) ? points : 0
}

function calculateFinalistsPoints(
  prediction: CompetitionPrediction,
  result: CompetitionPredictionResult,
) {
  let points = 0

  if (prediction.championTeamId && prediction.championTeamId === result.championTeamId) {
    points += competitionPredictionPoints.champion
  } else if (prediction.championTeamId && prediction.championTeamId === result.runnerUpTeamId) {
    points += competitionPredictionPoints.swappedFinalist
  }

  if (prediction.runnerUpTeamId && prediction.runnerUpTeamId === result.runnerUpTeamId) {
    points += competitionPredictionPoints.runnerUp
  } else if (prediction.runnerUpTeamId && prediction.runnerUpTeamId === result.championTeamId) {
    points += competitionPredictionPoints.swappedFinalist
  }

  return points
}

function calculateCompetitionPredictionPoints(
  prediction: CompetitionPrediction,
  result?: CompetitionPredictionResult,
) {
  if (!result?.published) {
    return 0
  }

  return (
    calculateTopFivePoints(prediction.topScorers, result.topScorers) +
    calculateTopFivePoints(prediction.topAssists, result.topAssists) +
    calculateExactNamePoints(
      prediction.bestPlayer,
      result.bestPlayer,
      competitionPredictionPoints.bestPlayer,
    ) +
    calculateExactNamePoints(
      prediction.bestGoalkeeper,
      result.bestGoalkeeper,
      competitionPredictionPoints.bestGoalkeeper,
    ) +
    calculateFinalistsPoints(prediction, result)
  )
}

function calculatePlayerPoints(userId: string, input: PlayerPointsInput) {
  const roundPoints = input.predictions
    .filter((prediction) => prediction.userId === userId)
    .reduce((total, prediction) => {
      const match = input.matches.find((item) => item.id === prediction.matchId)

      if (!match || match.status !== 'finished') {
        return total
      }

      return total + calculatePredictionPoints(prediction, match)
    }, 0)

  const knockoutPoints = input.knockoutPredictions
    .filter((prediction) => prediction.userId === userId)
    .reduce((total, prediction) => {
      const tie = input.knockout.find((item) => item.id === prediction.tieId)

      if (!tie || !isKnockoutLegPublished(tie, prediction.leg)) {
        return total
      }

      return (
        total +
        calculateKnockoutPredictionPoints({
          awayScore: prediction.awayScore,
          homeScore: prediction.homeScore,
          leg: prediction.leg,
          tie,
        })
      )
    }, 0)

  const competitionPoints = calculateCompetitionPredictionPoints(
    input.competitionPredictions.find((prediction) => prediction.userId === userId) ?? {
      userId,
      topScorers: [],
      topAssists: [],
      bestPlayer: '',
      bestGoalkeeper: '',
      championTeamId: '',
      runnerUpTeamId: '',
    },
    input.competitionPredictionResult,
  )

  return roundPoints + knockoutPoints + competitionPoints
}

function calculatePointsByRound(userId: string, input: PlayerPointsInput) {
  const byRound: Record<string, number> = {}

  input.predictions.forEach((prediction) => {
    if (prediction.userId !== userId) {
      return
    }

    const match = input.matches.find((item) => item.id === prediction.matchId)

    if (!match || match.status !== 'finished' || !match.roundId) {
      return
    }

    byRound[match.roundId] = (byRound[match.roundId] ?? 0) + calculatePredictionPoints(prediction, match)
  })

  return byRound
}

function getLastScoredRoundId(matches: Match[]) {
  const finished = matches.filter((match) => match.status === 'finished' && match.roundId)

  if (finished.length === 0) {
    return null
  }

  return finished.reduce((best, match) =>
    (match.roundNumber ?? 0) > (best.roundNumber ?? 0) ? match : best,
  ).roundId
}

// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const authHeader = req.headers.authorization || ''
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!idToken) {
    res.status(401).json({ error: 'Token de autenticacao ausente.' })
    return
  }

  let isAdmin = false

  try {
    const caller = await getAuth().verifyIdToken(idToken)
    const callerDoc = await db.collection('users').doc(caller.uid).get()
    isAdmin = callerDoc.data()?.role === 'admin'
  } catch (error) {
    console.error('recalculate-ranking auth failed:', error)
    res.status(401).json({ error: 'Nao consegui validar seu login.' })
    return
  }

  if (!isAdmin) {
    res.status(403).json({ error: 'Apenas o admin pode recalcular o ranking.' })
    return
  }

  try {
    const entries = await recalculateRanking()

    res.status(200).json({ players: entries.length, updatedAt: new Date().toISOString() })
  } catch (error) {
    // So o admin chega aqui, entao devolver o erro real ajuda a diagnosticar.
    const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error)

    console.error('recalculate-ranking failed:', error)
    res.status(500).json({ error: detail.slice(0, 300) })
  }
}

async function recalculateRanking() {
  const competition = db.collection('competitions').doc(COMPETITION_ID)

  const [
    usersSnap,
    matchesSnap,
    predictionsSnap,
    knockoutSnap,
    knockoutPredictionsSnap,
    competitionPredictionsSnap,
    competitionResultDoc,
  ] = await Promise.all([
    db.collection('users').get(),
    competition.collection('matches').get(),
    competition.collection('predictions').get(),
    competition.collection('knockout').get(),
    competition.collection('knockoutPredictions').get(),
    competition.collection('competitionPredictions').get(),
    competition.collection('competitionPredictionResults').doc('official').get(),
  ])

  const input: PlayerPointsInput = {
    competitionPredictionResult: competitionResultDoc.exists
      ? ({ id: competitionResultDoc.id, ...competitionResultDoc.data() } as CompetitionPredictionResult)
      : undefined,
    competitionPredictions: mapDocs<CompetitionPrediction>(competitionPredictionsSnap),
    knockout: mapDocs<KnockoutTie>(knockoutSnap),
    knockoutPredictions: mapDocs<KnockoutPrediction>(knockoutPredictionsSnap),
    matches: mapDocs<Match>(matchesSnap),
    predictions: mapDocs<Prediction>(predictionsSnap),
  }

  const lastScoredRoundId = getLastScoredRoundId(input.matches)

  const scored = usersSnap.docs
    .map((item) => ({ id: item.id, ...item.data() }) as Record<string, unknown> & { id: string })
    .filter((user) => user.approved === true || user.role === 'admin')
    .map((user) => {
      const roundPoints = calculatePointsByRound(user.id, input)
      const points = calculatePlayerPoints(user.id, input)

      return {
        name: String(user.name ?? 'Jogador'),
        photoURL: typeof user.photoURL === 'string' ? user.photoURL : null,
        points,
        // Pontuacao desconsiderando a ultima rodada, para saber de onde o jogador veio.
        pointsBeforeLastRound: points - (lastScoredRoundId ? roundPoints[lastScoredRoundId] ?? 0 : 0),
        roundPoints,
        userId: user.id,
      }
    })

  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)
  const previousPositions = new Map(
    [...scored]
      .sort((a, b) => b.pointsBeforeLastRound - a.pointsBeforeLastRound || byName(a, b))
      .map((entry, index) => [entry.userId, index + 1] as const),
  )

  const entries = [...scored]
    .sort((a, b) => b.points - a.points || byName(a, b))
    .map((entry, index) => ({
      name: entry.name,
      photoURL: entry.photoURL,
      points: entry.points,
      position: index + 1,
      // Sem rodada pontuada ainda, nao existe "posicao anterior" para comparar.
      previousPosition: lastScoredRoundId ? previousPositions.get(entry.userId) ?? null : null,
      roundPoints: entry.roundPoints,
      userId: entry.userId,
    }))

  await competition.collection('ranking').doc('current').set({
    entries,
    lastScoredRoundId: lastScoredRoundId ?? null,
    updatedAt: Timestamp.now(),
  })

  return entries
}

function mapDocs<T>(snapshot: QuerySnapshot): T[] {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T)
}

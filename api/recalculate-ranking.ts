import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp, type QuerySnapshot } from 'firebase-admin/firestore'
import type {
  CompetitionPrediction,
  CompetitionPredictionResult,
  KnockoutPrediction,
  KnockoutTie,
  Match,
  Prediction,
} from '../src/types'
import { calculatePlayerPoints, calculatePointsByRound, getLastScoredRoundId } from '../src/utils/scoring'

const COMPETITION_ID = process.env.COMPETITION_ID || 'champions-2026'

if (getApps().length === 0) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
  initializeApp({ credential: cert(serviceAccount) })
}

const db = getFirestore()

// Um campo opcional ausente vira undefined, e o Firestore recusa undefined na escrita.
// Sem isso, um unico dado faltando derruba o recalculo inteiro.
try {
  db.settings({ ignoreUndefinedProperties: true })
} catch {
  // settings() so aceita ser chamado uma vez; se ja foi, seguimos com o que esta valendo.
}

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

  const input = {
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
    .map((item) => ({ id: item.id, ...item.data() } as Record<string, unknown> & { id: string }))
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

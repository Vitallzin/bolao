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
import { calculatePlayerPoints } from '../src/utils/scoring'

const COMPETITION_ID = process.env.COMPETITION_ID || 'champions-2026'

if (getApps().length === 0) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
  initializeApp({ credential: cert(serviceAccount) })
}

const db = getFirestore()

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

  try {
    const caller = await getAuth().verifyIdToken(idToken)
    const callerDoc = await db.collection('users').doc(caller.uid).get()

    if (callerDoc.data()?.role !== 'admin') {
      res.status(403).json({ error: 'Apenas o admin pode recalcular o ranking.' })
      return
    }

    const entries = await recalculateRanking()

    res.status(200).json({ players: entries.length, updatedAt: new Date().toISOString() })
  } catch (error) {
    console.error('recalculate-ranking failed:', error)
    res.status(500).json({ error: 'Nao foi possivel recalcular o ranking.' })
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

  const entries = usersSnap.docs
    .map((item) => ({ id: item.id, ...item.data() } as Record<string, unknown> & { id: string }))
    .filter((user) => user.approved === true || user.role === 'admin')
    .map((user) => ({
      name: String(user.name ?? 'Jogador'),
      photoURL: typeof user.photoURL === 'string' ? user.photoURL : null,
      points: calculatePlayerPoints(user.id, input),
      userId: user.id,
    }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))

  await competition.collection('ranking').doc('current').set({
    entries,
    updatedAt: Timestamp.now(),
  })

  return entries
}

function mapDocs<T>(snapshot: QuerySnapshot): T[] {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T)
}

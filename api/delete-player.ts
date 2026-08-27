import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

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

  const targetUserId = typeof req.body?.userId === 'string' ? req.body.userId : ''

  if (!targetUserId) {
    res.status(400).json({ error: 'Informe o jogador que sera removido.' })
    return
  }

  try {
    const caller = await getAuth().verifyIdToken(idToken)
    const callerDoc = await db.collection('users').doc(caller.uid).get()

    if (callerDoc.data()?.role !== 'admin') {
      res.status(403).json({ error: 'Apenas o admin pode remover jogadores.' })
      return
    }

    if (targetUserId === caller.uid) {
      res.status(400).json({ error: 'Voce nao pode remover a sua propria conta por aqui.' })
      return
    }

    const targetDoc = await db.collection('users').doc(targetUserId).get()

    if (targetDoc.exists && targetDoc.data()?.role === 'admin') {
      res.status(400).json({ error: 'Nao da para remover outro admin.' })
      return
    }

    await deletePlayerData(targetUserId)
    await deleteAuthAccount(targetUserId)

    res.status(200).json({ removed: true })
  } catch (error) {
    console.error('delete-player failed:', error)
    res.status(500).json({ error: 'Nao foi possivel remover o jogador.' })
  }
}

async function deletePlayerData(userId: string) {
  const competition = db.collection('competitions').doc(COMPETITION_ID)
  const collections = ['predictions', 'knockoutPredictions', 'competitionPredictions']

  for (const name of collections) {
    const snapshot = await competition.collection(name).where('userId', '==', userId).get()
    const pending = [...snapshot.docs]

    while (pending.length > 0) {
      const chunk = pending.splice(0, 400)
      const batch = db.batch()
      chunk.forEach((item) => batch.delete(item.ref))
      await batch.commit()
    }
  }

  await db.collection('users').doc(userId).delete()
}

async function deleteAuthAccount(userId: string) {
  try {
    await getAuth().deleteUser(userId)
  } catch (error) {
    // Se a conta ja nao existe no Auth, os dados no Firestore ja foram limpos e o resultado e o mesmo.
    if ((error as { code?: string })?.code !== 'auth/user-not-found') {
      throw error
    }
  }
}

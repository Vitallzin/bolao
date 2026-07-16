import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { Resend } from 'resend'

const COMPETITION_ID = process.env.COMPETITION_ID || 'champions-2026'
const SITE_URL = process.env.SITE_URL || 'https://example.com'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Bolao da Champions <onboarding@resend.dev>'
const TIMEZONE = 'America/Sao_Paulo'
const PREFERRED_HOUR_TOLERANCE_MINUTES = 40

const stageLabels = {
  playoffs: 'Playoffs',
  oitavas: 'Oitavas',
  quartas: 'Quartas',
  semis: 'Semifinais',
  final: 'Final',
}

const serviceAccount = JSON.parse(requireEnv('FIREBASE_SERVICE_ACCOUNT'))
const resend = new Resend(requireEnv('RESEND_API_KEY'))

if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) })
}

const db = getFirestore()

async function main() {
  const now = new Date()

  const [usersSnap, roundsSnap, matchesSnap, predictionsSnap, knockoutSnap, knockoutPredictionsSnap] =
    await Promise.all([
      db.collection('users').get(),
      db.collection('competitions').doc(COMPETITION_ID).collection('rounds').get(),
      db.collection('competitions').doc(COMPETITION_ID).collection('matches').get(),
      db.collection('competitions').doc(COMPETITION_ID).collection('predictions').get(),
      db.collection('competitions').doc(COMPETITION_ID).collection('knockout').get(),
      db.collection('competitions').doc(COMPETITION_ID).collection('knockoutPredictions').get(),
    ])

  const users = usersSnap.docs.map((item) => ({ id: item.id, ...item.data() }))
  const rounds = roundsSnap.docs.map((item) => ({ id: item.id, ...item.data() }))
  const matches = matchesSnap.docs.map((item) => ({ id: item.id, ...item.data() }))
  const predictions = predictionsSnap.docs.map((item) => item.data())
  const knockoutTies = knockoutSnap.docs.map((item) => ({ id: item.id, ...item.data() }))
  const knockoutPredictions = knockoutPredictionsSnap.docs.map((item) => item.data())

  const notifiableUsers = users.filter(
    (user) =>
      Boolean(user.email) && (user.approved === true || user.role === 'admin') && user.notificationsEnabled !== false,
  )

  console.log(
    `Checking ${rounds.length} round(s) and ${knockoutTies.length} knockout tie(s) for ${notifiableUsers.length} notifiable user(s).`,
  )

  for (const round of rounds) {
    if (round.status !== 'published') {
      continue
    }

    const roundMatches = matches.filter((match) => match.roundId === round.id)

    if (roundMatches.length === 0) {
      continue
    }

    const deadline = toDate(round.deadline)

    if (!deadline) {
      continue
    }

    for (const user of notifiableUsers) {
      await notifyRoundPublished(user, round, now)

      const hasPredictedAll = roundMatches.every((match) =>
        predictions.some((prediction) => prediction.userId === user.id && prediction.matchId === match.id),
      )

      await notifyDeadlineReminder(user, {
        deadline,
        hasPredicted: hasPredictedAll,
        key: `round-${round.id}`,
        label: round.name || `Rodada ${round.number ?? ''}`,
        now,
      })
    }
  }

  const stages = [...new Set(knockoutTies.map((tie) => tie.stage))]

  for (const stage of stages) {
    const stageTies = knockoutTies.filter((tie) => tie.stage === stage && tie.homeTeamId && tie.awayTeamId)

    if (stageTies.length === 0) {
      continue
    }

    for (const leg of ['home', 'away']) {
      if (stage === 'final' && leg === 'away') {
        continue
      }

      const deadlineField = leg === 'home' ? 'homeLegDeadline' : 'awayLegDeadline'
      const referenceTie = stageTies.find((tie) => tie[deadlineField])
      const deadline = referenceTie ? toDate(referenceTie[deadlineField]) : null

      if (!deadline) {
        continue
      }

      const legLabel = stage === 'final' ? '' : leg === 'home' ? ' (ida)' : ' (volta)'
      const label = `${stageLabels[stage] || stage}${legLabel}`

      for (const user of notifiableUsers) {
        const hasPredictedAll = stageTies.every((tie) =>
          knockoutPredictions.some(
            (prediction) => prediction.userId === user.id && prediction.tieId === tie.id && prediction.leg === leg,
          ),
        )

        await notifyDeadlineReminder(user, {
          deadline,
          hasPredicted: hasPredictedAll,
          key: `knockout-${stage}-${leg}`,
          label,
          now,
        })
      }
    }
  }
}

async function notifyRoundPublished(user, round, now) {
  if (user.notifyOnRoundPublished === false) {
    return
  }

  if (user.notifiedPublishedRounds?.[round.id]) {
    return
  }

  const sent = await sendEmail(user, {
    html: renderRoundPublishedEmail(user, round),
    subject: `Rodada publicada: ${round.name || 'nova rodada'}`,
  })

  if (!sent) {
    return
  }

  await db
    .collection('users')
    .doc(user.id)
    .update({ [`notifiedPublishedRounds.${round.id}`]: true })

  user.notifiedPublishedRounds = { ...(user.notifiedPublishedRounds || {}), [round.id]: true }
  void now
}

async function notifyDeadlineReminder(user, { deadline, hasPredicted, key, label, now }) {
  if (user.notifyOnDeadlineReminder === false || hasPredicted || deadline <= now) {
    return
  }

  const reminderDays = typeof user.reminderDaysBefore === 'number' ? user.reminderDaysBefore : 2
  const reminderThreshold = new Date(deadline.getTime() - reminderDays * 24 * 60 * 60 * 1000)

  if (now < reminderThreshold || !isWithinPreferredHour(user, now)) {
    return
  }

  if (user.notifiedDeadlineReminders?.[key]) {
    return
  }

  const sent = await sendEmail(user, {
    html: renderDeadlineReminderEmail(user, label, deadline),
    subject: `Falta pouco: ${label}`,
  })

  if (!sent) {
    return
  }

  await db
    .collection('users')
    .doc(user.id)
    .update({ [`notifiedDeadlineReminders.${key}`]: true })

  user.notifiedDeadlineReminders = { ...(user.notifiedDeadlineReminders || {}), [key]: true }
}

function isWithinPreferredHour(user, now) {
  const preferredTime = typeof user.preferredNotificationTime === 'string' ? user.preferredNotificationTime : '18:00'
  const [hours, minutes] = preferredTime.split(':').map(Number)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return true
  }

  const nowInTz = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }))
  const preferredMinutesOfDay = hours * 60 + minutes
  const nowMinutesOfDay = nowInTz.getHours() * 60 + nowInTz.getMinutes()

  return Math.abs(nowMinutesOfDay - preferredMinutesOfDay) <= PREFERRED_HOUR_TOLERANCE_MINUTES
}

function toDate(value) {
  if (!value) {
    return null
  }

  if (typeof value.toDate === 'function') {
    return value.toDate()
  }

  if (value instanceof Date) {
    return value
  }

  return new Date(value)
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: TIMEZONE,
  }).format(date)
}

async function sendEmail(user, { html, subject }) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      html,
      subject,
      to: user.email,
    })
    console.log(`Sent "${subject}" to ${user.email}`)
    return true
  } catch (error) {
    console.error(`Failed to send "${subject}" to ${user.email}:`, error)
    return false
  }
}

function renderRoundPublishedEmail(user, round) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Novos jogos no ar!</h2>
      <p>Oi, ${escapeHtml(user.name || 'jogador')}!</p>
      <p>A <strong>${escapeHtml(round.name || 'rodada')}</strong> foi publicada no Bolao da Champions.
      Entre no site e envie seus palpites antes do prazo.</p>
      <p>
        <a href="${SITE_URL}" style="display:inline-block;padding:10px 18px;background:#1e5bff;color:#fff;text-decoration:none;border-radius:8px;">
          Fazer meus palpites
        </a>
      </p>
    </div>
  `
}

function renderDeadlineReminderEmail(user, label, deadline) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Falta pouco!</h2>
      <p>Oi, ${escapeHtml(user.name || 'jogador')}!</p>
      <p>O prazo de <strong>${escapeHtml(label)}</strong> fecha em <strong>${formatDateTime(deadline)}</strong>
      e voce ainda nao enviou todos os seus palpites.</p>
      <p>
        <a href="${SITE_URL}" style="display:inline-block;padding:10px 18px;background:#1e5bff;color:#fff;text-decoration:none;border-radius:8px;">
          Enviar palpites agora
        </a>
      </p>
    </div>
  `
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function requireEnv(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }

  return value
}

main()
  .then(() => {
    console.log('Notification check finished.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Notification check failed:', error)
    process.exit(1)
  })

import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import nodemailer from 'nodemailer'

const COMPETITION_ID = process.env.COMPETITION_ID || 'champions-2026'
const SITE_URL = process.env.SITE_URL || 'https://example.com'
const GMAIL_USER = requireEnv('GMAIL_USER')
const GMAIL_APP_PASSWORD = requireEnv('GMAIL_APP_PASSWORD')
const FROM_EMAIL = `Bolão da Champions <${GMAIL_USER}>`
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
const transporter = nodemailer.createTransport({
  auth: {
    pass: GMAIL_APP_PASSWORD,
    user: GMAIL_USER,
  },
  service: 'gmail',
})

if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) })
}

const db = getFirestore()

let failureCount = 0

async function runSafely(label, task) {
  try {
    await task()
  } catch (error) {
    failureCount += 1
    console.error(`[falha] ${label}: ${error?.message || error}`)
  }
}

async function withRetry(task, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task()
    } catch (error) {
      if (attempt === attempts) {
        throw error
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 500))
    }
  }
}

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
      await runSafely(`rodada publicada (${round.id}) para ${user.email}`, () =>
        notifyRoundPublished(user, round, now),
      )

      const hasPredictedAll = roundMatches.every((match) =>
        predictions.some((prediction) => prediction.userId === user.id && prediction.matchId === match.id),
      )

      await runSafely(`lembrete de prazo (${round.id}) para ${user.email}`, () =>
        notifyDeadlineReminder(user, {
          deadline,
          hasPredicted: hasPredictedAll,
          key: `round-${round.id}`,
          label: round.name || `Rodada ${round.number ?? ''}`,
          now,
        }),
      )
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

        await runSafely(`lembrete de mata-mata (${stage}/${leg}) para ${user.email}`, () =>
          notifyDeadlineReminder(user, {
            deadline,
            hasPredicted: hasPredictedAll,
            key: `knockout-${stage}-${leg}`,
            label,
            now,
          }),
        )
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

  await withRetry(() =>
    db
      .collection('users')
      .doc(user.id)
      .update({ [`notifiedPublishedRounds.${round.id}`]: true }),
  )

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

  await withRetry(() =>
    db
      .collection('users')
      .doc(user.id)
      .update({ [`notifiedDeadlineReminders.${key}`]: true }),
  )

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
    await transporter.sendMail({
      from: FROM_EMAIL,
      html,
      subject,
      to: user.email,
    })
    console.log(`Enviado "${subject}" para ${user.email}`)
    return true
  } catch (error) {
    failureCount += 1
    console.error(`[falha] envio de "${subject}" para ${user.email}: ${error?.message || error}`)
    return false
  }
}

function renderRoundPublishedEmail(user, round) {
  return renderEmailShell({
    body: `
      <p style="font-size:14px;color:#dbeafe;margin:0 0 10px;">Oi, ${escapeHtml(user.name || 'jogador')}!</p>
      <p style="font-size:14px;color:#dbeafe;margin:0 0 18px;line-height:1.6;">
        A <strong style="color:#ffffff;">${escapeHtml(round.name || 'rodada')}</strong> foi publicada no Bolão da
        Champions. Entre no site e envie seus palpites antes do prazo.
      </p>
    `,
    buttonLabel: 'Fazer meus palpites',
    title: 'Novos jogos no ar!',
  })
}

function renderDeadlineReminderEmail(user, label, deadline) {
  return renderEmailShell({
    body: `
      <p style="font-size:14px;color:#dbeafe;margin:0 0 10px;">Oi, ${escapeHtml(user.name || 'jogador')}!</p>
      <p style="font-size:14px;color:#dbeafe;margin:0 0 18px;line-height:1.6;">
        O prazo de <strong style="color:#ffffff;">${escapeHtml(label)}</strong> fecha em
        <strong style="color:#ffffff;">${formatDateTime(deadline)}</strong> e você ainda não enviou todos os
        seus palpites.
      </p>
    `,
    buttonLabel: 'Enviar palpites agora',
    title: 'Falta pouco!',
  })
}

function renderEmailShell({ body, buttonLabel, title }) {
  return `
    <div style="background-color:#020a2a;padding:32px 16px;">
      <div style="background-color:#020a2a;background-image:linear-gradient(160deg,#020a2a,#001a5c);border-radius:14px;padding:28px;max-width:420px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;">
        <p style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#7dd3fc;margin:0 0 8px;">
          Bolão da Champions
        </p>
        <h2 style="font-size:20px;margin:0 0 16px;color:#ffffff;">${escapeHtml(title)}</h2>
        ${body}
        <a
          href="${SITE_URL}"
          style="display:inline-block;padding:12px 20px;background-color:#38e1ff;color:#001e67;font-weight:bold;text-decoration:none;border-radius:8px;font-size:14px;"
        >
          ${escapeHtml(buttonLabel)}
        </a>
      </div>
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
    if (failureCount > 0) {
      console.error(`Verificacao concluida com ${failureCount} falha(s) — veja as linhas "[falha]" acima.`)
      process.exit(1)
    }

    console.log('Verificacao concluida sem erros.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Verificacao interrompida:', error)
    process.exit(1)
  })

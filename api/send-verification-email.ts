import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import nodemailer from 'nodemailer'

const SITE_URL = process.env.SITE_URL || 'https://example.com'
const GMAIL_USER = process.env.GMAIL_USER || ''
const FROM_EMAIL = `Bolão da Champions <${GMAIL_USER}>`

if (getApps().length === 0) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
  initializeApp({ credential: cert(serviceAccount) })
}

const transporter = nodemailer.createTransport({
  auth: {
    pass: process.env.GMAIL_APP_PASSWORD,
    user: GMAIL_USER,
  },
  service: 'gmail',
})

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
    const decoded = await getAuth().verifyIdToken(idToken)

    if (!decoded.email) {
      res.status(400).json({ error: 'Conta sem email associado.' })
      return
    }

    if (decoded.email_verified) {
      res.status(200).json({ alreadyVerified: true })
      return
    }

    const link = await getAuth().generateEmailVerificationLink(decoded.email, {
      handleCodeInApp: false,
      url: SITE_URL,
    })

    await transporter.sendMail({
      from: FROM_EMAIL,
      html: renderVerificationEmail(decoded.name || decoded.email, link),
      subject: 'Confirme seu email — Bolão da Champions',
      to: decoded.email,
    })

    res.status(200).json({ sent: true })
  } catch (error) {
    console.error('send-verification-email failed:', error)
    res.status(500).json({ error: 'Nao foi possivel enviar o email de confirmacao.' })
  }
}

function renderVerificationEmail(name: string, link: string) {
  return `
    <div style="background-color:#020a2a;padding:32px 16px;">
      <div style="background-color:#020a2a;background-image:linear-gradient(160deg,#020a2a,#001a5c);border-radius:14px;padding:28px;max-width:420px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;">
        <p style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#7dd3fc;margin:0 0 8px;">
          Bolão da Champions
        </p>
        <h2 style="font-size:20px;margin:0 0 16px;color:#ffffff;">Confirme seu email</h2>
        <p style="font-size:14px;color:#dbeafe;margin:0 0 18px;line-height:1.6;">
          Oi, ${escapeHtml(name)}! Confirme seu email para liberar seu acesso ao Bolão da Champions.
        </p>
        <a
          href="${link}"
          style="display:inline-block;padding:12px 20px;background-color:#38e1ff;color:#001e67;font-weight:bold;text-decoration:none;border-radius:8px;font-size:14px;"
        >
          Confirmar email
        </a>
        <p style="font-size:12px;color:#93b3d9;margin:18px 0 0;">
          Se você não pediu essa confirmação, pode ignorar este email.
        </p>
      </div>
    </div>
  `
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

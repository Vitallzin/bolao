import { useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../Button'
import type { NotificationPreferences, Player } from '../../types'
import './AppHeader.css'

type AppHeaderProps = {
  adminMode: boolean
  authProvider: 'google' | 'password'
  currentUser: Player
  isAdmin: boolean
  onDeleteAccount: () => Promise<void>
  onLogout: () => void
  onNotificationPreferencesUpdate: (preferences: NotificationPreferences) => Promise<void>
  onProfileNameUpdate: (name: string) => Promise<void>
  onToggleAdminMode: () => void
}

export function AppHeader({
  adminMode,
  authProvider,
  currentUser,
  isAdmin,
  onDeleteAccount,
  onLogout,
  onNotificationPreferencesUpdate,
  onProfileNameUpdate,
  onToggleAdminMode,
}: AppHeaderProps) {
  const [accountOpen, setAccountOpen] = useState(false)
  const [accountPanelStyle, setAccountPanelStyle] = useState<CSSProperties>()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const accountTriggerRef = useRef<HTMLButtonElement>(null)

  function toggleAccountMenu() {
    const nextOpen = !accountOpen

    if (nextOpen && accountTriggerRef.current) {
      const rect = accountTriggerRef.current.getBoundingClientRect()
      const panelWidth = Math.min(310, window.innerWidth - 24)
      const left = Math.min(
        Math.max(12, rect.right - panelWidth),
        Math.max(12, window.innerWidth - panelWidth - 12),
      )

      setAccountPanelStyle({
        left,
        top: rect.bottom + 10,
        width: panelWidth,
      })
    }

    setAccountOpen(nextOpen)
  }

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <Starball />
        <div>
          <span className="eyebrow">Champions 2026</span>
          <h1>Bolao dos amigos</h1>
        </div>
      </div>
      <div className="topbar__actions">
        {isAdmin ? (
          <Button
            className={adminMode ? 'active' : ''}
            onClick={onToggleAdminMode}
            variant="mode"
          >
            {adminMode ? 'Modo jogador' : 'Modo admin'}
          </Button>
        ) : null}
        <div className="account-menu">
          <button
            ref={accountTriggerRef}
            className={`account-menu__trigger ${accountOpen ? 'account-menu__trigger--open' : ''}`}
            type="button"
            aria-expanded={accountOpen}
            onClick={toggleAccountMenu}
          >
            <UserAvatar user={currentUser} />
            <span>{currentUser.name}</span>
            <b className="account-menu__arrow" aria-hidden="true">v</b>
          </button>

          {accountOpen ? createPortal(
            <>
              <button
                className="account-menu__scrim"
                type="button"
                aria-label="Fechar menu da conta"
                onClick={() => setAccountOpen(false)}
              />
              <div className="account-menu__panel" role="menu" style={accountPanelStyle}>
                <div className="account-menu__profile">
                  <UserAvatar user={currentUser} />
                  <div>
                    <strong>{currentUser.name}</strong>
                    <span>{currentUser.email}</span>
                  </div>
                </div>
                <button
                  className="account-menu__item"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setSettingsOpen(true)
                    setAccountOpen(false)
                  }}
                >
                  Configurações
                </button>
                <button
                  className="account-menu__item account-menu__logout"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setLogoutConfirmOpen(true)
                    setAccountOpen(false)
                  }}
                >
                  Sair da conta
                </button>
              </div>
            </>,
            document.body,
          ) : null}
        </div>
      </div>

      {settingsOpen ? createPortal(
        <AccountSettingsModal
          authProvider={authProvider}
          user={currentUser}
          onClose={() => setSettingsOpen(false)}
          onDeleteAccount={onDeleteAccount}
          onNotificationPreferencesUpdate={onNotificationPreferencesUpdate}
          onProfileNameUpdate={onProfileNameUpdate}
        />,
        document.body,
      ) : null}

      {logoutConfirmOpen ? createPortal(
        <LogoutConfirmModal
          onCancel={() => setLogoutConfirmOpen(false)}
          onConfirm={() => {
            setLogoutConfirmOpen(false)
            onLogout()
          }}
        />,
        document.body,
      ) : null}
    </header>
  )
}

function Starball() {
  const stars = [
    { x: 32, y: 32, r: 8 },
    { x: 32, y: 12, r: 4 },
    { x: 32, y: 52, r: 4 },
    { x: 14, y: 22, r: 4 },
    { x: 50, y: 22, r: 4 },
    { x: 14, y: 42, r: 4 },
    { x: 50, y: 42, r: 4 },
    { x: 22, y: 32, r: 3 },
    { x: 42, y: 32, r: 3 },
  ]

  return (
    <span className="brand-starball" aria-hidden="true">
      <svg viewBox="0 0 64 64" width="44" height="44" role="img">
        <defs>
          <radialGradient id="starball-face" cx="38%" cy="32%" r="72%">
            <stop offset="0%" stopColor="#0b2f7a" />
            <stop offset="100%" stopColor="#020a2a" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#starball-face)" stroke="#38e1ff" strokeWidth="1.5" />
        {stars.map((star, index) => (
          <path key={index} d={starPath(star.x, star.y, star.r)} fill={index === 0 ? '#eaf4ff' : '#8fd0ff'} />
        ))}
      </svg>
    </span>
  )
}

function starPath(cx: number, cy: number, radius: number) {
  const points = []

  for (let index = 0; index < 10; index += 1) {
    const r = index % 2 === 0 ? radius : radius * 0.42
    const angle = (Math.PI / 5) * index - Math.PI / 2
    points.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`)
  }

  return `M${points.join('L')}Z`
}

function UserAvatar({ user }: { user: Player }) {
  const [imageFailed, setImageFailed] = useState(false)

  if (user.photoURL && !imageFailed) {
    return (
      <img
        className="account-avatar"
        alt=""
        height="36"
        referrerPolicy="no-referrer"
        src={user.photoURL}
        width="36"
        onError={() => setImageFailed(true)}
      />
    )
  }

  return (
    <span className="account-avatar account-avatar--fallback" aria-hidden="true">
      {user.name.trim().charAt(0).toUpperCase() || 'J'}
    </span>
  )
}

function AccountSettingsModal({
  authProvider,
  onClose,
  onDeleteAccount,
  onNotificationPreferencesUpdate,
  onProfileNameUpdate,
  user,
}: {
  authProvider: 'google' | 'password'
  onClose: () => void
  onDeleteAccount: () => Promise<void>
  onNotificationPreferencesUpdate: (preferences: NotificationPreferences) => Promise<void>
  onProfileNameUpdate: (name: string) => Promise<void>
  user: Player
}) {
  const [name, setName] = useState(user.name)
  const [saving, setSaving] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)

    try {
      await onProfileNameUpdate(name)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="account-modal-overlay" role="presentation">
      <section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="account-settings-title">
        <div className="account-modal__header">
          <div>
            <span className="eyebrow">Conta</span>
            <h2 id="account-settings-title">Configurações</h2>
          </div>
          <button aria-label="Fechar configurações" type="button" onClick={onClose}>
            x
          </button>
        </div>

        <div className="account-settings-profile">
          <UserAvatar user={user} />
          <div>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
        </div>

        <form className="account-settings-form" onSubmit={saveName}>
          <label>
            Nickname
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <Button disabled={saving} type="submit">
            {saving ? 'Salvando...' : 'Salvar nome'}
          </Button>
        </form>

        <div className="account-google-card">
          <span>{authProvider === 'google' ? 'Google' : 'Email'}</span>
          <div>
            <strong>{user.email}</strong>
            <small>{authProvider === 'google' ? 'Conta conectada pelo Google' : 'Conta com email e senha'}</small>
          </div>
        </div>

        <NotificationSettings
          preferences={{
            notificationsEnabled: user.notificationsEnabled ?? true,
            notifyOnRoundPublished: user.notifyOnRoundPublished ?? true,
            notifyOnDeadlineReminder: user.notifyOnDeadlineReminder ?? true,
            reminderDaysBefore: user.reminderDaysBefore ?? 2,
            preferredNotificationTime: user.preferredNotificationTime ?? '18:00',
          }}
          onSave={onNotificationPreferencesUpdate}
        />

        <section className="account-danger-zone">
          <div>
            <h3>Zona de perigo</h3>
            <p>Excluir sua conta remove seu perfil e todos os seus palpites. Nao da pra desfazer.</p>
          </div>
          <button className="account-danger-button" type="button" onClick={() => setDeleteConfirmOpen(true)}>
            Excluir conta
          </button>
        </section>
      </section>

      {deleteConfirmOpen ? createPortal(
        <DeleteAccountConfirmModal
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={onDeleteAccount}
        />,
        document.body,
      ) : null}
    </div>
  )
}

function DeleteAccountConfirmModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: () => Promise<void>
}) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    setDeleting(true)
    setError('')

    try {
      await onConfirm()
    } catch {
      setError('Nao foi possivel excluir a conta agora. Saia, entre de novo e tente outra vez.')
      setDeleting(false)
    }
  }

  return (
    <div className="account-modal-overlay" role="presentation">
      <section
        className="account-modal account-modal--confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
      >
        <span className="eyebrow">Excluir conta</span>
        <h2 id="delete-account-title">Tem certeza?</h2>
        <p>
          Isso apaga seu perfil e todos os seus palpites para sempre — nao da pra desfazer. Se der erro
          de sessao, saia e entre de novo antes de tentar.
        </p>
        {error ? <p className="account-modal-error">{error}</p> : null}
        <div className="account-confirm-actions">
          <Button disabled={deleting} onClick={onCancel} variant="ghost">
            Cancelar
          </Button>
          <button className="account-danger-button" disabled={deleting} type="button" onClick={handleConfirm}>
            {deleting ? 'Excluindo...' : 'Sim, excluir conta'}
          </button>
        </div>
      </section>
    </div>
  )
}

function NotificationSettings({
  onSave,
  preferences,
}: {
  onSave: (preferences: NotificationPreferences) => Promise<void>
  preferences: NotificationPreferences
}) {
  const [draft, setDraft] = useState(preferences)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)

    try {
      await onSave(draft)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="account-notifications" onSubmit={handleSubmit}>
      <div>
        <h3>Notificações por email</h3>
        <p>Avisos de rodada nova e lembrete perto do prazo, se voce ainda nao palpitou.</p>
      </div>

      <label className="account-switch">
        <input
          checked={draft.notificationsEnabled}
          type="checkbox"
          onChange={(event) =>
            setDraft((current) => ({ ...current, notificationsEnabled: event.target.checked }))
          }
        />
        Quero receber notificações por email
      </label>

      {draft.notificationsEnabled ? (
        <>
          <label className="account-switch">
            <input
              checked={draft.notifyOnRoundPublished}
              type="checkbox"
              onChange={(event) =>
                setDraft((current) => ({ ...current, notifyOnRoundPublished: event.target.checked }))
              }
            />
            Avisar quando uma rodada nova for publicada
          </label>
          <label className="account-switch">
            <input
              checked={draft.notifyOnDeadlineReminder}
              type="checkbox"
              onChange={(event) =>
                setDraft((current) => ({ ...current, notifyOnDeadlineReminder: event.target.checked }))
              }
            />
            Lembrar se eu ainda nao palpitei perto do prazo
          </label>
          <label>
            Avisar quantos dias antes do prazo
            <input
              max={7}
              min={1}
              type="number"
              value={draft.reminderDaysBefore}
              onChange={(event) =>
                setDraft((current) => ({ ...current, reminderDaysBefore: Number(event.target.value || 1) }))
              }
            />
          </label>
          <label>
            Melhor horário para avisar
            <input
              type="time"
              value={draft.preferredNotificationTime}
              onChange={(event) =>
                setDraft((current) => ({ ...current, preferredNotificationTime: event.target.value }))
              }
            />
          </label>
        </>
      ) : null}

      <Button disabled={saving} type="submit">
        {saving ? 'Salvando...' : 'Salvar preferências'}
      </Button>
    </form>
  )
}

function LogoutConfirmModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="account-modal-overlay" role="presentation">
      <section className="account-modal account-modal--confirm" role="dialog" aria-modal="true" aria-labelledby="logout-title">
        <span className="eyebrow">Sair da conta</span>
        <h2 id="logout-title">Deseja sair?</h2>
        <p>Você precisará entrar com o Google novamente para fazer palpites.</p>
        <div className="account-confirm-actions">
          <Button onClick={onCancel} variant="ghost">
            Cancelar
          </Button>
          <button className="account-danger-button" type="button" onClick={onConfirm}>
            Sair
          </button>
        </div>
      </section>
    </div>
  )
}

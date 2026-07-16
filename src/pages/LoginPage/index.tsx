import { useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import './LoginPage.css'

type AuthMode = 'signin' | 'signup'

type LoginPageProps = {
  message: string
  onEmailLogin: (email: string, password: string) => void
  onEmailSignUp: (email: string, password: string) => void
  onGoogleLogin: () => void
}

export function LoginPage({ message, onEmailLogin, onEmailSignUp, onGoogleLogin }: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode>('signin')

  return (
    <main className="login-shell">
      <div className="login-stage">
        <section className="login-card" aria-label="Entrar no bolao">
          <strong className="login-card-brand">Bolao da Champions</strong>
          <div className="login-title">
            <span>Area do jogador</span>
            <h2>{mode === 'signin' ? 'Entrar' : 'Criar conta'}</h2>
            <p>
              {mode === 'signin'
                ? 'Entre com email e senha ou continue com o Google.'
                : 'Crie sua conta com email e senha ou continue com o Google.'}
            </p>
          </div>

          <div className="login-actions">
            <div className="auth-mode-toggle" role="tablist" aria-label="Entrar ou criar conta">
              <button
                className={mode === 'signin' ? 'active' : ''}
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
                onClick={() => setMode('signin')}
              >
                Entrar
              </button>
              <button
                className={mode === 'signup' ? 'active' : ''}
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                onClick={() => setMode('signup')}
              >
                Criar conta
              </button>
            </div>

            {mode === 'signin' ? (
              <SignInForm onSubmit={onEmailLogin} />
            ) : (
              <SignUpForm onSubmit={onEmailSignUp} />
            )}

            <div className="login-divider">
              <span>ou</span>
            </div>

            <Button onClick={onGoogleLogin} variant="google">
              <span className="google-icon">G</span>
              Continuar com Google
            </Button>

            {message ? <p className="login-error">{message}</p> : null}
          </div>
        </section>
      </div>
    </main>
  )
}

type VerifyEmailPageProps = {
  email: string
  message: string
  onCheckAgain: () => void
  onLogout: () => void
  onResend: () => void
}

export function VerifyEmailPage({ email, message, onCheckAgain, onLogout, onResend }: VerifyEmailPageProps) {
  return (
    <main className="login-shell">
      <div className="login-stage">
        <section className="login-card" aria-label="Confirme seu email">
          <strong className="login-card-brand">Bolao da Champions</strong>
          <div className="login-title">
            <span>Area do jogador</span>
            <h2>Confirme seu email</h2>
            <p>
              Mandamos um link de confirmacao para <strong>{email}</strong>. Abra seu email, clique no link
              e volte aqui.
            </p>
          </div>

          <div className="login-actions">
            <Button onClick={onCheckAgain}>Ja confirmei, verificar de novo</Button>
            <Button onClick={onResend} variant="ghost">Reenviar email</Button>
            <Button onClick={onLogout} variant="ghost">Sair</Button>
            {message ? <p className="login-error">{message}</p> : null}
          </div>
        </section>
      </div>
    </main>
  )
}

function SignInForm({ onSubmit }: { onSubmit: (email: string, password: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(email.trim(), password)
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        Email
        <input
          autoComplete="email"
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        Senha
        <input
          autoComplete="current-password"
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <Button type="submit">Entrar</Button>
    </form>
  )
}

function SignUpForm({ onSubmit }: { onSubmit: (email: string, password: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationError, setValidationError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password !== confirmPassword) {
      setValidationError('As senhas digitadas nao sao iguais.')
      return
    }

    setValidationError('')
    onSubmit(email.trim(), password)
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        Email
        <input
          autoComplete="email"
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        Senha
        <input
          autoComplete="new-password"
          minLength={6}
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <label>
        Confirmar senha
        <input
          autoComplete="new-password"
          minLength={6}
          required
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </label>
      {validationError ? <p className="login-error">{validationError}</p> : null}
      <Button type="submit">Criar conta</Button>
    </form>
  )
}

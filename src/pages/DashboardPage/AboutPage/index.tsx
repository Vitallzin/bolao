import { useState } from 'react'
import { releases } from '../../../changelog'
import { appVersion, githubUrl } from '../../../constants'
import './AboutPage.css'

const featureCards = [
  {
    icon: 'calendar' as const,
    title: 'Palpites por rodada',
    text: 'Cada rodada da fase de liga e cada confronto do mata-mata (ida e volta) tem seu próprio prazo. Depois que fecha, ninguém mais mexe.',
  },
  {
    icon: 'auto' as const,
    title: 'Pontuação automática',
    text: 'Assim que o admin publica um placar, o servidor recalcula tudo e grava no banco. Todo mundo enxerga exatamente a mesma pontuação.',
  },
  {
    icon: 'trophy' as const,
    title: 'Previsões da competição',
    text: 'Campeão, vice, artilheiro, garçom, melhor jogador e melhor goleiro. São enviados uma única vez e valem os maiores pontos do bolão.',
  },
  {
    icon: 'table' as const,
    title: 'Tabela oficial da UEFA',
    text: 'A classificação da fase de liga usa os nove critérios de desempate oficiais, do saldo de gols até a força dos adversários enfrentados.',
  },
]

const stack = [
  'React 19',
  'TypeScript',
  'Vite',
  'Firebase Auth',
  'Firestore',
  'Vercel Functions',
  'GitHub Actions',
  'CSS puro',
]

export function AboutPage() {
  return (
    <section className="content-grid">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Sobre</span>
          <h2>Bolão da Champions</h2>
        </div>
      </div>

      <article className="about-hero">
        <span className="about-version">Versão {appVersion}</span>
        <h3>O bolão da Champions entre amigos, do jeito certo.</h3>
        <p>
          Um site feito para acompanhar a UEFA Champions League com a turma: cada um manda seus
          palpites antes do prazo, o sistema conta os pontos sozinho e o ranking se atualiza na hora.
          Sem planilha, sem discussão sobre quem contou errado.
        </p>
      </article>

      <div className="about-features">
        {featureCards.map((card) => (
          <article className="about-card" key={card.title}>
            <span className="about-card__icon" aria-hidden="true">
              <FeatureIcon name={card.icon} />
            </span>
            <div>
              <strong>{card.title}</strong>
              <small>{card.text}</small>
            </div>
          </article>
        ))}
      </div>

      <article className="about-card about-card--wide">
        <div>
          <strong>Como começar</strong>
          <small>
            Crie sua conta, confirme o e-mail e peça para o admin te liberar como jogador. Enquanto
            isso você entra como visitante e já consegue ver tudo: tabela, chaveamento, estatísticas e
            o ranking. Liberado, é só palpitar antes de cada prazo — a aba <strong>Regras</strong>{' '}
            mostra quanto vale cada acerto.
          </small>
        </div>
      </article>

      <ReleaseNotes />

      <article className="about-author">
        <div className="about-author__intro">
          <span className="eyebrow">Quem fez</span>
          <h3>Vitallzin</h3>
          <p>
            Projeto pessoal, desenvolvido do zero — interface, regras de pontuação, painel do admin,
            segurança dos dados e os e-mails automáticos. Nasceu para resolver o bolão da galera e
            virou também uma vitrine do que eu sei construir.
          </p>
          <a className="about-github" href={githubUrl} rel="noreferrer noopener" target="_blank">
            <span aria-hidden="true">↗</span> github.com/Vitallzin
          </a>
        </div>

        <div className="about-stack">
          <span className="about-stack__label">Feito com</span>
          <ul>
            {stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </article>
    </section>
  )
}

/**
 * Notas de versao navegaveis. O indice 0 e a versao publicada, entao "<" volta
 * no tempo e ">" avanca — a lista ja vem da mais nova para a mais antiga.
 */
function ReleaseNotes() {
  const [index, setIndex] = useState(0)
  const release = releases[index]
  const isCurrent = index === 0

  return (
    <article className="about-notes">
      <div className="about-notes__heading">
        <div>
          <span className="eyebrow">Notas</span>
          <h3>O que mudou em cada versão</h3>
        </div>
        <div className="round-nav about-notes__nav">
          <button
            type="button"
            aria-label="Versão anterior"
            disabled={index === releases.length - 1}
            onClick={() => setIndex((current) => current + 1)}
          >
            &lt;
          </button>
          <h2>{release.version}</h2>
          <button
            type="button"
            aria-label="Versão seguinte"
            disabled={isCurrent}
            onClick={() => setIndex((current) => current - 1)}
          >
            &gt;
          </button>
        </div>
      </div>

      <div className="about-notes__meta">
        <strong>{release.title}</strong>
        <span className="about-notes__date">{formatReleaseDate(release.date)}</span>
        {isCurrent ? <span className="about-notes__badge">Versão atual</span> : null}
      </div>

      <ul className="about-notes__list">
        {release.highlights.map((highlight) => (
          <li key={highlight}>{highlight}</li>
        ))}
      </ul>
    </article>
  )
}

/** "2026-09-09" vira "9 de setembro de 2026". */
function formatReleaseDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)

  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

/**
 * Icones de linha no lugar dos emojis: emoji muda de cara em cada sistema e
 * destoa do visual da Champions. Traco em currentColor, cor vem do CSS.
 */
function FeatureIcon({ name }: { name: 'auto' | 'calendar' | 'table' | 'trophy' }) {
  const paths = {
    // Calendario com o "check" do palpite feito.
    calendar: 'M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm4 9 2 2 4-4',
    // Setas em ciclo: a pontuacao se recalcula sozinha.
    auto: 'M20 11a8 8 0 0 0-14.3-4.9L4 8m0-4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16m0 4v-4h-4',
    trophy: 'M8 4h8v5a4 4 0 0 1-8 0V4Zm0 2H5v1a3 3 0 0 0 3 3m8-4h3v1a3 3 0 0 1-3 3m-4 3v4m-4 3h8m-6-3h4',
    table: 'M4 5h16v14H4V5Zm0 5h16M4 14.5h16M9 5v14',
  }

  return (
    <svg fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width="22">
      <path d={paths[name]} />
    </svg>
  )
}

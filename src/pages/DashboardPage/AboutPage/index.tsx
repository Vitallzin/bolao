import { appVersion, githubUrl } from '../../../constants'
import './AboutPage.css'

const featureCards = [
  {
    icon: '⚽',
    title: 'Palpites por rodada',
    text: 'Cada rodada da fase de liga e cada confronto do mata-mata (ida e volta) tem seu próprio prazo. Depois que fecha, ninguém mais mexe.',
  },
  {
    icon: '🎯',
    title: 'Pontuação automática',
    text: 'Assim que o admin publica um placar, o servidor recalcula tudo e grava no banco. Todo mundo enxerga exatamente a mesma pontuação.',
  },
  {
    icon: '🏆',
    title: 'Previsões da competição',
    text: 'Campeão, vice, artilheiro, garçom, melhor jogador e melhor goleiro. São enviados uma única vez e valem os maiores pontos do bolão.',
  },
  {
    icon: '📊',
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
              {card.icon}
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

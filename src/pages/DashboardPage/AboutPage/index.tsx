import { appVersion, githubUrl } from '../../../constants'
import './AboutPage.css'

const featureCards = [
  {
    icon: '⚽',
    title: 'Palpites por rodada',
    text: 'Cada rodada da fase de liga e cada confronto do mata-mata (ida e volta) tem seu proprio prazo. Depois que fecha, ninguem mais mexe.',
  },
  {
    icon: '🎯',
    title: 'Pontuacao automatica',
    text: 'Assim que o admin publica um placar, o servidor recalcula tudo e grava no banco. Todo mundo enxerga exatamente a mesma pontuacao.',
  },
  {
    icon: '🏆',
    title: 'Previsoes da competicao',
    text: 'Campeao, vice, artilheiro, garcom, melhor jogador e melhor goleiro. Sao enviados uma unica vez e valem os maiores pontos do bolao.',
  },
  {
    icon: '📊',
    title: 'Tabela oficial da UEFA',
    text: 'A classificacao da fase de liga usa os nove criterios de desempate oficiais, do saldo de gols ate a forca dos adversarios enfrentados.',
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
          <h2>Bolao da Champions</h2>
        </div>
      </div>

      <article className="about-hero">
        <span className="about-version">Versao {appVersion}</span>
        <h3>O bolao da Champions entre amigos, do jeito certo.</h3>
        <p>
          Um site feito para acompanhar a UEFA Champions League com a turma: cada um manda seus
          palpites antes do prazo, o sistema conta os pontos sozinho e o ranking se atualiza na hora.
          Sem planilha, sem discussao sobre quem contou errado.
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
          <strong>Como comecar</strong>
          <small>
            Crie sua conta, confirme o e-mail e peca para o admin te liberar como jogador. Enquanto
            isso voce entra como visitante e ja consegue ver tudo: tabela, chaveamento, estatisticas e
            o ranking. Liberado, e so palpitar antes de cada prazo — a aba <strong>Regras</strong>{' '}
            mostra quanto vale cada acerto.
          </small>
        </div>
      </article>

      <article className="about-author">
        <div className="about-author__intro">
          <span className="eyebrow">Quem fez</span>
          <h3>Vitallzin</h3>
          <p>
            Projeto pessoal, desenvolvido do zero — interface, regras de pontuacao, painel do admin,
            seguranca dos dados e os e-mails automaticos. Nasceu para resolver o bolao da galera e
            virou tambem uma vitrine do que eu sei construir.
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

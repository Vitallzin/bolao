import { competitionPredictionPoints, stagePointTables } from '../../../utils/scoring'
import './RulesPage.css'

const stageRows = [
  { label: 'Fase de liga e playoffs', table: stagePointTables.early },
  { label: 'Oitavas', table: stagePointTables.early },
  { label: 'Quartas', table: stagePointTables.quartas },
  { label: 'Semifinais', table: stagePointTables.semis },
  { label: 'Final', table: stagePointTables.final },
]

export function RulesPage() {
  return (
    <section className="content-grid">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Como funciona</span>
          <h2>Regras do bolao</h2>
        </div>
      </div>

      <article className="rules-card">
        <h3>Como os pontos sao contados</h3>
        <p>
          Em cada jogo, o que conta e o <strong>erro total de gols</strong>: a diferenca do placar do
          mandante mais a diferenca do placar do visitante.
        </p>
        <p className="rules-example">
          Exemplo: voce palpitou <strong>2x1</strong> e o jogo terminou <strong>2x0</strong>. O mandante
          voce acertou (erro 0) e o visitante errou por 1 gol — entao o erro total e <strong>1</strong>.
        </p>
        <p>
          O <strong>bonus de resultado</strong> vale quando voce acerta quem venceu (ou o empate), mesmo
          errando o placar. Ele soma junto, menos quando voce crava o placar exato — nesse caso ja vale a
          pontuacao cheia.
        </p>
      </article>

      <article className="rules-card">
        <h3>Pontos por fase</h3>
        <p>Quanto mais adiantada a fase, mais vale o palpite.</p>

        <div className="rules-table-wrap">
          <table className="rules-table">
            <thead>
              <tr>
                <th>Fase</th>
                <th>Placar exato</th>
                <th>Erro de 1 gol</th>
                <th>Erro de 2 gols</th>
                <th>Bonus de resultado</th>
              </tr>
            </thead>
            <tbody>
              {stageRows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.table.exact}</td>
                  <td>{row.table.offByOne}</td>
                  <td>{row.table.offByTwo}</td>
                  <td>+{row.table.resultBonus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="rules-note">
          Errou por mais de 2 gols? Ainda leva o bonus de resultado, se acertou quem venceu.
        </p>
      </article>

      <article className="rules-card">
        <h3>Previsoes da competicao</h3>
        <p>
          Sao enviadas <strong>uma unica vez</strong>, antes do prazo da primeira rodada, e so viram
          pontos quando o admin publica o resultado oficial no fim da competicao.
        </p>

        <ul className="rules-list">
          <li>
            <strong>Artilheiro e garcom (top 5)</strong> —{' '}
            {competitionPredictionPoints.topFiveExactPosition} pontos por nome certo na posicao certa, ou{' '}
            {competitionPredictionPoints.topFiveWrongPosition} se o nome esta na lista mas em outra
            posicao.
          </li>
          <li>
            <strong>Melhor jogador</strong> — {competitionPredictionPoints.bestPlayer} pontos.
          </li>
          <li>
            <strong>Melhor goleiro</strong> — {competitionPredictionPoints.bestGoalkeeper} pontos.
          </li>
          <li>
            <strong>Campeao</strong> — {competitionPredictionPoints.champion} pontos.
          </li>
          <li>
            <strong>Vice-campeao</strong> — {competitionPredictionPoints.runnerUp} pontos.
          </li>
          <li>
            <strong>Trocou os finalistas?</strong> — {competitionPredictionPoints.swappedFinalist} pontos
            de consolacao se o time que voce apontou chegou na final, mas na outra posicao.
          </li>
        </ul>
      </article>

      <article className="rules-card">
        <h3>Prazos</h3>
        <ul className="rules-list">
          <li>
            <strong>Rodadas da fase de liga</strong> — cada rodada tem seu proprio prazo, mostrado na
            aba Palpites. Depois que fecha, os campos travam e nao da mais para editar.
          </li>
          <li>
            <strong>Mata-mata</strong> — ida e volta tem prazos separados. O prazo da ida vale para
            todos os jogos daquela fase, e o mesmo para a volta.
          </li>
          <li>
            <strong>Previsoes da competicao</strong> — o prazo e o mesmo da primeira rodada. Depois
            disso nao da para enviar nem alterar.
          </li>
        </ul>
        <p className="rules-note">
          Vale palpitar cedo: o prazo fecha na hora marcada, sem prorrogacao.
        </p>
      </article>

      <article className="rules-card">
        <h3>Ranking</h3>
        <p>
          Sua pontuacao e a soma dos tres blocos: rodadas + mata-mata + previsoes da competicao. Os
          pontos de um jogo so entram depois que o admin <strong>publica o placar</strong> daquele jogo.
        </p>
        <p className="rules-note">
          O calculo e feito no servidor e salvo no banco, entao todo mundo ve exatamente a mesma
          pontuacao.
        </p>
      </article>
    </section>
  )
}

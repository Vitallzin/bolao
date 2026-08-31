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
          <h2>Regras do bolão</h2>
        </div>
      </div>

      <article className="rules-card">
        <h3>Como os pontos são contados</h3>
        <p>
          Em cada jogo, o que conta é o <strong>erro total de gols</strong>: a diferença do placar do
          mandante mais a diferença do placar do visitante.
        </p>
        <p className="rules-example">
          Exemplo: você palpitou <strong>2x1</strong> e o jogo terminou <strong>2x0</strong>. O mandante
          você acertou (erro 0) e o visitante errou por 1 gol — então o erro total é <strong>1</strong>.
        </p>
        <p>
          O <strong>bônus de resultado</strong> vale quando você acerta quem venceu (ou o empate), mesmo
          errando o placar. Ele soma junto, menos quando você crava o placar exato — nesse caso já vale a
          pontuação cheia.
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
                <th>Bônus de resultado</th>
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
          Errou por mais de 2 gols? Ainda leva o bônus de resultado, se acertou quem venceu.
        </p>
      </article>

      <article className="rules-card">
        <h3>Previsões da competição</h3>
        <p>
          São enviadas <strong>uma única vez</strong>, até o prazo próprio das previsões, e só viram
          pontos quando o admin publica o resultado oficial no fim da competição.
        </p>

        <ul className="rules-list">
          <li>
            <strong>Artilheiro e garçom (top 5)</strong> —{' '}
            {competitionPredictionPoints.topFiveExactPosition} pontos por nome certo na posição certa, ou{' '}
            {competitionPredictionPoints.topFiveWrongPosition} se o nome está na lista mas em outra
            posição.
          </li>
          <li>
            <strong>Melhor jogador</strong> — {competitionPredictionPoints.bestPlayer} pontos.
          </li>
          <li>
            <strong>Melhor goleiro</strong> — {competitionPredictionPoints.bestGoalkeeper} pontos.
          </li>
          <li>
            <strong>Campeão</strong> — {competitionPredictionPoints.champion} pontos.
          </li>
          <li>
            <strong>Vice-campeão</strong> — {competitionPredictionPoints.runnerUp} pontos.
          </li>
          <li>
            <strong>Trocou os finalistas?</strong> — {competitionPredictionPoints.swappedFinalist} pontos
            de consolação se o time que você apontou chegou na final, mas na outra posição.
          </li>
        </ul>
      </article>

      <article className="rules-card">
        <h3>Prazos</h3>
        <ul className="rules-list">
          <li>
            <strong>Rodadas da fase de liga</strong> — cada rodada tem seu próprio prazo, mostrado na
            aba Palpites. Depois que fecha, os campos travam e não dá mais para editar.
          </li>
          <li>
            <strong>Mata-mata</strong> — ida e volta têm prazos separados. O prazo da ida vale para
            todos os jogos daquela fase, e o mesmo para a volta.
          </li>
          <li>
            <strong>Previsões da competição</strong> — têm prazo próprio, independente das rodadas,
            mostrado na aba Previsões. Depois disso não dá para enviar nem alterar.
          </li>
        </ul>
        <p className="rules-note">
          Vale palpitar cedo: o prazo fecha na hora marcada, sem prorrogação.
        </p>
      </article>

      <article className="rules-card">
        <h3>Ranking</h3>
        <p>
          Sua pontuação é a soma dos três blocos: rodadas + mata-mata + previsões da competição. Os
          pontos de um jogo só entram depois que o admin <strong>publica o placar</strong> daquele jogo.
        </p>
        <p className="rules-note">
          O cálculo é feito no servidor e salvo no banco, então todo mundo vê exatamente a mesma
          pontuação.
        </p>
      </article>
    </section>
  )
}

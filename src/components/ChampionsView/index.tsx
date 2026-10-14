import { EmptyState } from '../EmptyState'
import { TeamBadge } from '../TeamBadge'
import { buildStandings, getQualificationZone } from '../../utils/scoring'
import './ChampionsView.css'

type ChampionsViewProps = {
  standings: ReturnType<typeof buildStandings>
}

export function ChampionsView({ standings }: ChampionsViewProps) {
  if (standings.length === 0) {
    return (
      <EmptyState
        title="Sem times cadastrados"
        text="Cadastre os times no painel admin para montar a tabela."
      />
    )
  }

  return (
    <section className="content-grid">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Fase de liga</span>
          <h2>Tabela da Champions</h2>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>J</th>
              <th className="col-optional">V</th>
              <th className="col-optional">E</th>
              <th className="col-optional">D</th>
              <th>SG</th>
              <th className="col-points">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, index) => (
              <tr className={`standings-row standings-row--${getQualificationZone(index + 1) ?? 'out'}`} key={row.team.id}>
                <td>
                  <TeamBadge rank={index + 1} team={row.team} />
                </td>
                <td>{row.played}</td>
                <td className="col-optional">{row.wins}</td>
                <td className="col-optional">{row.draws}</td>
                <td className="col-optional">{row.losses}</td>
                <td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                <td className="col-points">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="standings-legend" aria-label="Legenda da tabela">
        <li className="standings-legend__item standings-legend__item--direct">Oitavas de final</li>
        <li className="standings-legend__item standings-legend__item--playoff">Playoffs</li>
        <li className="standings-legend__item standings-legend__item--out">Eliminado</li>
      </ul>
    </section>
  )
}

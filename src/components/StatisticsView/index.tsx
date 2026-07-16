import { NationalityFlag } from '../NationalityFlag'
import type { PlayerStat, Team } from '../../types'
import './StatisticsView.css'

type StatisticsViewProps = {
  playerStats: PlayerStat[]
  teamMap: Map<string, Team>
}

type StatisticMetric = 'goals' | 'assists' | 'goalParticipations'

export function StatisticsView({ playerStats, teamMap }: StatisticsViewProps) {
  return (
    <section className="content-grid">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Jogadores</span>
          <h2>Estatísticas</h2>
        </div>
      </div>

      <div className="player-rankings-grid">
        <PlayerRanking
          metric="goals"
          playerStats={playerStats}
          teamMap={teamMap}
          title="Artilharia"
        />
        <PlayerRanking
          metric="assists"
          playerStats={playerStats}
          teamMap={teamMap}
          title="Assistências"
        />
        <PlayerRanking
          metric="goalParticipations"
          playerStats={playerStats}
          teamMap={teamMap}
          title="P/A"
        />
      </div>
    </section>
  )
}

function PlayerRanking({
  metric,
  playerStats,
  teamMap,
  title,
}: {
  metric: StatisticMetric
  playerStats: PlayerStat[]
  teamMap: Map<string, Team>
  title: string
}) {
  const rows = [...playerStats]
    .sort((a, b) => getMetricValue(b, metric) - getMetricValue(a, metric) || a.name.localeCompare(b.name))
    .slice(0, 10)

  return (
    <section className="player-ranking-card">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <p className="muted-text">Nenhum jogador cadastrado.</p>
      ) : (
        <div className="player-ranking-list">
          {rows.map((player, index) => (
            <article className="player-ranking-row" key={player.id}>
              <strong>{index + 1}</strong>
              <NationalityFlag nationalityCode={player.nationalityCode} />
              <div>
                <span>{player.name}</span>
                <small>{teamMap.get(player.teamId)?.name ?? 'Time não definido'}</small>
              </div>
              <b>{getMetricValue(player, metric)}</b>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function getMetricValue(player: PlayerStat, metric: StatisticMetric) {
  if (metric === 'goals') {
    return player.goals
  }

  if (metric === 'assists') {
    return player.assists
  }

  return player.goals + player.assists
}

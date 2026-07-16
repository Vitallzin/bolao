import { StatisticsView } from '../../../components/StatisticsView'
import type { PlayerStat, Team } from '../../../types'

type StatisticsPageProps = {
  playerStats: PlayerStat[]
  teamMap: Map<string, Team>
}

export function StatisticsPage({ playerStats, teamMap }: StatisticsPageProps) {
  return <StatisticsView playerStats={playerStats} teamMap={teamMap} />
}

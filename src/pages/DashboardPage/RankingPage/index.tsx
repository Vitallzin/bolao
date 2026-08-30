import { RankingView } from '../../../components/RankingView'
import type { Player, RankingEntry } from '../../../types'
import './RankingPage.css'

type RankingPageProps = {
  lastScoredRoundId?: string | null
  players: Player[]
  ranking: RankingEntry[]
}

export function RankingPage({ lastScoredRoundId, players, ranking }: RankingPageProps) {
  return <RankingView lastScoredRoundId={lastScoredRoundId} players={players} ranking={ranking} />
}

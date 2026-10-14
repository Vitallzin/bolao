import { RankingView } from '../../../components/RankingView'
import type { Player, RankingEntry } from '../../../types'
import './RankingPage.css'

type RankingPageProps = {
  currentUserId: string
  lastScoredRoundId?: string | null
  players: Player[]
  ranking: RankingEntry[]
}

export function RankingPage({ currentUserId, lastScoredRoundId, players, ranking }: RankingPageProps) {
  return (
    <RankingView
      currentUserId={currentUserId}
      lastScoredRoundId={lastScoredRoundId}
      players={players}
      ranking={ranking}
    />
  )
}

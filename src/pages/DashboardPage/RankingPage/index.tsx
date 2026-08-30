import { RankingView } from '../../../components/RankingView'
import type { RankingEntry } from '../../../types'
import './RankingPage.css'

type RankingPageProps = {
  lastScoredRoundId?: string | null
  ranking: RankingEntry[]
}

export function RankingPage({ lastScoredRoundId, ranking }: RankingPageProps) {
  return <RankingView lastScoredRoundId={lastScoredRoundId} ranking={ranking} />
}

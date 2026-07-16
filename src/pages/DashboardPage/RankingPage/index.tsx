import { RankingView } from '../../../components/RankingView'
import type { Player } from '../../../types'
import './RankingPage.css'

type RankingPageProps = {
  ranking: Array<Player & { points: number }>
}

export function RankingPage({ ranking }: RankingPageProps) {
  return <RankingView ranking={ranking} />
}

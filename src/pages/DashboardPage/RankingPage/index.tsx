import { RankingView } from '../../../components/RankingView'
import type { RankingEntry } from '../../../types'
import './RankingPage.css'

type RankingPageProps = {
  ranking: RankingEntry[]
}

export function RankingPage({ ranking }: RankingPageProps) {
  return <RankingView ranking={ranking} />
}

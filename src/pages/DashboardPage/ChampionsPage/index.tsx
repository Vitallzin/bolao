import { ChampionsView } from '../../../components/ChampionsView'
import { buildStandings } from '../../../utils/scoring'
import './ChampionsPage.css'

type ChampionsPageProps = {
  standings: ReturnType<typeof buildStandings>
}

export function ChampionsPage({ standings }: ChampionsPageProps) {
  return <ChampionsView standings={standings} />
}

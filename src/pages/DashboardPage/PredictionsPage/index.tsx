import { PredictionsView } from '../../../components/PredictionsView'
import type {
  KnockoutPrediction,
  KnockoutTie,
  Match,
  Player,
  Prediction,
  RankingEntry,
  Round,
  Team,
} from '../../../types'
import './PredictionsPage.css'

type PredictionsPageProps = {
  currentUser: Player
  knockout: KnockoutTie[]
  knockoutPredictions: KnockoutPrediction[]
  matches: Match[]
  onKnockoutPredictionChange: (
    tieId: string,
    leg: 'home' | 'away',
    side: 'homeScore' | 'awayScore',
    value: string,
  ) => void
  onPredictionChange: (matchId: string, side: 'homeScore' | 'awayScore', value: string) => void
  predictions: Prediction[]
  ranking: RankingEntry[]
  rounds: Round[]
  teamMap: Map<string, Team>
}

export function PredictionsPage(props: PredictionsPageProps) {
  return <PredictionsView {...props} />
}

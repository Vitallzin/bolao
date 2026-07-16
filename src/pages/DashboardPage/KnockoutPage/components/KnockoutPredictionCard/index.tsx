import { TeamBadge } from '../../../../../components/TeamBadge'
import type { KnockoutPrediction, KnockoutTie, Player, Team } from '../../../../../types'
import { calculateKnockoutPredictionPoints } from '../../../../../utils/scoring'
import './KnockoutPredictionCard.css'

type KnockoutPredictionCardProps = {
  currentUser: Player
  knockoutPredictions: KnockoutPrediction[]
  leg: 'home' | 'away'
  onKnockoutPredictionChange: (
    tieId: string,
    leg: 'home' | 'away',
    side: 'homeScore' | 'awayScore',
    value: string,
  ) => void
  teamMap: Map<string, Team>
  tie: KnockoutTie
}

export function KnockoutPredictionCard({
  currentUser,
  knockoutPredictions,
  leg,
  onKnockoutPredictionChange,
  teamMap,
  tie,
}: KnockoutPredictionCardProps) {
  const homeTeam = tie.homeTeamId ? teamMap.get(tie.homeTeamId) : undefined
  const awayTeam = tie.awayTeamId ? teamMap.get(tie.awayTeamId) : undefined
  const prediction = knockoutPredictions.find(
    (item) => item.userId === currentUser.id && item.tieId === tie.id && item.leg === leg,
  )
  const deadline = leg === 'home' ? tie.homeLegDeadline : tie.awayLegDeadline
  const locked = !deadline || new Date() >= deadline
  const isPublished = leg === 'home'
    ? Boolean(tie.homeLegScorePublished || tie.scorePublished)
    : Boolean(tie.awayLegScorePublished || tie.scorePublished)
  const points = isPublished && prediction
    ? calculateKnockoutPredictionPoints({
      awayScore: prediction.awayScore,
      homeScore: prediction.homeScore,
      leg,
      tie,
    })
    : null
  const firstTeam = leg === 'home' ? homeTeam : awayTeam
  const secondTeam = leg === 'home' ? awayTeam : homeTeam
  const firstScore = leg === 'home' ? prediction?.homeScore : prediction?.awayScore
  const secondScore = leg === 'home' ? prediction?.awayScore : prediction?.homeScore
  const firstSide = leg === 'home' ? 'homeScore' : 'awayScore'
  const secondSide = leg === 'home' ? 'awayScore' : 'homeScore'

  return (
    <article className="knockout-prediction-card">
      <strong>Jogo {tie.order}</strong>

      <div className="knockout-prediction-row">
        <TeamBadge team={firstTeam} />
        <input
          disabled={locked}
          min="0"
          placeholder="0"
          type="number"
          value={firstScore ?? ''}
          onChange={(event) => onKnockoutPredictionChange(tie.id, leg, firstSide, event.target.value)}
        />
        <span>x</span>
        <input
          disabled={locked}
          min="0"
          placeholder="0"
          type="number"
          value={secondScore ?? ''}
          onChange={(event) => onKnockoutPredictionChange(tie.id, leg, secondSide, event.target.value)}
        />
        <TeamBadge align="right" team={secondTeam} />
      </div>

      {points !== null ? <strong className="knockout-prediction-points">{points} pts</strong> : null}
    </article>
  )
}

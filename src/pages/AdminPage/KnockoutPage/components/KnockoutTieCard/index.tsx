import { Button } from '../../../../../components/Button'
import { TeamBadge } from '../../../../../components/TeamBadge'
import type { KnockoutTie, Team } from '../../../../../types'
import type { KnockoutScoreField } from '../../../index'
import { knockoutStageLabel } from '../../constants'

type KnockoutTieCardProps = {
  onKnockoutScoreChange: (tieId: string, field: KnockoutScoreField, value: string) => void
  onPublishKnockoutScore: (tieId: string) => void
  onWinnerChange: (tieId: string, winnerTeamId: string) => void
  showWinner?: boolean
  teamMap: Map<string, Team>
  tie: KnockoutTie
}

export function KnockoutTieCard({
  onKnockoutScoreChange,
  onPublishKnockoutScore,
  onWinnerChange,
  showWinner = true,
  teamMap,
  tie,
}: KnockoutTieCardProps) {
  const options = [tie.homeTeamId, tie.awayTeamId].filter(Boolean) as string[]

  return (
    <article className="knockout-tie-card">
      <span className="knockout-tie-card__stage">{knockoutStageLabel.get(tie.stage) ?? tie.stage}</span>
      <div className="knockout-teams">
        <TeamBadge team={tie.homeTeamId ? teamMap.get(tie.homeTeamId) : undefined} />
        <TeamBadge team={tie.awayTeamId ? teamMap.get(tie.awayTeamId) : undefined} />
      </div>
      <div className="leg-score-grid">
        <span>Ida</span>
        <input
          min="0"
          type="number"
          value={tie.homeLegHomeScore ?? ''}
          onChange={(event) => onKnockoutScoreChange(tie.id, 'homeLegHomeScore', event.target.value)}
        />
        <span>x</span>
        <input
          min="0"
          type="number"
          value={tie.homeLegAwayScore ?? ''}
          onChange={(event) => onKnockoutScoreChange(tie.id, 'homeLegAwayScore', event.target.value)}
        />
        <span>Volta</span>
        <input
          min="0"
          type="number"
          value={tie.awayLegHomeScore ?? ''}
          onChange={(event) => onKnockoutScoreChange(tie.id, 'awayLegHomeScore', event.target.value)}
        />
        <span>x</span>
        <input
          min="0"
          type="number"
          value={tie.awayLegAwayScore ?? ''}
          onChange={(event) => onKnockoutScoreChange(tie.id, 'awayLegAwayScore', event.target.value)}
        />
      </div>
      {showWinner ? (
        <select
          aria-label="Quem passou"
          disabled={options.length < 2}
          value={tie.winnerTeamId ?? ''}
          onChange={(event) => onWinnerChange(tie.id, event.target.value)}
        >
          <option value="">Quem passou</option>
          {options.map((teamId) => (
            <option key={teamId} value={teamId}>
              {teamMap.get(teamId)?.name}
            </option>
          ))}
        </select>
      ) : null}
      <Button onClick={() => onPublishKnockoutScore(tie.id)} variant="ghost">
        {tie.scorePublished ? 'Placar publicado' : 'Publicar placar'}
      </Button>
    </article>
  )
}

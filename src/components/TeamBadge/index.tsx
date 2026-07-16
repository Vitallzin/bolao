import type { Team } from '../../types'
import { getFlagUrl } from '../../utils/europeanCountries'
import './TeamBadge.css'

type TeamBadgeProps = {
  align?: 'left' | 'right'
  rank?: number
  team?: Team
}

export function TeamBadge({ align = 'left', rank, team }: TeamBadgeProps) {
  if (!team) {
    return <span className="team-badge team-badge--empty">A definir</span>
  }

  const flagUrl = getFlagUrl(team.countryCode)

  return (
    <span className={`team-badge team-badge--${align}`}>
      <span className="team-badge__chip" style={{ backgroundColor: team.color ?? '#073b91' }}>
        {rank ?? team.shortName}
      </span>
      <img alt="" height="24" loading="lazy" src={flagUrl} width="24" />
      <span>{team.name}</span>
    </span>
  )
}

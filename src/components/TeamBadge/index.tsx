import type { Team } from '../../types'
import { getFlagUrl } from '../../utils/europeanCountries'
import { getQualificationZone } from '../../utils/scoring'
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
  const qualificationZone = rank ? getQualificationZone(rank) : null

  return (
    <span className={`team-badge team-badge--${align}`}>
      {rank ? (
        // Fora da zona de classificacao a posicao aparece sem o quadrado.
        qualificationZone ? (
          <span className={`team-badge__chip team-badge__chip--${qualificationZone}`}>{rank}</span>
        ) : (
          <span className="team-badge__rank">{rank}</span>
        )
      ) : (
        <span className="team-badge__chip" style={{ backgroundColor: team.color ?? '#073b91' }}>
          {team.shortName}
        </span>
      )}
      <img alt="" height="24" loading="lazy" src={flagUrl} width="24" />
      <span className="team-badge__name">{team.name}</span>
    </span>
  )
}


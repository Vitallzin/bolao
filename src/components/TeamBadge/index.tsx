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
      <span>{team.name}</span>
    </span>
  )
}

/** 1o-8o vao direto as oitavas, 9o-24o disputam os playoffs, o resto esta eliminado. */
function getQualificationZone(rank: number) {
  if (rank <= 8) {
    return 'direct'
  }

  if (rank <= 24) {
    return 'playoff'
  }

  return null
}

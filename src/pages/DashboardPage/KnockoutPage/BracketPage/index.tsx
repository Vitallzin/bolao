import { KnockoutBracket } from '../../../../components/KnockoutBracket'
import type { KnockoutTie, Team } from '../../../../types'
import './BracketPage.css'

type BracketPageProps = {
  knockout: KnockoutTie[]
  teamMap: Map<string, Team>
}

export function BracketPage({ knockout, teamMap }: BracketPageProps) {
  return (
    <div className="knockout-bracket-page">
      <KnockoutBracket knockout={knockout} teamMap={teamMap} />
    </div>
  )
}

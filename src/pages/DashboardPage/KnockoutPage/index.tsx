import type { KnockoutTie, Team } from '../../../types'
import { BracketPage } from './BracketPage'
import './KnockoutPage.css'

type KnockoutPageProps = {
  knockout: KnockoutTie[]
  teamMap: Map<string, Team>
}

export function KnockoutPage({ knockout, teamMap }: KnockoutPageProps) {
  return (
    <section className="content-grid">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Chaveamento</span>
          <h2>Mata-mata</h2>
        </div>
      </div>

      <BracketPage knockout={knockout} teamMap={teamMap} />
    </section>
  )
}

import { useState } from 'react'
import { KnockoutBracket } from '../KnockoutBracket'
import { TeamBadge } from '../TeamBadge'
import type { KnockoutTie, Team } from '../../types'
import './KnockoutView.css'

type KnockoutViewProps = {
  knockout: KnockoutTie[]
  onWinnerChange: (tieId: string, winnerTeamId: string) => void
  teamMap: Map<string, Team>
}

export function KnockoutView({ knockout, onWinnerChange, teamMap }: KnockoutViewProps) {
  const [activePhase, setActivePhase] = useState<'playoffs' | 'bracket'>('playoffs')
  const playoffs = knockout.filter((tie) => tie.stage === 'playoffs')

  return (
    <section className="content-grid">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Chaveamento</span>
          <h2>Mata-mata</h2>
        </div>
      </div>

      <div className="knockout-phase-nav" aria-label="Navegação do mata-mata">
        {activePhase === 'playoffs' ? (
          <>
            <h3>Playoffs</h3>
            <button aria-label="Ir para mata-mata" type="button" onClick={() => setActivePhase('bracket')}>
              &gt;
            </button>
          </>
        ) : (
          <>
            <button aria-label="Voltar para playoffs" type="button" onClick={() => setActivePhase('playoffs')}>
              &lt;
            </button>
            <h3>Mata-mata</h3>
          </>
        )}
      </div>

      {activePhase === 'playoffs' ? (
        <section className="knockout-playoffs">
          <div className="knockout-playoffs__heading">
            <span className="eyebrow">Rodada de playoffs</span>
            <h3>Playoffs</h3>
          </div>
          {playoffs.length === 0 ? (
            <p className="muted-text">Os jogos dos playoffs aparecem aqui quando forem cadastrados.</p>
          ) : (
            <div className="knockout-playoffs__grid">
              {playoffs.map((tie) => (
                <article className="knockout-playoff-card" key={tie.id}>
                  <TeamBadge team={tie.homeTeamId ? teamMap.get(tie.homeTeamId) : undefined} />
                  <TeamBadge team={tie.awayTeamId ? teamMap.get(tie.awayTeamId) : undefined} />
                  {tie.winnerTeamId ? (
                    <strong>Passou: {teamMap.get(tie.winnerTeamId)?.name}</strong>
                  ) : (
                    <span>Aguardando classificado</span>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {activePhase === 'bracket' ? (
        <KnockoutBracket knockout={knockout} teamMap={teamMap} onWinnerChange={onWinnerChange} />
      ) : null}
    </section>
  )
}

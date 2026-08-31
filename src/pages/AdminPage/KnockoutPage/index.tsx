import { useState, type FormEvent } from 'react'
import type { KnockoutTie, Team } from '../../../types'
import type { KnockoutScoreField } from '../index'
import { BracketPage } from './BracketPage'
import { PlayoffsPage } from './PlayoffsPage'
import './KnockoutPage.css'

type KnockoutPageProps = {
  knockout: KnockoutTie[]
  onAddKnockoutTie: (event: FormEvent<HTMLFormElement>) => void
  onDeleteKnockoutTie: (tieId: string) => void
  onKnockoutLegDeadlineChange: (stage: string, leg: 'home' | 'away', value: string) => void
  onKnockoutScoreChange: (tieId: string, field: KnockoutScoreField, value: string) => void
  onKnockoutTeamSlotChange: (tieId: string, slot: 'home' | 'away', teamId: string) => void
  onPublishKnockoutScore: (tieId: string, leg?: 'home' | 'away') => void
  onSaveRoundOf16: (event: FormEvent<HTMLFormElement>) => void
  onWinnerChange: (tieId: string, winnerTeamId: string) => void
  teamMap: Map<string, Team>
  teams: Team[]
}

export function KnockoutPage({
  knockout,
  onAddKnockoutTie,
  onDeleteKnockoutTie,
  onKnockoutLegDeadlineChange,
  onKnockoutScoreChange,
  onKnockoutTeamSlotChange,
  onPublishKnockoutScore,
  onSaveRoundOf16,
  onWinnerChange,
  teamMap,
  teams,
}: KnockoutPageProps) {
  const [activeKnockoutPhase, setActiveKnockoutPhase] = useState<'playoffs' | 'bracket'>('playoffs')

  return (
    <div className="knockout-manager">
      <div className="knockout-admin-nav" aria-label="Navegação do mata-mata no admin">
        {activeKnockoutPhase === 'playoffs' ? (
          <>
            <span className="knockout-nav-spacer" aria-hidden="true" />
            <h2>Playoffs</h2>
            <button aria-label="Ir para mata-mata" type="button" onClick={() => setActiveKnockoutPhase('bracket')}>
              &gt;
            </button>
          </>
        ) : (
          <>
            <button aria-label="Voltar para playoffs" type="button" onClick={() => setActiveKnockoutPhase('playoffs')}>
              &lt;
            </button>
            <h2>Mata-mata</h2>
            <span className="knockout-nav-spacer" aria-hidden="true" />
          </>
        )}
      </div>

      {activeKnockoutPhase === 'playoffs' ? (
        <PlayoffsPage
          knockout={knockout}
          teamMap={teamMap}
          teams={teams}
          onAddKnockoutTie={onAddKnockoutTie}
          onDeleteKnockoutTie={onDeleteKnockoutTie}
          onKnockoutScoreChange={onKnockoutScoreChange}
          onPublishKnockoutScore={onPublishKnockoutScore}
        />
      ) : null}

      {activeKnockoutPhase === 'bracket' ? (
        <BracketPage
          knockout={knockout}
          teamMap={teamMap}
          teams={teams}
          onKnockoutLegDeadlineChange={onKnockoutLegDeadlineChange}
          onKnockoutScoreChange={onKnockoutScoreChange}
          onKnockoutTeamSlotChange={onKnockoutTeamSlotChange}
          onPublishKnockoutScore={onPublishKnockoutScore}
          onSaveRoundOf16={onSaveRoundOf16}
          onWinnerChange={onWinnerChange}
        />
      ) : null}
    </div>
  )
}

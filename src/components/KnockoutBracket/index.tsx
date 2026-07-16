import type { CSSProperties } from 'react'
import { TeamBadge } from '../TeamBadge'
import type { KnockoutTie, Team } from '../../types'
import './KnockoutBracket.css'

type BracketStageId = 'oitavas' | 'quartas' | 'semis' | 'final'

type KnockoutBracketProps = {
  knockout: KnockoutTie[]
  mode?: 'admin' | 'view'
  onTeamSlotChange?: (tieId: string, slot: 'home' | 'away', teamId: string) => void
  onWinnerChange?: (tieId: string, winnerTeamId: string) => void
  teamMap: Map<string, Team>
}

const stageSlotCount: Record<BracketStageId, number> = {
  oitavas: 8,
  quartas: 4,
  semis: 2,
  final: 1,
}

const bracketColumns: Array<{
  align: 'left' | 'right'
  className: string
  label: string
  side: 'left' | 'right' | 'center'
  stage: BracketStageId
  start: number
}> = [
  { align: 'left', className: 'round16-left', label: 'Oitavas', side: 'left', stage: 'oitavas', start: 0 },
  { align: 'left', className: 'quarters-left', label: 'Quartas', side: 'left', stage: 'quartas', start: 0 },
  { align: 'left', className: 'semis-left', label: 'Semis', side: 'left', stage: 'semis', start: 0 },
  { align: 'left', className: 'final-center', label: 'Final', side: 'center', stage: 'final', start: 0 },
  { align: 'right', className: 'semis-right', label: 'Semis', side: 'right', stage: 'semis', start: 1 },
  { align: 'right', className: 'quarters-right', label: 'Quartas', side: 'right', stage: 'quartas', start: 2 },
  { align: 'right', className: 'round16-right', label: 'Oitavas', side: 'right', stage: 'oitavas', start: 4 },
]

export function KnockoutBracket({
  knockout,
  mode = 'view',
  onTeamSlotChange,
  onWinnerChange,
  teamMap,
}: KnockoutBracketProps) {
  const isEditable = mode === 'admin' && Boolean(onWinnerChange)

  return (
    <div className="knockout-bracket" aria-label="Chaveamento do mata-mata">
      <div className="knockout-bracket__grid">
        {bracketColumns.map((column) => {
          const ties = getColumnSlots(knockout, column.stage, column.start, getColumnCount(column.stage, column.side))

          return (
            <div
              className={`knockout-bracket__column knockout-bracket__column--${column.className}`}
              key={`${column.stage}-${column.side}`}
            >
              <h3>{column.label}</h3>
              <div className="knockout-bracket__matches">
                {ties.map((tie, index) => (
                  <BracketMatch
                    align={column.align}
                    columnClassName={column.className}
                    index={index}
                    isEditable={isEditable}
                    key={tie.id}
                    onTeamSlotChange={onTeamSlotChange}
                    onWinnerChange={onWinnerChange}
                    teamMap={teamMap}
                    tie={tie}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getColumnCount(stage: BracketStageId, side: 'left' | 'right' | 'center') {
  if (side === 'center') {
    return 1
  }

  return stageSlotCount[stage] / 2
}

function getColumnSlots(knockout: KnockoutTie[], stage: BracketStageId, start: number, count: number) {
  const ties = knockout
    .filter((tie) => tie.stage === stage)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return Array.from({ length: count }, (_, index) => {
    const order = start + index + 1
    return ties[start + index] ?? {
      id: `${stage}-placeholder-${order}`,
      stage,
      order,
    }
  })
}

function BracketMatch({
  align,
  columnClassName,
  index,
  isEditable,
  onTeamSlotChange,
  onWinnerChange,
  teamMap,
  tie,
}: {
  align: 'left' | 'right'
  columnClassName: string
  index: number
  isEditable: boolean
  onTeamSlotChange?: (tieId: string, slot: 'home' | 'away', teamId: string) => void
  onWinnerChange?: (tieId: string, winnerTeamId: string) => void
  teamMap: Map<string, Team>
  tie: KnockoutTie
}) {
  const homeTeam = tie.homeTeamId ? teamMap.get(tie.homeTeamId) : undefined
  const awayTeam = tie.awayTeamId ? teamMap.get(tie.awayTeamId) : undefined

  return (
    <article
      className={`knockout-bracket__match knockout-bracket__match--${columnClassName}`}
      style={{ '--match-index': index } as CSSProperties}
    >
      <div className="knockout-bracket__teams">
        <BracketTeam
          align={align}
          isEditable={isEditable}
          isWinner={tie.winnerTeamId === tie.homeTeamId}
          onTeamSlotChange={onTeamSlotChange}
          onWinnerChange={onWinnerChange}
          slot="home"
          team={homeTeam}
          teamId={tie.homeTeamId}
          tieId={tie.id}
        />
        <BracketTeam
          align={align}
          isEditable={isEditable}
          isWinner={tie.winnerTeamId === tie.awayTeamId}
          onTeamSlotChange={onTeamSlotChange}
          onWinnerChange={onWinnerChange}
          slot="away"
          team={awayTeam}
          teamId={tie.awayTeamId}
          tieId={tie.id}
        />
      </div>
    </article>
  )
}

function BracketTeam({
  align,
  isEditable,
  isWinner,
  onTeamSlotChange,
  onWinnerChange,
  slot,
  team,
  teamId,
  tieId,
}: {
  align: 'left' | 'right'
  isEditable: boolean
  isWinner: boolean
  onTeamSlotChange?: (tieId: string, slot: 'home' | 'away', teamId: string) => void
  onWinnerChange?: (tieId: string, winnerTeamId: string) => void
  slot: 'home' | 'away'
  team?: Team
  teamId?: string | null
  tieId: string
}) {
  const className = isWinner ? 'knockout-bracket__team knockout-bracket__team--winner' : 'knockout-bracket__team'

  return (
    <div className={className}>
      {align === 'right' ? <TeamBadge align="right" team={team} /> : null}
      {isEditable ? (
        <button
          aria-label={isWinner ? 'Desmarcar classificado' : 'Confirmar classificado'}
          aria-pressed={isWinner}
          className="knockout-bracket__confirm"
          disabled={!teamId}
          type="button"
          onClick={() => onWinnerChange?.(tieId, isWinner ? '' : teamId ?? '')}
        />
      ) : null}
      {align === 'left' ? <TeamBadge team={team} /> : null}
      {isEditable && teamId ? (
        <button
          aria-label="Remover time do confronto"
          className="knockout-bracket__remove"
          type="button"
          onClick={() => onTeamSlotChange?.(tieId, slot, '')}
        >
          x
        </button>
      ) : null}
    </div>
  )
}

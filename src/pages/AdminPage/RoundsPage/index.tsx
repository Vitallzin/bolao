import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { TeamBadge } from '../../../components/TeamBadge'
import type { Match, Round, Team } from '../../../types'
import { TeamSearchInput } from '../components/TeamSearchInput'
import './RoundsPage.css'

type RoundSlotDraft = {
  awayTeamId: string
  homeTeamId: string
}

type RoundDraft = {
  deadline?: string
  slots: Record<string, RoundSlotDraft>
}

type RoundDrafts = Record<number, RoundDraft>

type RoundsPageProps = {
  matches: Match[]
  onDeleteRound: (roundNumber: number) => void
  onPublishRound: (roundNumber: number, deadline: string) => void
  onPublishScore: (matchId: string) => void
  onRealScoreChange: (matchId: string, side: 'realHomeScore' | 'realAwayScore', value: string) => void
  onSaveRound: (
    roundNumber: number,
    deadline: string,
    event: FormEvent<HTMLFormElement>,
  ) => void
  rounds: Round[]
  teamMap: Map<string, Team>
  teams: Team[]
}

const matchSlots = Array.from({ length: 9 }, (_, index) => index + 1)

export function RoundsPage({
  matches,
  onDeleteRound,
  onPublishRound,
  onPublishScore,
  onRealScoreChange,
  onSaveRound,
  rounds,
  teamMap,
  teams,
}: RoundsPageProps) {
  const [selectedRoundNumber, setSelectedRoundNumber] = useState(1)
  const [roundDrafts, setRoundDrafts] = useState<RoundDrafts>({})
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const round = rounds.find((item) => item.number === selectedRoundNumber || item.id === `round-${selectedRoundNumber}`)
  const roundId = `round-${selectedRoundNumber}`
  const roundMatches = matches.filter((match) => match.roundId === roundId)
  const currentDraft = roundDrafts[selectedRoundNumber]
  const activeDeadline = currentDraft?.deadline ?? toDateTimeInput(round?.deadline)
  const isPublished = round?.status === 'published'
  const filledMatchCount = matchSlots.reduce(
    (total, slot) =>
      [1, 2].reduce((dayTotal, day) => {
        const slotDraft = getSlotDraft(day, slot)
        return dayTotal + (slotDraft.homeTeamId && slotDraft.awayTeamId ? 1 : 0)
      }, total),
    0,
  )

  function goToPreviousRound() {
    setSelectedRoundNumber((current) => Math.max(1, current - 1))
  }

  function goToNextRound() {
    setSelectedRoundNumber((current) => Math.min(8, current + 1))
  }

  function getSlotDraft(day: number, slot: number): RoundSlotDraft {
    const key = getRoundSlotKey(day, slot)
    const match = roundMatches.find((item) => item.day === day && item.slot === slot)

    return {
      homeTeamId: currentDraft?.slots[key]?.homeTeamId ?? match?.homeTeamId ?? '',
      awayTeamId: currentDraft?.slots[key]?.awayTeamId ?? match?.awayTeamId ?? '',
    }
  }

  function updateDeadlineDraft(deadline: string) {
    const normalizedDeadline = normalizeDateTimeInput(deadline)

    setRoundDrafts((current) => ({
      ...current,
      [selectedRoundNumber]: {
        ...current[selectedRoundNumber],
        slots: current[selectedRoundNumber]?.slots ?? {},
        deadline: normalizedDeadline,
      },
    }))
  }

  function updateSlotDraft(day: number, slot: number, field: keyof RoundSlotDraft, value: string) {
    const key = getRoundSlotKey(day, slot)

    setRoundDrafts((current) => {
      const roundDraft = current[selectedRoundNumber] ?? { slots: {} }
      const slotDraft = roundDraft.slots[key] ?? getSlotDraft(day, slot)

      return {
        ...current,
        [selectedRoundNumber]: {
          ...roundDraft,
          slots: {
            ...roundDraft.slots,
            [key]: {
              ...slotDraft,
              [field]: value,
            },
          },
        },
      }
    })
  }

  const roundExists = Boolean(round) || roundMatches.length > 0

  return (
    <>
      <form className="rounds-manager" onSubmit={(event) => onSaveRound(selectedRoundNumber, activeDeadline, event)}>
        <div className="admin-panel round-overview">
          <div className="round-status-line">
            <span>{filledMatchCount}/18 jogos</span>
            <span>{isPublished ? 'Rodada publicada' : 'Rascunho'}</span>
          </div>
          <div className="round-nav">
            <button type="button" onClick={goToPreviousRound} disabled={selectedRoundNumber === 1}>
              &lt;
            </button>
            <h2>Rodada {selectedRoundNumber}</h2>
            <button type="button" onClick={goToNextRound} disabled={selectedRoundNumber === 8}>
              &gt;
            </button>
          </div>
          <label className="deadline-field">
            Data e horário limite
            <input
              max="9999-12-31T23:59"
              type="datetime-local"
              value={activeDeadline}
              onInput={(event) => {
                event.currentTarget.value = normalizeDateTimeInput(event.currentTarget.value)
              }}
              onChange={(event) => updateDeadlineDraft(event.target.value)}
            />
          </label>
        </div>

        <div className="round-days">
          {[1, 2].map((day) => (
            <section className="admin-panel round-day" key={day}>
              <div className="round-day__heading">
                <h2>Dia {day}</h2>
              </div>
              <div className="round-slot-list">
                {matchSlots.map((slot) => {
                  const match = roundMatches.find((item) => item.day === day && item.slot === slot)
                  const slotDraft = getSlotDraft(day, slot)

                  return (
                    <RoundSlot
                      key={`${selectedRoundNumber}-${day}-${slot}`}
                      day={day as 1 | 2}
                      homeTeamId={slotDraft.homeTeamId}
                      awayTeamId={slotDraft.awayTeamId}
                      isRoundPublished={isPublished}
                      match={match}
                      slot={slot}
                      teamMap={teamMap}
                      teams={teams}
                      onPublishScore={onPublishScore}
                      onRealScoreChange={onRealScoreChange}
                      onTeamChange={(field, value) => updateSlotDraft(day, slot, field, value)}
                    />
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="round-actions">
          <Button className="save-round-button" type="submit">Salvar rodada</Button>
          <Button onClick={() => onPublishRound(selectedRoundNumber, activeDeadline)} variant="ghost">
            Publicar rodada
          </Button>
          {roundExists ? (
            <button className="danger-button" type="button" onClick={() => setDeleteConfirmOpen(true)}>
              Apagar rodada
            </button>
          ) : null}
        </div>
      </form>

      {deleteConfirmOpen ? (
        <ConfirmDeleteRoundModal
          matchCount={roundMatches.length}
          roundNumber={selectedRoundNumber}
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={() => {
            onDeleteRound(selectedRoundNumber)
            setDeleteConfirmOpen(false)
          }}
        />
      ) : null}
    </>
  )
}

function ConfirmDeleteRoundModal({
  matchCount,
  onCancel,
  onConfirm,
  roundNumber,
}: {
  matchCount: number
  onCancel: () => void
  onConfirm: () => void
  roundNumber: number
}) {
  return (
    <div className="confirm-overlay" role="presentation">
      <div className="confirm-card" role="dialog" aria-modal="true" aria-labelledby="delete-round-title">
        <span className="eyebrow">Confirmar exclusão</span>
        <h2 id="delete-round-title">Apagar a Rodada {roundNumber}?</h2>
        <p>
          Isso apaga os {matchCount} jogo(s) da rodada e todos os palpites feitos neles. A tabela da fase
          de liga e o ranking são recalculados sem esses resultados. Não dá para desfazer.
        </p>
        <div className="confirm-actions">
          <Button className="confirm-cancel-button" onClick={onCancel} variant="ghost">
            Cancelar
          </Button>
          <button className="danger-button" type="button" onClick={onConfirm}>
            Sim, apagar rodada
          </button>
        </div>
      </div>
    </div>
  )
}

function RoundSlot({
  awayTeamId,
  day,
  homeTeamId,
  isRoundPublished,
  match,
  onTeamChange,
  onPublishScore,
  onRealScoreChange,
  slot,
  teamMap,
  teams,
}: {
  awayTeamId: string
  day: 1 | 2
  homeTeamId: string
  isRoundPublished: boolean
  match?: Match
  onTeamChange: (field: keyof RoundSlotDraft, value: string) => void
  onPublishScore: (matchId: string) => void
  onRealScoreChange: (matchId: string, side: 'realHomeScore' | 'realAwayScore', value: string) => void
  slot: number
  teamMap: Map<string, Team>
  teams: Team[]
}) {
  return (
    <article className="round-slot">
      <div className="round-slot-fields">
        <strong>Jogo {slot}</strong>
        <TeamSearchInput
          name={`day-${day}-slot-${slot}-homeTeamId`}
          placeholder="Mandante"
          teams={teams}
          value={homeTeamId}
          onChange={(value) => onTeamChange('homeTeamId', value)}
        />
        <TeamSearchInput
          name={`day-${day}-slot-${slot}-awayTeamId`}
          placeholder="Visitante"
          teams={teams}
          value={awayTeamId}
          onChange={(value) => onTeamChange('awayTeamId', value)}
        />
      </div>

      {match && isRoundPublished ? (
        <div className="round-score-box">
          <div className="round-score-teams">
            <TeamBadge team={teamMap.get(match.homeTeamId)} />
            <span>x</span>
            <TeamBadge team={teamMap.get(match.awayTeamId)} />
          </div>
          <div className="round-score-fields">
            <input
              min="0"
              type="number"
              value={match.realHomeScore ?? ''}
              onChange={(event) => onRealScoreChange(match.id, 'realHomeScore', event.target.value)}
            />
            <span>x</span>
            <input
              min="0"
              type="number"
              value={match.realAwayScore ?? ''}
              onChange={(event) => onRealScoreChange(match.id, 'realAwayScore', event.target.value)}
            />
            <Button onClick={() => onPublishScore(match.id)} variant="ghost">
              {match.scorePublished ? 'Publicado' : 'Publicar placar'}
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  )
}

function getRoundSlotKey(day: number, slot: number) {
  return `day-${day}-slot-${slot}`
}

function toDateTimeInput(date?: Date) {
  if (!date || Number.isNaN(date.getTime())) {
    return ''
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

function normalizeDateTimeInput(value: string) {
  const expandedYear = value.match(/^(\d{4})\d+-(.+)$/)

  if (!expandedYear) {
    return value
  }

  return `${expandedYear[1]}-${expandedYear[2]}`
}

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button } from '../../../../components/Button'
import { TeamBadge } from '../../../../components/TeamBadge'
import type { KnockoutTie, Team } from '../../../../types'
import { TeamSearchInput } from '../../components/TeamSearchInput'
import type { KnockoutScoreField } from '../../index'
import './PlayoffsPage.css'

type ConfirmDeleteTarget = {
  index: number
  tieId: string
}

type PlayoffDraft = {
  awayTeamId: string
  homeTeamId: string
}

type PlayoffDeadlineDraft = {
  awayLegDeadline: string
  homeLegDeadline: string
}

type PlayoffsPageProps = {
  knockout: KnockoutTie[]
  onAddKnockoutTie: (event: FormEvent<HTMLFormElement>) => void
  onDeleteKnockoutTie: (tieId: string) => void
  onKnockoutScoreChange: (tieId: string, field: KnockoutScoreField, value: string) => void
  onPublishKnockoutScore: (tieId: string, leg?: 'home' | 'away') => void
  teamMap: Map<string, Team>
  teams: Team[]
}

export function PlayoffsPage({
  knockout,
  onAddKnockoutTie,
  onDeleteKnockoutTie,
  onKnockoutScoreChange,
  onPublishKnockoutScore,
  teamMap,
  teams,
}: PlayoffsPageProps) {
  const playoffs = useMemo(() => getOrderedPlayoffTies(knockout), [knockout])
  const [drafts, setDrafts] = useState<PlayoffDraft[]>(() => getPlayoffDrafts(playoffs))
  const [deadlineDraft, setDeadlineDraft] = useState<PlayoffDeadlineDraft>(() => getPlayoffDeadlineDraft(playoffs))
  const [deleteTarget, setDeleteTarget] = useState<ConfirmDeleteTarget | null>(null)

  useEffect(() => {
    setDrafts(getPlayoffDrafts(playoffs))
    setDeadlineDraft(getPlayoffDeadlineDraft(playoffs))
  }, [playoffs])

  function updateDraft(index: number, field: keyof PlayoffDraft, value: string) {
    setDrafts((current) =>
      current.map((draft, draftIndex) => (draftIndex === index ? { ...draft, [field]: value } : draft)),
    )
  }

  return (
    <>
      <form className="admin-panel playoffs-builder" onSubmit={onAddKnockoutTie}>
        <div className="playoff-fixtures-grid">
          <section className="playoff-leg-container">
            <h3>Ida</h3>
            <label className="deadline-field playoff-deadline-field">
              Data e horario limite
              <input
                max="9999-12-31T23:59"
                name="playoff-homeLegDeadline"
                type="datetime-local"
                value={deadlineDraft.homeLegDeadline}
                onInput={(event) => {
                  event.currentTarget.value = normalizeDateTimeInput(event.currentTarget.value)
                }}
                onChange={(event) =>
                  setDeadlineDraft((current) => ({
                    ...current,
                    homeLegDeadline: normalizeDateTimeInput(event.target.value),
                  }))
                }
              />
            </label>

            <div className="playoff-fixtures-list">
              {drafts.map((draft, index) => {
                const tie = playoffs[index]
                return (
                  <article className="playoff-fixture-card" key={`home-leg-${index}`}>
                    <div className="playoff-fixture-card__heading">
                      <strong>Jogo {index + 1}</strong>
                      {tie ? (
                        <button
                          className="danger-button danger-button--compact"
                          type="button"
                          onClick={() => setDeleteTarget({ index, tieId: tie.id })}
                        >
                          Excluir
                        </button>
                      ) : null}
                    </div>

                    <div className="playoff-leg-box playoff-leg-box--editable">
                      <TeamSearchInput
                        name={`playoff-${index + 1}-homeTeamId`}
                        placeholder="Time A"
                        presentation="badge"
                        teams={teams}
                        value={draft.homeTeamId}
                        onChange={(value) => updateDraft(index, 'homeTeamId', value)}
                      />
                      <input
                        disabled={!tie}
                        min="0"
                        type="number"
                        value={tie?.homeLegHomeScore ?? ''}
                        onChange={(event) => tie && onKnockoutScoreChange(tie.id, 'homeLegHomeScore', event.target.value)}
                      />
                      <span>x</span>
                      <input
                        disabled={!tie}
                        min="0"
                        type="number"
                        value={tie?.homeLegAwayScore ?? ''}
                        onChange={(event) => tie && onKnockoutScoreChange(tie.id, 'homeLegAwayScore', event.target.value)}
                      />
                      <TeamSearchInput
                        align="right"
                        name={`playoff-${index + 1}-awayTeamId`}
                        placeholder="Time B"
                        presentation="badge"
                        teams={teams}
                        value={draft.awayTeamId}
                        onChange={(value) => updateDraft(index, 'awayTeamId', value)}
                      />
                    </div>

                    {tie ? (
                      <PlayoffActions
                        isPublished={Boolean(tie.homeLegScorePublished)}
                        leg="home"
                        tie={tie}
                        onPublishKnockoutScore={onPublishKnockoutScore}
                      />
                    ) : (
                      <span className="muted-text">Salve para preencher placar.</span>
                    )}
                  </article>
                )
              })}
            </div>
          </section>

          <section className="playoff-leg-container">
            <h3>Volta</h3>
            <label className="deadline-field playoff-deadline-field">
              Data e horario limite
              <input
                max="9999-12-31T23:59"
                name="playoff-awayLegDeadline"
                type="datetime-local"
                value={deadlineDraft.awayLegDeadline}
                onInput={(event) => {
                  event.currentTarget.value = normalizeDateTimeInput(event.currentTarget.value)
                }}
                onChange={(event) =>
                  setDeadlineDraft((current) => ({
                    ...current,
                    awayLegDeadline: normalizeDateTimeInput(event.target.value),
                  }))
                }
              />
            </label>

            <div className="playoff-fixtures-list">
              {drafts.map((draft, index) => {
                const tie = playoffs[index]
                const homeTeam = draft.homeTeamId ? teamMap.get(draft.homeTeamId) : undefined
                const awayTeam = draft.awayTeamId ? teamMap.get(draft.awayTeamId) : undefined

                return (
                  <article className="playoff-fixture-card" key={`away-leg-${index}`}>
                    <strong>Jogo {index + 1}</strong>

                    <div className="playoff-leg-box playoff-leg-box--locked">
                      <TeamBadge team={awayTeam} />
                      <input
                        disabled={!tie}
                        min="0"
                        type="number"
                        value={tie?.awayLegAwayScore ?? ''}
                        onChange={(event) => tie && onKnockoutScoreChange(tie.id, 'awayLegAwayScore', event.target.value)}
                      />
                      <span>x</span>
                      <input
                        disabled={!tie}
                        min="0"
                        type="number"
                        value={tie?.awayLegHomeScore ?? ''}
                        onChange={(event) => tie && onKnockoutScoreChange(tie.id, 'awayLegHomeScore', event.target.value)}
                      />
                      <TeamBadge align="right" team={homeTeam} />
                    </div>

                    {tie ? (
                      <PlayoffActions
                        isPublished={Boolean(tie.awayLegScorePublished)}
                        leg="away"
                        tie={tie}
                        onPublishKnockoutScore={onPublishKnockoutScore}
                      />
                    ) : (
                      <span className="muted-text">Salve para preencher placares.</span>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        </div>

        <div className="round-actions">
          <Button className="save-round-button" type="submit">Salvar playoffs</Button>
        </div>
      </form>

      {deleteTarget ? (
        <ConfirmDeleteTieModal
          gameNumber={deleteTarget.index + 1}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            onDeleteKnockoutTie(deleteTarget.tieId)
            setDeleteTarget(null)
          }}
        />
      ) : null}
    </>
  )
}

function ConfirmDeleteTieModal({
  gameNumber,
  onCancel,
  onConfirm,
}: {
  gameNumber: number
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="confirm-overlay" role="presentation">
      <div className="confirm-card" role="dialog" aria-modal="true" aria-labelledby="delete-tie-title">
        <span className="eyebrow">Confirmar exclusao</span>
        <h2 id="delete-tie-title">Apagar Jogo {gameNumber}?</h2>
        <p>Essa acao remove o confronto e os palpites feitos para ele. Tem certeza que quer continuar?</p>
        <div className="confirm-actions">
          <Button className="confirm-cancel-button" onClick={onCancel} variant="ghost">
            Cancelar
          </Button>
          <button className="danger-button" type="button" onClick={onConfirm}>
            Sim, apagar
          </button>
        </div>
      </div>
    </div>
  )
}

function PlayoffActions({
  isPublished,
  leg,
  onPublishKnockoutScore,
  tie,
}: {
  isPublished: boolean
  leg: 'home' | 'away'
  onPublishKnockoutScore: (tieId: string, leg?: 'home' | 'away') => void
  tie: KnockoutTie
}) {
  return (
    <div className="playoff-actions">
      <Button onClick={() => onPublishKnockoutScore(tie.id, leg)} variant="ghost">
        {isPublished ? 'Placar publicado' : 'Publicar placar'}
      </Button>
    </div>
  )
}

function getPlayoffDrafts(playoffs: KnockoutTie[]) {
  return Array.from({ length: 8 }, (_, index) => ({
    homeTeamId: playoffs[index]?.homeTeamId ?? '',
    awayTeamId: playoffs[index]?.awayTeamId ?? '',
  }))
}

function getOrderedPlayoffTies(knockout: KnockoutTie[]) {
  return knockout
    .filter((tie) => tie.stage === 'playoffs')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

function getPlayoffDeadlineDraft(playoffs: KnockoutTie[]) {
  return {
    awayLegDeadline: toDateTimeInput(playoffs[0]?.awayLegDeadline ?? undefined),
    homeLegDeadline: toDateTimeInput(playoffs[0]?.homeLegDeadline ?? undefined),
  }
}

function toDateTimeInput(date?: Date | null) {
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

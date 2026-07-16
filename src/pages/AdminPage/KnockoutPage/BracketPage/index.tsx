import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button } from '../../../../components/Button'
import { KnockoutBracket } from '../../../../components/KnockoutBracket'
import { TeamBadge } from '../../../../components/TeamBadge'
import type { KnockoutTie, Team } from '../../../../types'
import { TeamSearchInput } from '../../components/TeamSearchInput'
import type { KnockoutScoreField } from '../../index'
import './BracketPage.css'

type KnockoutTeamDraft = {
  awayTeamId: string
  homeTeamId: string
}

type KnockoutDeadlineDraft = {
  awayLegDeadline: string
  homeLegDeadline: string
}

const resultStages = [
  { id: 'oitavas', label: 'Oitavas de final' },
  { id: 'quartas', label: 'Quartas de final' },
  { id: 'semis', label: 'Semi-final' },
  { id: 'final', label: 'Final' },
]

type BracketPageProps = {
  knockout: KnockoutTie[]
  onKnockoutLegDeadlineChange: (stage: string, leg: 'home' | 'away', value: string) => void
  onKnockoutScoreChange: (tieId: string, field: KnockoutScoreField, value: string) => void
  onKnockoutTeamSlotChange: (tieId: string, slot: 'home' | 'away', teamId: string) => void
  onPublishKnockoutScore: (tieId: string, leg?: 'home' | 'away') => void
  onSaveRoundOf16: (event: FormEvent<HTMLFormElement>) => void
  onWinnerChange: (tieId: string, winnerTeamId: string) => void
  teamMap: Map<string, Team>
  teams: Team[]
}

export function BracketPage({
  knockout,
  onKnockoutLegDeadlineChange,
  onKnockoutScoreChange,
  onKnockoutTeamSlotChange,
  onPublishKnockoutScore,
  onSaveRoundOf16,
  onWinnerChange,
  teamMap,
  teams,
}: BracketPageProps) {
  const normalTies = useMemo(() => knockout.filter((tie) => tie.stage !== 'playoffs'), [knockout])
  const [selectedResultStageIndex, setSelectedResultStageIndex] = useState(0)
  const selectedResultStage = resultStages[selectedResultStageIndex]
  const selectedStageTies = useMemo(
    () =>
      normalTies
        .filter((tie) => tie.stage === selectedResultStage.id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [normalTies, selectedResultStage.id],
  )
  const [deadlineDraft, setDeadlineDraft] = useState<KnockoutDeadlineDraft>(() =>
    getKnockoutDeadlineDraft(selectedStageTies),
  )
  const isFinalStage = selectedResultStage.id === 'final'

  useEffect(() => {
    setDeadlineDraft(getKnockoutDeadlineDraft(selectedStageTies))
  }, [selectedStageTies])

  function goToPreviousResultStage() {
    setSelectedResultStageIndex((current) => Math.max(0, current - 1))
  }

  function goToNextResultStage() {
    setSelectedResultStageIndex((current) => Math.min(resultStages.length - 1, current + 1))
  }

  return (
    <>
      <RoundOf16Page
        knockout={knockout}
        teams={teams}
        onSaveRoundOf16={onSaveRoundOf16}
      />

      <section className="admin-panel bracket-panel">
        <span className="eyebrow">Chaveamento</span>
        <h2>Mata-mata</h2>
        <KnockoutBracket
          knockout={knockout}
          mode="admin"
          teamMap={teamMap}
          onTeamSlotChange={onKnockoutTeamSlotChange}
          onWinnerChange={onWinnerChange}
        />
      </section>

      {normalTies.length > 0 ? (
        <section className="admin-panel knockout-results-panel">
          <span className="eyebrow">Placares</span>
          <div className="round-nav knockout-results-nav">
            <button type="button" onClick={goToPreviousResultStage} disabled={selectedResultStageIndex === 0}>
              &lt;
            </button>
            <h2>{selectedResultStage.label}</h2>
            <button
              type="button"
              onClick={goToNextResultStage}
              disabled={selectedResultStageIndex === resultStages.length - 1}
            >
              &gt;
            </button>
          </div>
          {selectedStageTies.length === 0 ? (
            <p className="muted-text">Nenhum confronto criado para esta fase ainda.</p>
          ) : (
            <div className={isFinalStage ? 'knockout-results-grid knockout-results-grid--single' : 'knockout-results-grid'}>
              <KnockoutResultLegSection
                deadline={deadlineDraft.homeLegDeadline}
                label={isFinalStage ? 'Final' : 'Ida'}
                leg="home"
                selectedStageId={selectedResultStage.id}
                ties={selectedStageTies}
                teamMap={teamMap}
                onDeadlineChange={(value) =>
                  setDeadlineDraft((current) => ({
                    ...current,
                    homeLegDeadline: value,
                  }))
                }
                onKnockoutLegDeadlineChange={onKnockoutLegDeadlineChange}
                onKnockoutScoreChange={onKnockoutScoreChange}
                onPublishKnockoutScore={onPublishKnockoutScore}
              />

              {isFinalStage ? null : (
                <KnockoutResultLegSection
                  deadline={deadlineDraft.awayLegDeadline}
                  label="Volta"
                  leg="away"
                  selectedStageId={selectedResultStage.id}
                  ties={selectedStageTies}
                  teamMap={teamMap}
                  onDeadlineChange={(value) =>
                    setDeadlineDraft((current) => ({
                      ...current,
                      awayLegDeadline: value,
                    }))
                  }
                  onKnockoutLegDeadlineChange={onKnockoutLegDeadlineChange}
                  onKnockoutScoreChange={onKnockoutScoreChange}
                  onPublishKnockoutScore={onPublishKnockoutScore}
                />
              )}
            </div>
          )}
        </section>
      ) : null}
    </>
  )
}

function KnockoutResultLegCard({
  leg,
  onKnockoutScoreChange,
  onPublishKnockoutScore,
  teamMap,
  tie,
}: {
  leg: 'home' | 'away'
  onKnockoutScoreChange: (tieId: string, field: KnockoutScoreField, value: string) => void
  onPublishKnockoutScore: (tieId: string, leg?: 'home' | 'away') => void
  teamMap: Map<string, Team>
  tie: KnockoutTie
}) {
  const homeTeam = tie.homeTeamId ? teamMap.get(tie.homeTeamId) : undefined
  const awayTeam = tie.awayTeamId ? teamMap.get(tie.awayTeamId) : undefined

  const isHomeLeg = leg === 'home'
  const firstTeam = isHomeLeg ? homeTeam : awayTeam
  const secondTeam = isHomeLeg ? awayTeam : homeTeam
  const firstScoreField = isHomeLeg ? 'homeLegHomeScore' : 'awayLegAwayScore'
  const secondScoreField = isHomeLeg ? 'homeLegAwayScore' : 'awayLegHomeScore'
  const firstScore = isHomeLeg ? tie.homeLegHomeScore : tie.awayLegAwayScore
  const secondScore = isHomeLeg ? tie.homeLegAwayScore : tie.awayLegHomeScore
  const isPublished = isHomeLeg ? Boolean(tie.homeLegScorePublished) : Boolean(tie.awayLegScorePublished)

  return (
    <article className="playoff-fixture-card">
      <strong>Jogo {tie.order}</strong>

      <div className="playoff-leg-box">
        <TeamBadge team={firstTeam} />
        <input
          min="0"
          type="number"
          value={firstScore ?? ''}
          onChange={(event) => onKnockoutScoreChange(tie.id, firstScoreField, event.target.value)}
        />
        <span>x</span>
        <input
          min="0"
          type="number"
          value={secondScore ?? ''}
          onChange={(event) => onKnockoutScoreChange(tie.id, secondScoreField, event.target.value)}
        />
        <TeamBadge align="right" team={secondTeam} />
      </div>

      <div className="playoff-actions">
        <Button onClick={() => onPublishKnockoutScore(tie.id, leg)} variant="ghost">
          {isPublished ? 'Placar publicado' : 'Publicar placar'}
        </Button>
      </div>
    </article>
  )
}

function KnockoutResultLegSection({
  deadline,
  label,
  leg,
  onDeadlineChange,
  onKnockoutLegDeadlineChange,
  onKnockoutScoreChange,
  onPublishKnockoutScore,
  selectedStageId,
  teamMap,
  ties,
}: {
  deadline: string
  label: string
  leg: 'home' | 'away'
  onDeadlineChange: (value: string) => void
  onKnockoutLegDeadlineChange: (stage: string, leg: 'home' | 'away', value: string) => void
  onKnockoutScoreChange: (tieId: string, field: KnockoutScoreField, value: string) => void
  onPublishKnockoutScore: (tieId: string, leg?: 'home' | 'away') => void
  selectedStageId: string
  teamMap: Map<string, Team>
  ties: KnockoutTie[]
}) {
  return (
    <section className="playoff-leg-container">
      <h3>{label}</h3>
      <label className="deadline-field playoff-deadline-field">
        Data e horario limite
        <input
          max="9999-12-31T23:59"
          type="datetime-local"
          value={deadline}
          onInput={(event) => {
            event.currentTarget.value = normalizeDateTimeInput(event.currentTarget.value)
          }}
          onBlur={(event) => onKnockoutLegDeadlineChange(selectedStageId, leg, event.currentTarget.value)}
          onChange={(event) => onDeadlineChange(normalizeDateTimeInput(event.target.value))}
        />
      </label>

      <div className="playoff-fixtures-list">
        {ties.map((tie) => (
          <KnockoutResultLegCard
            key={`${leg}-leg-${tie.id}`}
            leg={leg}
            tie={tie}
            teamMap={teamMap}
            onKnockoutScoreChange={onKnockoutScoreChange}
            onPublishKnockoutScore={onPublishKnockoutScore}
          />
        ))}
      </div>
    </section>
  )
}

function RoundOf16Page({
  knockout,
  onSaveRoundOf16,
  teams,
}: {
  knockout: KnockoutTie[]
  onSaveRoundOf16: (event: FormEvent<HTMLFormElement>) => void
  teams: Team[]
}) {
  const roundOf16 = useMemo(() => getOrderedStageTies(knockout, 'oitavas'), [knockout])
  const [drafts, setDrafts] = useState<KnockoutTeamDraft[]>(() => getRoundOf16Drafts(roundOf16))

  useEffect(() => {
    setDrafts(getRoundOf16Drafts(roundOf16))
  }, [roundOf16])

  function updateDraft(index: number, field: keyof KnockoutTeamDraft, value: string) {
    setDrafts((current) =>
      current.map((draft, draftIndex) => (draftIndex === index ? { ...draft, [field]: value } : draft)),
    )
  }

  return (
    <form className="admin-panel round-of-16-builder" onSubmit={onSaveRoundOf16}>
      <div className="round-of-16-heading">
        <h2>Confrontos</h2>
      </div>
      <div className="round-of-16-grid">
        {drafts.map((draft, index) => (
          <article className="round-of-16-slot" key={index}>
            <strong>Jogo {index + 1}</strong>
            <TeamSearchInput
              name={`oitavas-${index + 1}-homeTeamId`}
              placeholder="Time A"
              teams={teams}
              value={draft.homeTeamId}
              onChange={(value) => updateDraft(index, 'homeTeamId', value)}
            />
            <span>x</span>
            <TeamSearchInput
              name={`oitavas-${index + 1}-awayTeamId`}
              placeholder="Time B"
              teams={teams}
              value={draft.awayTeamId}
              onChange={(value) => updateDraft(index, 'awayTeamId', value)}
            />
          </article>
        ))}
      </div>
      <div className="round-actions">
        <Button className="save-round-button" type="submit">Salvar oitavas</Button>
      </div>
    </form>
  )
}

function getRoundOf16Drafts(roundOf16: KnockoutTie[]) {
  return Array.from({ length: 8 }, (_, index) => ({
    homeTeamId: roundOf16[index]?.homeTeamId ?? '',
    awayTeamId: roundOf16[index]?.awayTeamId ?? '',
  }))
}

function getOrderedStageTies(knockout: KnockoutTie[], stage: string) {
  return knockout
    .filter((tie) => tie.stage === stage)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

function getKnockoutDeadlineDraft(ties: KnockoutTie[]) {
  return {
    awayLegDeadline: toDateTimeInput(ties[0]?.awayLegDeadline ?? undefined),
    homeLegDeadline: toDateTimeInput(ties[0]?.homeLegDeadline ?? undefined),
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

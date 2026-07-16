import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import type { CompetitionPrediction, CompetitionPredictionResult, Player, Round, Team } from '../../../types'
import { formatDateTime } from '../../../utils/date'
import './CompetitionPredictionsPage.css'

type CompetitionPredictionsPageProps = {
  competitionPredictionResult?: CompetitionPredictionResult
  competitionPredictions: CompetitionPrediction[]
  currentUser: Player
  firstRound?: Round
  onSubmitCompetitionPrediction: (event: FormEvent<HTMLFormElement>) => void
  teamMap: Map<string, Team>
  teams: Team[]
}

export function CompetitionPredictionsPage({
  competitionPredictionResult,
  competitionPredictions,
  currentUser,
  firstRound,
  onSubmitCompetitionPrediction,
  teamMap,
  teams,
}: CompetitionPredictionsPageProps) {
  const existingPrediction = competitionPredictions.find((prediction) => prediction.userId === currentUser.id)
  const locked = Boolean(existingPrediction) || !firstRound || new Date() >= firstRound.deadline

  if (!firstRound) {
    return (
      <EmptyState
        title="Previsões indisponíveis"
        text="Quando a primeira rodada tiver uma data limite, as previsões da competição aparecem aqui."
      />
    )
  }

  return (
    <section className="content-grid">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Antes da Champions</span>
          <h2>Previsões da competição</h2>
        </div>
        <span className={locked ? 'status-pill status-pill--locked' : 'status-pill'}>
          {existingPrediction ? 'Enviada' : new Date() >= firstRound.deadline ? 'Fechada' : `Aberta ate ${formatDateTime(firstRound.deadline)}`}
        </span>
      </div>

      <form
        className="competition-predictions-form"
        key={existingPrediction?.id ?? 'empty'}
        onSubmit={onSubmitCompetitionPrediction}
      >
        <PredictionTopFive
          disabled={locked}
          label="Top 5 artilheiros"
          name="topScorers"
          values={existingPrediction?.topScorers}
        />
        <PredictionTopFive
          disabled={locked}
          label="Top 5 assistências"
          name="topAssists"
          values={existingPrediction?.topAssists}
        />

        <section className="competition-predictions-card">
          <h3>Prêmios individuais</h3>
          <label>
            Melhor jogador
            <input disabled={locked} name="bestPlayer" defaultValue={existingPrediction?.bestPlayer ?? ''} />
          </label>
          <label>
            Melhor goleiro
            <input disabled={locked} name="bestGoalkeeper" defaultValue={existingPrediction?.bestGoalkeeper ?? ''} />
          </label>
        </section>

        <section className="competition-predictions-card">
          <h3>Finalistas</h3>
          <label>
            Campeão
            <select disabled={locked} name="championTeamId" defaultValue={existingPrediction?.championTeamId ?? ''}>
              <TeamOptions teams={teams} />
            </select>
          </label>
          <label>
            Vice-campeão
            <select disabled={locked} name="runnerUpTeamId" defaultValue={existingPrediction?.runnerUpTeamId ?? ''}>
              <TeamOptions teams={teams} />
            </select>
          </label>
        </section>

        {competitionPredictionResult?.published && existingPrediction ? (
          <section className="competition-predictions-card">
            <h3>Resultado oficial</h3>
            <p>Campeão: {teamMap.get(competitionPredictionResult.championTeamId)?.name ?? 'A definir'}</p>
            <p>Vice: {teamMap.get(competitionPredictionResult.runnerUpTeamId)?.name ?? 'A definir'}</p>
          </section>
        ) : null}

        {!locked ? (
          <div className="round-actions competition-predictions-actions">
            <Button className="save-round-button" type="submit">Enviar previsões</Button>
          </div>
        ) : null}
      </form>
    </section>
  )
}

function PredictionTopFive({
  disabled,
  label,
  name,
  values = [],
}: {
  disabled: boolean
  label: string
  name: string
  values?: string[]
}) {
  return (
    <section className="competition-predictions-card">
      <h3>{label}</h3>
      {Array.from({ length: 5 }, (_, index) => (
        <label key={`${name}-${index}`}>
          {index + 1}º lugar
          <input disabled={disabled} name={`${name}-${index + 1}`} defaultValue={values[index] ?? ''} />
        </label>
      ))}
    </section>
  )
}

function TeamOptions({ teams }: { teams: Team[] }) {
  return (
    <>
      <option value="">Selecione</option>
      {teams.map((team) => (
        <option key={team.id} value={team.id}>
          {team.name}
        </option>
      ))}
    </>
  )
}

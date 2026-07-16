import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import type { CompetitionPredictionResult, Team } from '../../../types'
import './CompetitionPredictionsPage.css'

type CompetitionPredictionsPageProps = {
  competitionPredictionResult?: CompetitionPredictionResult
  onPublishCompetitionPredictionResult: () => void
  onSaveCompetitionPredictionResult: (event: FormEvent<HTMLFormElement>) => void
  teams: Team[]
}

export function CompetitionPredictionsPage({
  competitionPredictionResult,
  onPublishCompetitionPredictionResult,
  onSaveCompetitionPredictionResult,
  teams,
}: CompetitionPredictionsPageProps) {
  return (
    <form
      className="admin-panel admin-competition-predictions"
      key={competitionPredictionResult?.id ?? 'empty'}
      onSubmit={onSaveCompetitionPredictionResult}
    >
      <div className="round-of-16-heading">
        <span className="eyebrow">Resultado oficial</span>
        <h2>Previsões da competição</h2>
      </div>

      <AdminTopFive
        label="Top 5 artilheiros"
        name="topScorers"
        values={competitionPredictionResult?.topScorers}
      />
      <AdminTopFive
        label="Top 5 assistências"
        name="topAssists"
        values={competitionPredictionResult?.topAssists}
      />

      <section className="admin-competition-card">
        <h3>Prêmios individuais</h3>
        <label>
          Melhor jogador
          <input name="bestPlayer" defaultValue={competitionPredictionResult?.bestPlayer ?? ''} />
        </label>
        <label>
          Melhor goleiro
          <input name="bestGoalkeeper" defaultValue={competitionPredictionResult?.bestGoalkeeper ?? ''} />
        </label>
      </section>

      <section className="admin-competition-card">
        <h3>Finalistas</h3>
        <label>
          Campeão
          <select name="championTeamId" defaultValue={competitionPredictionResult?.championTeamId ?? ''}>
            <TeamOptions teams={teams} />
          </select>
        </label>
        <label>
          Vice-campeão
          <select name="runnerUpTeamId" defaultValue={competitionPredictionResult?.runnerUpTeamId ?? ''}>
            <TeamOptions teams={teams} />
          </select>
        </label>
      </section>

      <div className="round-actions admin-competition-actions">
        <Button className="save-round-button" type="submit">Salvar resultado</Button>
        <Button onClick={onPublishCompetitionPredictionResult} variant="ghost">
          {competitionPredictionResult?.published ? 'Pontuação publicada' : 'Publicar pontuação'}
        </Button>
      </div>
    </form>
  )
}

function AdminTopFive({
  label,
  name,
  values = [],
}: {
  label: string
  name: string
  values?: string[]
}) {
  return (
    <section className="admin-competition-card">
      <h3>{label}</h3>
      {Array.from({ length: 5 }, (_, index) => (
        <label key={`${name}-${index}`}>
          {index + 1}º lugar
          <input name={`${name}-${index + 1}`} defaultValue={values[index] ?? ''} />
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

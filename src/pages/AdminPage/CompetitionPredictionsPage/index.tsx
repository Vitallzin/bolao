import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../../components/Button'
import type { CompetitionPredictionResult, Team } from '../../../types'
import './CompetitionPredictionsPage.css'

type CompetitionPredictionsPageProps = {
  competitionPredictionDeadline?: Date | null
  competitionPredictionResult?: CompetitionPredictionResult
  onPublishCompetitionPredictionResult: () => void
  onSaveCompetitionPredictionDeadline: (value: string) => void
  onSaveCompetitionPredictionResult: (event: FormEvent<HTMLFormElement>) => void
  teams: Team[]
}

export function CompetitionPredictionsPage({
  competitionPredictionDeadline,
  competitionPredictionResult,
  onPublishCompetitionPredictionResult,
  onSaveCompetitionPredictionDeadline,
  onSaveCompetitionPredictionResult,
  teams,
}: CompetitionPredictionsPageProps) {
  return (
    <>
      <DeadlineCard
        deadline={competitionPredictionDeadline}
        onSave={onSaveCompetitionPredictionDeadline}
      />

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
    </>
  )
}

/**
 * Prazo proprio das previsoes, separado das rodadas. Fica fora do form do
 * resultado oficial para os dois nao serem salvos juntos.
 */
function DeadlineCard({
  deadline,
  onSave,
}: {
  deadline?: Date | null
  onSave: (value: string) => void
}) {
  const [value, setValue] = useState(() => toDateTimeInput(deadline))

  useEffect(() => {
    setValue(toDateTimeInput(deadline))
  }, [deadline])

  return (
    <section className="admin-panel admin-competition-deadline">
      <div className="round-of-16-heading">
        <span className="eyebrow">Prazo</span>
        <h2>Prazo das previsões</h2>
      </div>
      <p className="muted-text">
        Vale só para as previsões da competição — não tem relação com o prazo das rodadas. Enquanto não
        houver prazo definido, ninguém consegue enviar.
      </p>
      <label className="deadline-field">
        Data e horario limite
        <input
          max="9999-12-31T23:59"
          type="datetime-local"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>
      <div className="round-actions">
        <Button className="save-round-button" onClick={() => onSave(value)}>
          Salvar prazo
        </Button>
      </div>
    </section>
  )
}

function toDateTimeInput(date?: Date | null) {
  if (!date || Number.isNaN(date.getTime())) {
    return ''
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
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

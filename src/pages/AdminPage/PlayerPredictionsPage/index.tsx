import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button } from '../../../components/Button'
import type { CompetitionPrediction, Player, PlayerStat, Team } from '../../../types'
import './PlayerPredictionsPage.css'

type PlayerPredictionsPageProps = {
  competitionPredictions: CompetitionPrediction[]
  onSaveCompetitionPredictionForPlayer: (userId: string, event: FormEvent<HTMLFormElement>) => void
  players: Player[]
  playerStats: PlayerStat[]
  teams: Team[]
}

type PredictionEntry = {
  player: Player
  prediction: CompetitionPrediction
}

const nameSuggestionsId = 'admin-prediction-name-suggestions'

export function PlayerPredictionsPage({
  competitionPredictions,
  onSaveCompetitionPredictionForPlayer,
  players,
  playerStats,
  teams,
}: PlayerPredictionsPageProps) {
  const entries = useMemo<PredictionEntry[]>(() => {
    const playerMap = new Map(players.map((player) => [player.id, player]))

    return competitionPredictions
      .map((prediction) => {
        const player = playerMap.get(prediction.userId)

        return player ? { player, prediction } : null
      })
      .filter((entry): entry is PredictionEntry => entry !== null)
      .sort((a, b) => a.player.name.localeCompare(b.player.name))
  }, [competitionPredictions, players])

  const pendingPlayers = useMemo(
    () =>
      players.filter(
        (player) =>
          player.approved &&
          !competitionPredictions.some((prediction) => prediction.userId === player.id),
      ),
    [competitionPredictions, players],
  )

  /**
   * Todos os nomes ja digitados (pelos jogadores e na artilharia) viram sugestao,
   * que e como o admin encontra rapido a grafia que quer padronizar.
   */
  const nameSuggestions = useMemo(() => {
    const names = new Set<string>()

    competitionPredictions.forEach((prediction) => {
      ;[...prediction.topScorers, ...prediction.topAssists, prediction.bestPlayer, prediction.bestGoalkeeper]
        .map((name) => name.trim())
        .filter(Boolean)
        .forEach((name) => names.add(name))
    })
    playerStats.forEach((stat) => {
      if (stat.name.trim()) {
        names.add(stat.name.trim())
      }
    })

    return [...names].sort((a, b) => a.localeCompare(b))
  }, [competitionPredictions, playerStats])

  const [selectedUserId, setSelectedUserId] = useState('')
  const selectedIndex = entries.findIndex((entry) => entry.player.id === selectedUserId)
  const currentIndex = selectedIndex >= 0 ? selectedIndex : 0
  const current = entries[currentIndex]

  useEffect(() => {
    if (entries.length > 0 && selectedIndex < 0) {
      setSelectedUserId(entries[0].player.id)
    }
  }, [entries, selectedIndex])

  function goToPrevious() {
    const previous = entries[currentIndex - 1]

    if (previous) {
      setSelectedUserId(previous.player.id)
    }
  }

  function goToNext() {
    const next = entries[currentIndex + 1]

    if (next) {
      setSelectedUserId(next.player.id)
    }
  }

  if (!current) {
    return (
      <section className="admin-panel player-predictions-empty">
        <span className="eyebrow">Previsões dos jogadores</span>
        <h2>Ninguém enviou previsões ainda</h2>
        <p className="muted-text">
          Assim que os jogadores enviarem as previsões da competição, elas aparecem aqui para você
          conferir e padronizar a grafia dos nomes.
        </p>
      </section>
    )
  }

  return (
    <div className="player-predictions-manager">
      <datalist id={nameSuggestionsId}>
        {nameSuggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div className="admin-panel round-overview player-predictions-overview">
        <div className="round-status-line">
          <span>
            {currentIndex + 1}/{entries.length} enviadas
          </span>
          <span>
            {pendingPlayers.length === 0
              ? 'Todo mundo enviou'
              : `${pendingPlayers.length} sem enviar`}
          </span>
        </div>
        <div className="round-nav player-predictions-nav">
          <button type="button" onClick={goToPrevious} disabled={currentIndex === 0}>
            &lt;
          </button>
          <h2>{current.player.name}</h2>
          <button type="button" onClick={goToNext} disabled={currentIndex === entries.length - 1}>
            &gt;
          </button>
        </div>
        <label className="deadline-field">
          Ir direto para
          <select value={current.player.id} onChange={(event) => setSelectedUserId(event.target.value)}>
            {entries.map((entry) => (
              <option key={entry.player.id} value={entry.player.id}>
                {entry.player.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <form
        className="admin-panel admin-competition-predictions"
        key={current.player.id}
        onSubmit={(event) => onSaveCompetitionPredictionForPlayer(current.player.id, event)}
      >
        <div className="round-of-16-heading">
          <span className="eyebrow">Previsões de</span>
          <h2>{current.player.name}</h2>
          <p className="muted-text">{current.player.email}</p>
        </div>

        <PredictionTopFive
          label="Top 5 artilheiros"
          name="topScorers"
          values={current.prediction.topScorers}
        />
        <PredictionTopFive
          label="Top 5 assistências"
          name="topAssists"
          values={current.prediction.topAssists}
        />

        <section className="admin-competition-card">
          <h3>Prêmios individuais</h3>
          <label>
            Melhor jogador
            <input
              defaultValue={current.prediction.bestPlayer}
              list={nameSuggestionsId}
              name="bestPlayer"
            />
          </label>
          <label>
            Melhor goleiro
            <input
              defaultValue={current.prediction.bestGoalkeeper}
              list={nameSuggestionsId}
              name="bestGoalkeeper"
            />
          </label>
        </section>

        <section className="admin-competition-card">
          <h3>Finalistas</h3>
          <label>
            Campeão
            <select name="championTeamId" defaultValue={current.prediction.championTeamId}>
              <TeamOptions teams={teams} />
            </select>
          </label>
          <label>
            Vice-campeão
            <select name="runnerUpTeamId" defaultValue={current.prediction.runnerUpTeamId}>
              <TeamOptions teams={teams} />
            </select>
          </label>
        </section>

        <div className="round-actions admin-competition-actions">
          <Button className="save-round-button" type="submit">
            Salvar previsões do jogador
          </Button>
        </div>
      </form>

      {pendingPlayers.length > 0 ? (
        <section className="admin-panel player-predictions-pending">
          <span className="eyebrow">Ainda não enviaram</span>
          <h2>{pendingPlayers.length} jogador(es) sem previsões</h2>
          <div className="player-predictions-pending-list">
            {pendingPlayers.map((player) => (
              <span key={player.id}>{player.name}</span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function PredictionTopFive({
  label,
  name,
  values,
}: {
  label: string
  name: string
  values: string[]
}) {
  return (
    <section className="admin-competition-card">
      <h3>{label}</h3>
      {Array.from({ length: 5 }, (_, index) => (
        <label key={`${name}-${index}`}>
          {index + 1}º lugar
          <input
            defaultValue={values[index] ?? ''}
            list={nameSuggestionsId}
            name={`${name}-${index + 1}`}
          />
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

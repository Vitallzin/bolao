import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { NationalityFlag } from '../../../components/NationalityFlag'
import type { PlayerStat, Team } from '../../../types'
import { CountrySearchInput } from '../components/CountrySearchInput'
import './PlayerStatsPage.css'

type PlayerStatsPageProps = {
  onAddPlayerStat: (event: FormEvent<HTMLFormElement>) => void
  onDeletePlayerStat: (playerStatId: string) => void
  onUpdatePlayerStat: (playerStat: PlayerStat) => void
  playerStats: PlayerStat[]
  teamMap: Map<string, Team>
  teams: Team[]
}

export function PlayerStatsPage({
  onAddPlayerStat,
  onDeletePlayerStat,
  onUpdatePlayerStat,
  playerStats,
  teamMap,
  teams,
}: PlayerStatsPageProps) {
  return (
    <div className="player-stats-admin">
      <PlayerStatForm teams={teams} onAddPlayerStat={onAddPlayerStat} />
      <section className="admin-panel player-stats-list">
        <span className="eyebrow">Estatísticas</span>
        <h2>Artilharia e assistências</h2>
        {playerStats.length === 0 ? (
          <p className="muted-text">Nenhum jogador cadastrado ainda.</p>
        ) : (
          <div className="player-stat-rows">
            {playerStats.map((playerStat) => (
              <PlayerStatRow
                key={playerStat.id}
                playerStat={playerStat}
                teamMap={teamMap}
                teams={teams}
                onDeletePlayerStat={onDeletePlayerStat}
                onUpdatePlayerStat={onUpdatePlayerStat}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function PlayerStatForm({
  onAddPlayerStat,
  teams,
}: {
  onAddPlayerStat: (event: FormEvent<HTMLFormElement>) => void
  teams: Team[]
}) {
  const [nationalityCode, setNationalityCode] = useState('')
  const [formResetCount, setFormResetCount] = useState(0)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const hasRequiredFields = Boolean(nationalityCode)

    onAddPlayerStat(event)

    if (hasRequiredFields) {
      setNationalityCode('')
      setFormResetCount((current) => current + 1)
    }
  }

  return (
    <form className="admin-panel player-stat-form" onSubmit={handleSubmit}>
      <span className="eyebrow">Jogadores</span>
      <h2>Cadastrar estatística</h2>
      <input name="name" placeholder="Nome do jogador" />
      <select name="teamId" defaultValue="">
        <TeamOptions teams={teams} />
      </select>
      <label>
        Nacionalidade
        <CountrySearchInput
          key={formResetCount}
          name="nationalityCode"
          placeholder="Buscar país..."
          value={nationalityCode}
          onChange={setNationalityCode}
        />
      </label>
      <div className="player-stat-form__numbers">
        <input min="0" name="goals" placeholder="Gols" type="number" />
        <input min="0" name="assists" placeholder="Assistências" type="number" />
      </div>
      <Button type="submit">Adicionar jogador</Button>
    </form>
  )
}

function PlayerStatRow({
  onDeletePlayerStat,
  onUpdatePlayerStat,
  playerStat,
  teamMap,
  teams,
}: {
  onDeletePlayerStat: (playerStatId: string) => void
  onUpdatePlayerStat: (playerStat: PlayerStat) => void
  playerStat: PlayerStat
  teamMap: Map<string, Team>
  teams: Team[]
}) {
  const [draft, setDraft] = useState(playerStat)
  const team = teamMap.get(draft.teamId)

  return (
    <article className="player-stat-row">
      <div className="player-stat-row__player">
        <NationalityFlag nationalityCode={draft.nationalityCode} />
        <div>
          <input
            aria-label="Nome do jogador"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          />
          <span>{team?.name ?? 'Time não definido'}</span>
        </div>
      </div>
      <select
        aria-label="Time"
        value={draft.teamId}
        onChange={(event) => setDraft((current) => ({ ...current, teamId: event.target.value }))}
      >
        <TeamOptions teams={teams} />
      </select>
      <CountrySearchInput
        name="nationalityCode"
        placeholder="Buscar país..."
        value={draft.nationalityCode}
        onChange={(code) => setDraft((current) => ({ ...current, nationalityCode: code }))}
      />
      <input
        aria-label="Gols"
        min="0"
        type="number"
        value={draft.goals}
        onChange={(event) => setDraft((current) => ({ ...current, goals: Number(event.target.value || 0) }))}
      />
      <input
        aria-label="Assistências"
        min="0"
        type="number"
        value={draft.assists}
        onChange={(event) => setDraft((current) => ({ ...current, assists: Number(event.target.value || 0) }))}
      />
      <strong>{draft.goals + draft.assists}</strong>
      <div className="player-stat-row__actions">
        <Button onClick={() => onUpdatePlayerStat(draft)} variant="ghost">Salvar</Button>
        <button className="danger-button" type="button" onClick={() => onDeletePlayerStat(playerStat.id)}>
          Excluir
        </button>
      </div>
    </article>
  )
}

function TeamOptions({ teams }: { teams: Team[] }) {
  return (
    <>
      <option value="">Selecione o time</option>
      {teams.map((team) => (
        <option key={team.id} value={team.id}>
          {team.name}
        </option>
      ))}
    </>
  )
}

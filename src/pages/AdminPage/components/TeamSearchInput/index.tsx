import { useEffect, useState } from 'react'
import { TeamBadge } from '../../../../components/TeamBadge'
import type { Team } from '../../../../types'

type TeamSearchInputProps = {
  align?: 'left' | 'right'
  /** Times que nao podem ser escolhidos aqui (ex.: ja estao em outro jogo da rodada). */
  excludedTeamIds?: Set<string>
  name: string
  onChange: (value: string) => void
  placeholder: string
  presentation?: 'input' | 'badge'
  teams: Team[]
  value: string
}

export function TeamSearchInput({
  align = 'left',
  excludedTeamIds,
  name,
  onChange,
  placeholder,
  presentation = 'input',
  teams,
  value,
}: TeamSearchInputProps) {
  const selectedTeam = teams.find((team) => team.id === value)
  // O time ja escolhido neste campo continua disponivel; os excluidos somem da busca.
  const availableTeams = excludedTeamIds
    ? teams.filter((team) => team.id === value || !excludedTeamIds.has(team.id))
    : teams
  const [query, setQuery] = useState(selectedTeam?.name ?? '')
  const [isEditingBadge, setIsEditingBadge] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const normalizedQuery = normalizeTeamName(query)
  const exactTeam = availableTeams.find((team) => normalizeTeamName(team.name) === normalizedQuery)
  const matchingTeams = normalizedQuery
    ? availableTeams.filter((team) => normalizeTeamName(team.name).includes(normalizedQuery)).slice(0, 6)
    : []
  const hasInvalidTeam = Boolean(query.trim()) && !value && !exactTeam
  // Digitou o nome exato de um time que ja esta em outro jogo: avisa em vez de so ficar vermelho.
  const excludedExactTeam =
    !exactTeam && excludedTeamIds
      ? teams.find(
        (team) => excludedTeamIds.has(team.id) && normalizeTeamName(team.name) === normalizedQuery,
      )
      : undefined

  useEffect(() => {
    if (selectedTeam) {
      setQuery(selectedTeam.name)
      setIsEditingBadge(false)
    }
  }, [selectedTeam])

  function handleQueryChange(nextQuery: string) {
    const nextExactTeam = availableTeams.find(
      (team) => normalizeTeamName(team.name) === normalizeTeamName(nextQuery),
    )

    setQuery(nextQuery)
    setIsOpen(true)
    onChange(nextExactTeam?.id ?? '')
  }

  function selectTeam(team: Team) {
    setQuery(team.name)
    setIsEditingBadge(false)
    setIsOpen(false)
    onChange(team.id)
  }

  function handleBlur() {
    window.setTimeout(() => {
      setIsOpen(false)
      setIsEditingBadge(false)
    }, 120)
  }

  const showBadgePresentation = presentation === 'badge' && !isEditingBadge

  return (
    <div className={presentation === 'badge' ? 'team-search team-search--badge' : 'team-search'}>
      <input name={name} type="hidden" value={value || exactTeam?.id || ''} />
      {showBadgePresentation ? (
        <button
          className="team-search__badge-button"
          type="button"
          onClick={() => {
            setIsEditingBadge(true)
            setIsOpen(true)
          }}
        >
          <TeamBadge align={align} team={selectedTeam} />
        </button>
      ) : (
        <input
          aria-invalid={hasInvalidTeam}
          className={hasInvalidTeam ? 'team-search__input team-search__input--invalid' : 'team-search__input'}
          placeholder={placeholder}
          value={query}
          onBlur={handleBlur}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={() => setIsOpen(true)}
        />
      )}
      {isOpen && matchingTeams.length > 0 ? (
        <div className="team-search__options">
          {matchingTeams.map((team) => (
            <button key={team.id} type="button" onMouseDown={() => selectTeam(team)}>
              <TeamBadge team={team} />
            </button>
          ))}
        </div>
      ) : isOpen && excludedExactTeam ? (
        <div className="team-search__options">
          <span className="team-search__note">
            {excludedExactTeam.name} já está em outro jogo desta rodada.
          </span>
        </div>
      ) : null}
    </div>
  )
}

function normalizeTeamName(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { TeamBadge } from '../../../components/TeamBadge'
import type { Team } from '../../../types'
import { europeanCountries, getFlagUrl } from '../../../utils/europeanCountries'
import './TeamsPage.css'

type TeamsPageProps = {
  onAddTeam: (event: FormEvent<HTMLFormElement>) => void
  onDeleteTeam: (teamId: string) => void
  onUpdateTeam: (team: Team) => void
  teams: Team[]
}

export function TeamsPage({
  onAddTeam,
  onDeleteTeam,
  onUpdateTeam,
  teams,
}: TeamsPageProps) {
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null)

  return (
    <>
      <div className="teams-admin-layout">
        <TeamForm onAddTeam={onAddTeam} />
        <RegisteredTeams teams={teams} onDeleteRequest={setTeamToDelete} onEdit={setEditingTeam} />
      </div>

      {editingTeam ? (
        <EditTeamModal
          team={editingTeam}
          onCancel={() => setEditingTeam(null)}
          onSave={(team) => {
            onUpdateTeam(team)
            setEditingTeam(null)
          }}
        />
      ) : null}

      {teamToDelete ? (
        <ConfirmDeleteModal
          team={teamToDelete}
          onCancel={() => setTeamToDelete(null)}
          onConfirm={() => {
            onDeleteTeam(teamToDelete.id)
            setTeamToDelete(null)
          }}
        />
      ) : null}
    </>
  )
}

function TeamForm({ onAddTeam }: { onAddTeam: (event: FormEvent<HTMLFormElement>) => void }) {
  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')
  const [countryCode, setCountryCode] = useState('GB')
  const [countrySearch, setCountrySearch] = useState('')
  const filteredCountries = europeanCountries.filter((country) =>
    `${country.name} ${country.code}`.toLowerCase().includes(countrySearch.toLowerCase()),
  )

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const hasRequiredFields = name.trim() && shortName.trim() && countryCode.trim()

    onAddTeam(event)

    if (hasRequiredFields) {
      clearTeamForm()
    }
  }

  function selectCountry(code: string) {
    setCountryCode(code)
    setCountrySearch('')
  }

  function clearTeamForm() {
    setName('')
    setShortName('')
    setCountryCode('GB')
    setCountrySearch('')
  }

  return (
    <form className="admin-panel" onSubmit={handleSubmit}>
      <span className="eyebrow">Times</span>
      <h2>Cadastrar time</h2>
      <input name="name" placeholder="Nome do time" value={name} onChange={(event) => setName(event.target.value)} />
      <input
        name="shortName"
        maxLength={4}
        placeholder="Sigla"
        value={shortName}
        onChange={(event) => setShortName(event.target.value.toUpperCase())}
      />
      <input name="countryCode" type="hidden" value={countryCode} />
      <div className="country-picker">
        <label htmlFor="country-search">País</label>
        <div className="selected-country">
          <img alt="" height="24" src={getFlagUrl(countryCode)} width="24" />
          <strong>{europeanCountries.find((country) => country.code === countryCode)?.name}</strong>
        </div>
        <input
          id="country-search"
          placeholder="Pesquisar país europeu"
          value={countrySearch}
          onChange={(event) => setCountrySearch(event.target.value)}
        />
        <div className="country-options">
          {filteredCountries.map((country) => (
            <button key={country.code} type="button" onClick={() => selectCountry(country.code)}>
              <img alt="" height="24" src={getFlagUrl(country.code)} width="24" />
              <span>{country.name}</span>
            </button>
          ))}
        </div>
      </div>
      <Button type="submit">Adicionar time</Button>
    </form>
  )
}

function RegisteredTeams({
  onDeleteRequest,
  onEdit,
  teams,
}: {
  onDeleteRequest: (team: Team) => void
  onEdit: (team: Team) => void
  teams: Team[]
}) {
  const [search, setSearch] = useState('')
  const normalizedSearch = normalizeText(search)
  const filteredTeams = normalizedSearch
    ? teams.filter((team) =>
      normalizeText(`${team.name} ${team.shortName} ${team.countryName ?? ''}`).includes(normalizedSearch),
    )
    : teams

  return (
    <div className="admin-panel registered-teams">
      <span className="eyebrow">Times</span>
      <h2>Times cadastrados</h2>

      {teams.length === 0 ? (
        <p className="muted-text">Nenhum time cadastrado ainda.</p>
      ) : (
        <>
          <input
            aria-label="Pesquisar time cadastrado"
            placeholder="Pesquisar time..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {filteredTeams.length === 0 ? (
            <p className="muted-text">Nenhum time encontrado para "{search}".</p>
          ) : (
            <div className="registered-team-list">
              {filteredTeams.map((team) => (
                <article className="registered-team" key={team.id}>
                  <TeamBadge team={team} />
                  <div className="registered-team__actions">
                    <Button onClick={() => onEdit(team)} variant="ghost">
                      Editar
                    </Button>
                    <button className="danger-button" type="button" onClick={() => onDeleteRequest(team)}>
                      Excluir
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function EditTeamModal({
  onCancel,
  onSave,
  team,
}: {
  onCancel: () => void
  onSave: (team: Team) => void
  team: Team
}) {
  const [name, setName] = useState(team.name)
  const [shortName, setShortName] = useState(team.shortName)
  const [countryCode, setCountryCode] = useState(team.countryCode)
  const [countrySearch, setCountrySearch] = useState('')
  const filteredCountries = europeanCountries.filter((country) =>
    `${country.name} ${country.code}`.toLowerCase().includes(countrySearch.toLowerCase()),
  )

  return (
    <div className="confirm-overlay" role="presentation">
      <form
        className="confirm-card edit-team-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-team-title"
        onSubmit={(event) => {
          event.preventDefault()
          onSave({ ...team, name, shortName, countryCode })
        }}
      >
        <span className="eyebrow">Editar time</span>
        <h2 id="edit-team-title">{team.name}</h2>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do time" />
        <input
          maxLength={4}
          value={shortName}
          onChange={(event) => setShortName(event.target.value.toUpperCase())}
          placeholder="Sigla"
        />
        <div className="country-picker country-picker--light">
          <label htmlFor="edit-country-search">País</label>
          <div className="selected-country">
            <img alt="" height="24" src={getFlagUrl(countryCode)} width="24" />
            <strong>{europeanCountries.find((country) => country.code === countryCode)?.name}</strong>
          </div>
          <input
            id="edit-country-search"
            placeholder="Pesquisar país europeu"
            value={countrySearch}
            onChange={(event) => setCountrySearch(event.target.value)}
          />
          <div className="country-options">
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  setCountryCode(country.code)
                  setCountrySearch('')
                }}
              >
                <img alt="" height="24" src={getFlagUrl(country.code)} width="24" />
                <span>{country.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="confirm-actions">
          <Button className="confirm-cancel-button" onClick={onCancel} variant="ghost">
            Cancelar
          </Button>
          <Button type="submit">Salvar alterações</Button>
        </div>
      </form>
    </div>
  )
}

function ConfirmDeleteModal({
  onCancel,
  onConfirm,
  team,
}: {
  onCancel: () => void
  onConfirm: () => void
  team: Team
}) {
  return (
    <div className="confirm-overlay" role="presentation">
      <div className="confirm-card" role="dialog" aria-modal="true" aria-labelledby="delete-team-title">
        <span className="eyebrow">Confirmar exclusão</span>
        <h2 id="delete-team-title">Apagar {team.name}?</h2>
        <p>Essa ação remove o time cadastrado do bolão. Tem certeza que quer continuar?</p>
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

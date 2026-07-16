import { useState, type FormEvent } from 'react'
import type { CompetitionPredictionResult, KnockoutTie, Match, Player, PlayerStat, Round, Team } from '../../types'
import { CompetitionPredictionsPage } from './CompetitionPredictionsPage'
import { KnockoutPage } from './KnockoutPage'
import { PlayersPage } from './PlayersPage'
import { PlayerStatsPage } from './PlayerStatsPage'
import { RoundsPage } from './RoundsPage'
import { TeamsPage } from './TeamsPage'
import './AdminPage.css'

type AdminSection = 'teams' | 'rounds' | 'knockout' | 'player-stats' | 'competition-predictions' | 'players'

export type KnockoutScoreField =
  | 'homeLegHomeScore'
  | 'homeLegAwayScore'
  | 'awayLegHomeScore'
  | 'awayLegAwayScore'

type AdminPageProps = {
  competitionPredictionResult?: CompetitionPredictionResult
  knockout: KnockoutTie[]
  matches: Match[]
  onAddKnockoutTie: (event: FormEvent<HTMLFormElement>) => void
  onAddPlayerStat: (event: FormEvent<HTMLFormElement>) => void
  onAddTeam: (event: FormEvent<HTMLFormElement>) => void
  onApproveUser: (userId: string, approved: boolean) => void
  onDeleteKnockoutTie: (tieId: string) => void
  onDeletePlayerStat: (playerStatId: string) => void
  onDeleteTeam: (teamId: string) => void
  onKnockoutLegDeadlineChange: (stage: string, leg: 'home' | 'away', value: string) => void
  onKnockoutScoreChange: (tieId: string, field: KnockoutScoreField, value: string) => void
  onKnockoutTeamSlotChange: (tieId: string, slot: 'home' | 'away', teamId: string) => void
  onPublishKnockoutScore: (tieId: string, leg?: 'home' | 'away') => void
  onPublishRound: (roundNumber: number, deadline: string) => void
  onPublishScore: (matchId: string) => void
  onPublishCompetitionPredictionResult: () => void
  onRealScoreChange: (matchId: string, side: 'realHomeScore' | 'realAwayScore', value: string) => void
  onSaveCompetitionPredictionResult: (event: FormEvent<HTMLFormElement>) => void
  onSaveRound: (
    roundNumber: number,
    deadline: string,
    event: FormEvent<HTMLFormElement>,
  ) => void
  onSaveRoundOf16: (event: FormEvent<HTMLFormElement>) => void
  onUpdatePlayerStat: (playerStat: PlayerStat) => void
  onUpdateTeam: (team: Team) => void
  onWinnerChange: (tieId: string, winnerTeamId: string) => void
  playerStats: PlayerStat[]
  players: Player[]
  rounds: Round[]
  teamMap: Map<string, Team>
  teams: Team[]
}

const adminSections: Array<{ id: AdminSection; label: string }> = [
  { id: 'players', label: 'Jogadores' },
  { id: 'teams', label: 'Cadastrar time' },
  { id: 'rounds', label: 'Rodadas' },
  { id: 'knockout', label: 'Mata-mata' },
  { id: 'player-stats', label: 'Artilharia' },
  { id: 'competition-predictions', label: 'Previsões' },
]

export function AdminPage({
  competitionPredictionResult,
  knockout,
  matches,
  onAddKnockoutTie,
  onAddPlayerStat,
  onAddTeam,
  onApproveUser,
  onDeleteKnockoutTie,
  onDeletePlayerStat,
  onDeleteTeam,
  onKnockoutLegDeadlineChange,
  onKnockoutScoreChange,
  onKnockoutTeamSlotChange,
  onPublishKnockoutScore,
  onPublishRound,
  onPublishScore,
  onPublishCompetitionPredictionResult,
  onRealScoreChange,
  onSaveCompetitionPredictionResult,
  onSaveRound,
  onSaveRoundOf16,
  onUpdatePlayerStat,
  onUpdateTeam,
  onWinnerChange,
  playerStats,
  players,
  rounds,
  teamMap,
  teams,
}: AdminPageProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>('rounds')

  return (
    <section className="admin-page">
      <div className="admin-page__heading">
        <div>
          <span className="eyebrow">Modo admin</span>
          <h2>Painel de controle</h2>
        </div>
      </div>

      <nav className="admin-menu" aria-label="Areas do admin">
        {adminSections.map((section) => (
          <button
            key={section.id}
            className={activeSection === section.id ? 'active' : ''}
            type="button"
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>

      {activeSection === 'players' ? (
        <PlayersPage players={players} onApproveUser={onApproveUser} />
      ) : null}

      {activeSection === 'teams' ? (
        <TeamsPage
          teams={teams}
          onAddTeam={onAddTeam}
          onDeleteTeam={onDeleteTeam}
          onUpdateTeam={onUpdateTeam}
        />
      ) : null}

      {activeSection === 'rounds' ? (
        <RoundsPage
          matches={matches}
          rounds={rounds}
          teamMap={teamMap}
          teams={teams}
          onPublishRound={onPublishRound}
          onPublishScore={onPublishScore}
          onRealScoreChange={onRealScoreChange}
          onSaveRound={onSaveRound}
        />
      ) : null}

      {activeSection === 'knockout' ? (
        <KnockoutPage
          knockout={knockout}
          teamMap={teamMap}
          teams={teams}
          onAddKnockoutTie={onAddKnockoutTie}
          onDeleteKnockoutTie={onDeleteKnockoutTie}
          onKnockoutLegDeadlineChange={onKnockoutLegDeadlineChange}
          onKnockoutScoreChange={onKnockoutScoreChange}
          onKnockoutTeamSlotChange={onKnockoutTeamSlotChange}
          onPublishKnockoutScore={onPublishKnockoutScore}
          onSaveRoundOf16={onSaveRoundOf16}
          onWinnerChange={onWinnerChange}
        />
      ) : null}

      {activeSection === 'player-stats' ? (
        <PlayerStatsPage
          playerStats={playerStats}
          teamMap={teamMap}
          teams={teams}
          onAddPlayerStat={onAddPlayerStat}
          onDeletePlayerStat={onDeletePlayerStat}
          onUpdatePlayerStat={onUpdatePlayerStat}
        />
      ) : null}

      {activeSection === 'competition-predictions' ? (
        <CompetitionPredictionsPage
          competitionPredictionResult={competitionPredictionResult}
          teams={teams}
          onPublishCompetitionPredictionResult={onPublishCompetitionPredictionResult}
          onSaveCompetitionPredictionResult={onSaveCompetitionPredictionResult}
        />
      ) : null}
    </section>
  )
}

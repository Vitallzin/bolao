import { useEffect, useState, type FormEvent, type FormEventHandler } from 'react'
import { AppHeader } from '../../components/AppHeader'
import { EmptyState } from '../../components/EmptyState'
import { NavigationTabs } from '../../components/NavigationTabs'
import { AdminPage } from '../AdminPage'
import { AboutPage } from './AboutPage'
import { ChampionsPage } from './ChampionsPage'
import { CompetitionPredictionsPage } from './CompetitionPredictionsPage'
import { KnockoutPage } from './KnockoutPage'
import { PredictionsPage } from './PredictionsPage'
import { RankingPage } from './RankingPage'
import { RulesPage } from './RulesPage'
import { StatisticsPage } from './StatisticsPage'
import type {
  CompetitionPrediction,
  CompetitionPredictionResult,
  KnockoutPrediction,
  KnockoutTie,
  Match,
  NotificationPreferences,
  Player,
  PlayerStat,
  Prediction,
  RankingEntry,
  Round,
  Team,
  View,
} from '../../types'
import { buildStandings } from '../../utils/scoring'
import './DashboardPage.css'

type DashboardPageProps = {
  activeView: View
  adminMode: boolean
  authProvider: 'google' | 'password'
  competitionPredictionDeadline?: Date | null
  competitionPredictionResult?: CompetitionPredictionResult
  competitionPredictions: CompetitionPrediction[]
  isAdmin: boolean
  knockout: KnockoutTie[]
  knockoutPredictions: KnockoutPrediction[]
  lastScoredRoundId?: string | null
  matches: Match[]
  message: string
  messageId: number
  onAddKnockoutTie: FormEventHandler<HTMLFormElement>
  onAddPlayerStat: FormEventHandler<HTMLFormElement>
  onAddTeam: FormEventHandler<HTMLFormElement>
  onApproveUser: (userId: string, approved: boolean) => void
  onDeletePlayer: (userId: string) => void
  onDeleteAccount: () => Promise<void>
  onDeleteKnockoutTie: (tieId: string) => void
  onDeletePlayerStat: (playerStatId: string) => void
  onDeleteTeam: (teamId: string) => void
  onKnockoutScoreChange: (
    tieId: string,
    field: 'homeLegHomeScore' | 'homeLegAwayScore' | 'awayLegHomeScore' | 'awayLegAwayScore',
    value: string,
  ) => void
  onKnockoutLegDeadlineChange: (stage: string, leg: 'home' | 'away', value: string) => void
  onKnockoutPredictionChange: (
    tieId: string,
    leg: 'home' | 'away',
    side: 'homeScore' | 'awayScore',
    value: string,
  ) => void
  onLogout: () => void
  onNotificationPreferencesUpdate: (preferences: NotificationPreferences) => Promise<void>
  onProfileNameUpdate: (name: string) => Promise<void>
  onPredictionChange: (matchId: string, side: 'homeScore' | 'awayScore', value: string) => void
  onPublishCompetitionPredictionResult: () => void
  onSaveCompetitionPredictionDeadline: (value: string) => void
  onPublishKnockoutScore: (tieId: string, leg?: 'home' | 'away') => void
  onDeleteRound: (roundNumber: number) => void
  onPublishRound: (roundNumber: number, deadline: string) => void
  onPublishScore: (matchId: string) => void
  onRealScoreChange: (matchId: string, side: 'realHomeScore' | 'realAwayScore', value: string) => void
  onSaveCompetitionPredictionResult: (event: FormEvent<HTMLFormElement>) => void
  onSaveRoundOf16: FormEventHandler<HTMLFormElement>
  onSaveRound: (
    roundNumber: number,
    deadline: string,
    event: FormEvent<HTMLFormElement>,
  ) => void
  onToggleAdminMode: () => void
  onSubmitCompetitionPrediction: (event: FormEvent<HTMLFormElement>) => void
  onKnockoutTeamSlotChange: (tieId: string, slot: 'home' | 'away', teamId: string) => void
  onUpdatePlayerStat: (playerStat: PlayerStat) => void
  onUpdateTeam: (team: Team) => void
  onViewChange: (view: View) => void
  onWinnerChange: (tieId: string, winnerTeamId: string) => void
  predictions: Prediction[]
  playerStats: PlayerStat[]
  players: Player[]
  publishedRounds: Round[]
  ranking: RankingEntry[]
  rounds: Round[]
  standings: ReturnType<typeof buildStandings>
  teamMap: Map<string, Team>
  teams: Team[]
  currentUser: Player
}

export function DashboardPage({
  activeView,
  adminMode,
  authProvider,
  competitionPredictionDeadline,
  competitionPredictionResult,
  competitionPredictions,
  currentUser,
  isAdmin,
  knockout,
  knockoutPredictions,
  lastScoredRoundId,
  matches,
  message,
  messageId,
  onAddKnockoutTie,
  onAddPlayerStat,
  onAddTeam,
  onApproveUser,
  onDeletePlayer,
  onDeleteAccount,
  onDeleteKnockoutTie,
  onDeletePlayerStat,
  onDeleteTeam,
  onKnockoutScoreChange,
  onKnockoutLegDeadlineChange,
  onKnockoutPredictionChange,
  onLogout,
  onNotificationPreferencesUpdate,
  onProfileNameUpdate,
  onPredictionChange,
  onPublishCompetitionPredictionResult,
  onSaveCompetitionPredictionDeadline,
  onPublishKnockoutScore,
  onDeleteRound,
  onPublishRound,
  onPublishScore,
  onRealScoreChange,
  onSaveCompetitionPredictionResult,
  onSaveRoundOf16,
  onSaveRound,
  onToggleAdminMode,
  onSubmitCompetitionPrediction,
  onKnockoutTeamSlotChange,
  onUpdatePlayerStat,
  onUpdateTeam,
  onViewChange,
  onWinnerChange,
  predictions,
  playerStats,
  players,
  publishedRounds,
  ranking,
  rounds,
  standings,
  teamMap,
  teams,
}: DashboardPageProps) {
  const [toastVisible, setToastVisible] = useState(false)

  useEffect(() => {
    if (!message) {
      setToastVisible(false)
      return
    }

    setToastVisible(true)
    const timeoutId = window.setTimeout(() => setToastVisible(false), 2800)

    return () => window.clearTimeout(timeoutId)
  }, [message, messageId])

  return (
    <main className="app-shell">
      <AppHeader
        adminMode={adminMode}
        authProvider={authProvider}
        currentUser={currentUser}
        isAdmin={isAdmin}
        onDeleteAccount={onDeleteAccount}
        onLogout={onLogout}
        onNotificationPreferencesUpdate={onNotificationPreferencesUpdate}
        onProfileNameUpdate={onProfileNameUpdate}
        onToggleAdminMode={onToggleAdminMode}
      />

      {adminMode && isAdmin ? null : (
        <NavigationTabs activeView={activeView} onChange={onViewChange} />
      )}

      {toastVisible ? (
        <p className="app-toast" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}

      {adminMode && isAdmin ? (
        <AdminPage
          competitionPredictionDeadline={competitionPredictionDeadline}
          competitionPredictionResult={competitionPredictionResult}
          matches={matches}
          knockout={knockout}
          playerStats={playerStats}
          players={players}
          rounds={rounds}
          teams={teams}
          teamMap={teamMap}
          onAddKnockoutTie={onAddKnockoutTie}
          onAddPlayerStat={onAddPlayerStat}
          onAddTeam={onAddTeam}
          onApproveUser={onApproveUser}
          onDeletePlayer={onDeletePlayer}
          onDeleteKnockoutTie={onDeleteKnockoutTie}
          onDeletePlayerStat={onDeletePlayerStat}
          onDeleteTeam={onDeleteTeam}
          onKnockoutScoreChange={onKnockoutScoreChange}
          onKnockoutLegDeadlineChange={onKnockoutLegDeadlineChange}
          onPublishCompetitionPredictionResult={onPublishCompetitionPredictionResult}
          onSaveCompetitionPredictionDeadline={onSaveCompetitionPredictionDeadline}
          onPublishKnockoutScore={onPublishKnockoutScore}
          onDeleteRound={onDeleteRound}
          onPublishRound={onPublishRound}
          onPublishScore={onPublishScore}
          onRealScoreChange={onRealScoreChange}
          onSaveCompetitionPredictionResult={onSaveCompetitionPredictionResult}
          onSaveRoundOf16={onSaveRoundOf16}
          onSaveRound={onSaveRound}
          onKnockoutTeamSlotChange={onKnockoutTeamSlotChange}
          onUpdatePlayerStat={onUpdatePlayerStat}
          onUpdateTeam={onUpdateTeam}
          onWinnerChange={onWinnerChange}
        />
      ) : null}

      {!adminMode && activeView === 'palpites' ? (
        isAdmin || currentUser.approved ? (
          <PredictionsPage
            currentUser={currentUser}
            knockout={knockout}
            knockoutPredictions={knockoutPredictions}
            matches={matches}
            predictions={predictions}
            ranking={ranking}
            rounds={publishedRounds}
            teamMap={teamMap}
            onKnockoutPredictionChange={onKnockoutPredictionChange}
            onPredictionChange={onPredictionChange}
          />
        ) : (
          <PendingApprovalNotice />
        )
      ) : null}

      {!adminMode && activeView === 'previsoes' ? (
        isAdmin || currentUser.approved ? (
          <CompetitionPredictionsPage
            competitionPredictionResult={competitionPredictionResult}
            competitionPredictions={competitionPredictions}
            currentUser={currentUser}
            competitionPredictionDeadline={competitionPredictionDeadline}
            teamMap={teamMap}
            teams={teams}
            onSubmitCompetitionPrediction={onSubmitCompetitionPrediction}
          />
        ) : (
          <PendingApprovalNotice />
        )
      ) : null}

      {!adminMode && activeView === 'ranking' ? <RankingPage lastScoredRoundId={lastScoredRoundId} players={players} ranking={ranking} /> : null}

      {!adminMode && activeView === 'champions' ? (
        <ChampionsPage standings={standings} />
      ) : null}

      {!adminMode && activeView === 'statistics' ? (
        <StatisticsPage playerStats={playerStats} teamMap={teamMap} />
      ) : null}

      {!adminMode && activeView === 'mata-mata' ? (
        <KnockoutPage
          knockout={knockout}
          teamMap={teamMap}
        />
      ) : null}

      {!adminMode && activeView === 'regras' ? <RulesPage /> : null}

      {!adminMode && activeView === 'sobre' ? <AboutPage /> : null}
    </main>
  )
}

function PendingApprovalNotice() {
  return (
    <EmptyState
      title="Voce esta como visitante"
      text="Visitante so consegue ver o site. Peca para o admin te liberar como jogador para enviar palpites e aparecer no ranking."
    />
  )
}

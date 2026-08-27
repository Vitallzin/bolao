import { useEffect, useMemo, useState } from 'react'
import { deleteUser } from 'firebase/auth'
import { doc, writeBatch } from 'firebase/firestore'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage, VerifyEmailPage } from './pages/LoginPage'
import { competitionId } from './constants'
import { db } from './firebase'
import { useAuthProfile } from './hooks/useAuthProfile'
import { useCompetitionActions } from './hooks/useCompetitionActions'
import { useCompetitionData } from './hooks/useCompetitionData'
import type { KnockoutTie, View } from './types'
import { getFirebaseMessage } from './utils/firebaseErrors'
import {
  buildStandings,
  calculateCompetitionPredictionPoints,
  calculateKnockoutPredictionPoints,
  calculatePredictionPoints,
} from './utils/scoring'
import './App.css'

function App() {
  const {
    authUser,
    currentUser,
    emailVerified,
    handleEmailLogin,
    handleEmailSignUp,
    handleGoogleLogin,
    handleLogout,
    handleNotificationPreferencesUpdate,
    handleProfileNameUpdate,
    loading,
    message,
    messageId,
    refreshEmailVerification,
    resendVerificationEmail,
    setCurrentUser,
    setMessage,
  } = useAuthProfile()
  const {
    competitionPredictionResult,
    competitionPredictions,
    knockout,
    knockoutPredictions,
    matches,
    playerStats,
    players,
    predictions,
    rounds,
    teams,
  } = useCompetitionData(authUser)
  const [activeView, setActiveView] = useState<View>('palpites')
  const [adminMode, setAdminMode] = useState(false)

  const authProvider = authUser?.providerData[0]?.providerId === 'google.com' ? 'google' : 'password'
  const teamMap = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams])
  const publishedRounds = useMemo(
    () => rounds.filter((round) => round.status === 'published'),
    [rounds],
  )
  const isAdmin = currentUser?.role === 'admin'
  const standings = useMemo(() => buildStandings(teams, matches), [matches, teams])
  const ranking = useMemo(
    () =>
      players
        .filter((player) => player.approved)
        .map((player) => {
          const points = predictions
            .filter((prediction) => prediction.userId === player.id)
            .reduce((total, prediction) => {
              const match = matches.find((item) => item.id === prediction.matchId)

              if (!match || match.status !== 'finished') {
                return total
              }

              return total + calculatePredictionPoints(prediction, match)
            }, 0)

          const knockoutPoints = knockoutPredictions
            .filter((prediction) => prediction.userId === player.id)
            .reduce((total, prediction) => {
              const tie = knockout.find((item) => item.id === prediction.tieId)

              if (!tie || !isKnockoutLegPublished(tie, prediction.leg)) {
                return total
              }

              return total + calculateKnockoutPredictionPoints({
                awayScore: prediction.awayScore,
                homeScore: prediction.homeScore,
                leg: prediction.leg,
                tie,
              })
            }, 0)
          const competitionPoints = calculateCompetitionPredictionPoints(
            competitionPredictions.find((prediction) => prediction.userId === player.id) ?? {
              id: '',
              userId: player.id,
              topScorers: [],
              topAssists: [],
              bestPlayer: '',
              bestGoalkeeper: '',
              championTeamId: '',
              runnerUpTeamId: '',
            },
            competitionPredictionResult,
          )

          return { ...player, points: points + knockoutPoints + competitionPoints }
        })
        .sort((a, b) => b.points - a.points),
    [competitionPredictionResult, competitionPredictions, knockout, knockoutPredictions, matches, players, predictions],
  )

  const actions = useCompetitionActions({
    competitionPredictionResult,
    competitionPredictions,
    currentUser,
    knockout,
    knockoutPredictions,
    matches,
    predictions,
    rounds,
    setMessage,
  })

  useEffect(() => {
    if (!authUser) {
      return
    }

    const updatedProfile = players.find((player) => player.id === authUser.uid)

    if (updatedProfile) {
      setCurrentUser({
        ...updatedProfile,
        photoURL: updatedProfile.photoURL || authUser.photoURL || null,
      })
    }
  }, [authUser, players, setCurrentUser])

  async function logout() {
    await handleLogout()
    setAdminMode(false)
    setActiveView('palpites')
  }

  async function deleteAccount() {
    if (!authUser || !currentUser) {
      return
    }

    try {
      const batch = writeBatch(db)

      predictions
        .filter((prediction) => prediction.userId === currentUser.id)
        .forEach((prediction) => {
          batch.delete(doc(db, 'competitions', competitionId, 'predictions', prediction.id))
        })

      knockoutPredictions
        .filter((prediction) => prediction.userId === currentUser.id)
        .forEach((prediction) => {
          batch.delete(doc(db, 'competitions', competitionId, 'knockoutPredictions', prediction.id))
        })

      competitionPredictions
        .filter((prediction) => prediction.userId === currentUser.id)
        .forEach((prediction) => {
          batch.delete(doc(db, 'competitions', competitionId, 'competitionPredictions', prediction.id))
        })

      batch.delete(doc(db, 'users', currentUser.id))

      await batch.commit()
      await deleteUser(authUser)
    } catch (error) {
      setMessage(getFirebaseMessage(error))
      throw error
    }
  }

  function changeView(view: View) {
    setActiveView(view)
    setAdminMode(false)
  }

  function toggleAdminMode() {
    if (!isAdmin) {
      setAdminMode(false)
      setActiveView('palpites')
      return
    }

    setAdminMode((current) => !current)
    setActiveView('palpites')
  }

  if (loading) {
    return <main className="loading-screen">Carregando bolao...</main>
  }

  if (!currentUser) {
    return (
      <LoginPage
        message={message}
        onEmailLogin={handleEmailLogin}
        onEmailSignUp={handleEmailSignUp}
        onGoogleLogin={handleGoogleLogin}
      />
    )
  }

  if (!emailVerified) {
    return (
      <VerifyEmailPage
        email={currentUser.email}
        message={message}
        onCheckAgain={refreshEmailVerification}
        onLogout={logout}
        onResend={resendVerificationEmail}
      />
    )
  }

  return (
    <DashboardPage
      activeView={activeView}
      adminMode={adminMode}
      authProvider={authProvider}
      currentUser={currentUser}
      competitionPredictionResult={competitionPredictionResult}
      competitionPredictions={competitionPredictions}
      isAdmin={isAdmin}
      knockout={knockout}
      knockoutPredictions={knockoutPredictions}
      matches={matches}
      message={message}
      messageId={messageId}
      playerStats={playerStats}
      players={players}
      predictions={predictions}
      ranking={ranking}
      publishedRounds={publishedRounds}
      rounds={rounds}
      standings={standings}
      teamMap={teamMap}
      teams={teams}
      onAddKnockoutTie={actions.addKnockoutTie}
      onAddPlayerStat={actions.addPlayerStat}
      onAddTeam={actions.addTeam}
      onApproveUser={actions.approveUser}
      onDeletePlayer={actions.deletePlayer}
      onDeleteAccount={deleteAccount}
      onDeleteKnockoutTie={actions.deleteKnockoutTie}
      onDeletePlayerStat={actions.deletePlayerStat}
      onDeleteTeam={actions.deleteTeam}
      onKnockoutScoreChange={actions.updateKnockoutScore}
      onKnockoutLegDeadlineChange={actions.updateKnockoutLegDeadline}
      onKnockoutPredictionChange={actions.handleKnockoutPrediction}
      onLogout={logout}
      onNotificationPreferencesUpdate={handleNotificationPreferencesUpdate}
      onProfileNameUpdate={handleProfileNameUpdate}
      onPredictionChange={actions.handlePrediction}
      onPublishKnockoutScore={actions.publishKnockoutScore}
      onPublishRound={actions.publishRound}
      onPublishScore={actions.publishScore}
      onRealScoreChange={actions.updateRealScore}
      onSaveRoundOf16={actions.saveRoundOf16}
      onSaveRound={actions.saveRound}
      onToggleAdminMode={toggleAdminMode}
      onKnockoutTeamSlotChange={actions.updateKnockoutTeamSlot}
      onPublishCompetitionPredictionResult={actions.publishCompetitionPredictionResult}
      onSaveCompetitionPredictionResult={actions.saveCompetitionPredictionResult}
      onSubmitCompetitionPrediction={actions.submitCompetitionPrediction}
      onUpdatePlayerStat={actions.updatePlayerStat}
      onUpdateTeam={actions.updateTeam}
      onViewChange={changeView}
      onWinnerChange={actions.updateWinner}
    />
  )
}

function isKnockoutLegPublished(tie: KnockoutTie, leg: 'home' | 'away') {
  if (tie.stage === 'final' && leg === 'away') {
    return false
  }

  return leg === 'home'
    ? Boolean(tie.homeLegScorePublished || tie.scorePublished)
    : Boolean(tie.awayLegScorePublished || tie.scorePublished)
}

export default App

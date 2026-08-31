import type { FormEvent } from 'react'
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  FieldPath,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { competitionId } from '../constants'
import { auth, db } from '../firebase'
import type {
  CompetitionPrediction,
  CompetitionPredictionResult,
  KnockoutPrediction,
  KnockoutTie,
  Match,
  Player,
  PlayerStat,
  Prediction,
  Round,
  Team,
} from '../types'
import { getCountryName } from '../utils/europeanCountries'

type KnockoutLeg = 'home' | 'away'

type UseCompetitionActionsProps = {
  currentUser: Player | null
  competitionPredictionDeadline: Date | null
  competitionPredictionResult?: CompetitionPredictionResult
  competitionPredictions: CompetitionPrediction[]
  knockout: KnockoutTie[]
  knockoutPredictions: KnockoutPrediction[]
  matches: Match[]
  predictions: Prediction[]
  rounds: Round[]
  setMessage: (message: string) => void
}

export function useCompetitionActions({
  currentUser,
  competitionPredictionDeadline,
  competitionPredictionResult,
  competitionPredictions,
  knockout,
  knockoutPredictions,
  matches,
  predictions,
  rounds,
  setMessage,
}: UseCompetitionActionsProps) {
  async function handlePrediction(matchId: string, side: 'homeScore' | 'awayScore', value: string) {
    const match = matches.find((item) => item.id === matchId)
    const round = match ? rounds.find((item) => item.id === match.roundId) : undefined

    if (!currentUser || !round || new Date() >= round.deadline) {
      return
    }

    const existing = predictions.find(
      (prediction) => prediction.userId === currentUser.id && prediction.matchId === matchId,
    )
    const score = Math.max(0, Number(value || 0))
    const homeScore = side === 'homeScore' ? score : existing?.homeScore ?? 0
    const awayScore = side === 'awayScore' ? score : existing?.awayScore ?? 0
    const predictionRef = doc(
      db,
      'competitions',
      competitionId,
      'predictions',
      `${currentUser.id}_${matchId}`,
    )

    await setDoc(
      predictionRef,
      {
        userId: currentUser.id,
        matchId,
        homeScore,
        awayScore,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }

  async function handleKnockoutPrediction(
    tieId: string,
    leg: KnockoutLeg,
    side: 'homeScore' | 'awayScore',
    value: string,
  ) {
    const tie = knockout.find((item) => item.id === tieId)
    const deadline = leg === 'home' ? tie?.homeLegDeadline : tie?.awayLegDeadline

    if (!currentUser || !tie || !deadline || new Date() >= deadline) {
      return
    }

    if (tie.stage === 'final' && leg === 'away') {
      return
    }

    const existing = knockoutPredictions.find(
      (prediction) => prediction.userId === currentUser.id && prediction.tieId === tieId && prediction.leg === leg,
    )
    const score = Math.max(0, Number(value || 0))
    const homeScore = side === 'homeScore' ? score : existing?.homeScore ?? 0
    const awayScore = side === 'awayScore' ? score : existing?.awayScore ?? 0

    await setDoc(
      doc(db, 'competitions', competitionId, 'knockoutPredictions', `${currentUser.id}_${tieId}_${leg}`),
      {
        userId: currentUser.id,
        tieId,
        leg,
        homeScore,
        awayScore,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }

  async function submitCompetitionPrediction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!currentUser) {
      return
    }

    if (!competitionPredictionDeadline) {
      setMessage('O admin ainda não abriu o prazo das previsões da competição.')
      return
    }

    if (new Date() >= competitionPredictionDeadline) {
      setMessage('O prazo para enviar previsões da competição já encerrou.')
      return
    }

    if (competitionPredictions.some((prediction) => prediction.userId === currentUser.id)) {
      setMessage('Você já enviou suas previsões da competição.')
      return
    }

    const data = new FormData(event.currentTarget)
    const topScorers = getPredictionList(data, 'topScorers')
    const topAssists = getPredictionList(data, 'topAssists')
    const bestPlayer = String(data.get('bestPlayer') || '').trim()
    const bestGoalkeeper = String(data.get('bestGoalkeeper') || '').trim()
    const championTeamId = String(data.get('championTeamId') || '')
    const runnerUpTeamId = String(data.get('runnerUpTeamId') || '')

    if (
      topScorers.some((item) => !item) ||
      topAssists.some((item) => !item) ||
      !bestPlayer ||
      !bestGoalkeeper ||
      !championTeamId ||
      !runnerUpTeamId ||
      hasDuplicateNames(topScorers) ||
      hasDuplicateNames(topAssists) ||
      championTeamId === runnerUpTeamId
    ) {
      setMessage('Preencha todas as previsões da competição.')
      return
    }

    await setDoc(doc(db, 'competitions', competitionId, 'competitionPredictions', currentUser.id), {
      userId: currentUser.id,
      topScorers,
      topAssists,
      bestPlayer,
      bestGoalkeeper,
      championTeamId,
      runnerUpTeamId,
      createdAt: serverTimestamp(),
    })
    setMessage('Previsões da competição enviadas.')
  }

  async function saveCompetitionPredictionResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const topScorers = getPredictionList(data, 'topScorers')
    const topAssists = getPredictionList(data, 'topAssists')
    const bestPlayer = String(data.get('bestPlayer') || '').trim()
    const bestGoalkeeper = String(data.get('bestGoalkeeper') || '').trim()
    const championTeamId = String(data.get('championTeamId') || '')
    const runnerUpTeamId = String(data.get('runnerUpTeamId') || '')

    if (
      topScorers.some((item) => !item) ||
      topAssists.some((item) => !item) ||
      !bestPlayer ||
      !bestGoalkeeper ||
      !championTeamId ||
      !runnerUpTeamId ||
      hasDuplicateNames(topScorers) ||
      hasDuplicateNames(topAssists) ||
      championTeamId === runnerUpTeamId
    ) {
      setMessage('Preencha todos os resultados oficiais das previsões.')
      return
    }

    await setDoc(
      doc(db, 'competitions', competitionId, 'competitionPredictionResults', 'official'),
      {
        topScorers,
        topAssists,
        bestPlayer,
        bestGoalkeeper,
        championTeamId,
        runnerUpTeamId,
        published: competitionPredictionResult?.published ?? false,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
    setMessage('Resultado das previsões salvo.')
  }

  /** Prazo proprio das previsoes da competicao, separado das rodadas. */
  async function saveCompetitionPredictionDeadline(value: string) {
    if (!value) {
      setMessage('Defina a data e o horário limite das previsões.')
      return
    }

    await setDoc(
      doc(db, 'competitions', competitionId, 'settings', 'competitionPredictions'),
      {
        deadline: Timestamp.fromDate(new Date(value)),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
    setMessage('Prazo das previsões salvo.')
  }

  async function publishCompetitionPredictionResult() {
    if (!competitionPredictionResult) {
      setMessage('Salve o resultado oficial antes de publicar.')
      return
    }

    await updateDoc(doc(db, 'competitions', competitionId, 'competitionPredictionResults', 'official'), {
      published: true,
      publishedAt: serverTimestamp(),
    })
    setMessage('Pontuação das previsões publicada no ranking.')
    await recalculateRankingAfterPublish()
  }

  async function addTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const name = String(data.get('name') || '').trim()
    const shortName = String(data.get('shortName') || '').trim().toUpperCase()
    const countryCode = String(data.get('countryCode') || '').trim().toUpperCase()

    if (!name || !shortName || !countryCode) {
      setMessage('Preencha nome, sigla e país do time.')
      return
    }

    await setDoc(doc(collection(db, 'competitions', competitionId, 'teams')), {
      name,
      shortName,
      countryCode,
      countryName: getCountryName(countryCode),
      color: '#073b91',
      createdAt: serverTimestamp(),
    })
    form.reset()
    setMessage('Time cadastrado.')
  }

  async function updateTeam(team: Team) {
    const name = team.name.trim()
    const shortName = team.shortName.trim().toUpperCase()
    const countryCode = team.countryCode.trim().toUpperCase()

    if (!name || !shortName || !countryCode) {
      setMessage('Preencha nome, sigla e país do time.')
      return
    }

    await updateDoc(doc(db, 'competitions', competitionId, 'teams', team.id), {
      name,
      shortName,
      countryCode,
      countryName: getCountryName(countryCode),
      updatedAt: serverTimestamp(),
    })
    setMessage('Time atualizado.')
  }

  async function deleteTeam(teamId: string) {
    await deleteDoc(doc(db, 'competitions', competitionId, 'teams', teamId))
    setMessage('Time excluido.')
  }

  /**
   * O ranking e calculado no servidor e gravado no Firestore. Toda acao do admin que
   * muda a pontuacao precisa pedir o recalculo, senao o ranking fica desatualizado.
   * Usado apos publicacoes, onde so existe o toast para avisar.
   */
  async function recalculateRankingAfterPublish() {
    const failure = await recalculateRanking()

    if (failure) {
      setMessage(`Ranking não atualizou: ${failure}`)
    }
  }

  /** Devolve null quando deu certo, ou o motivo da falha para ser exibido na tela. */
  async function recalculateRanking(): Promise<string | null> {
    if (!auth.currentUser) {
      return 'Entre de novo para recalcular o ranking.'
    }

    try {
      const idToken = await auth.currentUser.getIdToken()
      const response = await fetch('/api/recalculate-ranking', {
        headers: { Authorization: `Bearer ${idToken}` },
        method: 'POST',
      })

      if (response.ok) {
        return null
      }

      // 404 = funcao nao publicada (normal no localhost), 403 = nao e admin, 500 = erro no servidor.
      const body = await response.text().catch(() => '')
      let detail = body.slice(0, 400)

      try {
        detail = (JSON.parse(body) as { error?: string }).error ?? detail
      } catch {
        // Resposta nao e JSON (ex: pagina de erro da Vercel): usamos o texto cru.
      }

      return `HTTP ${response.status} — ${detail || 'sem detalhe'}`
    } catch (error) {
      return error instanceof Error ? error.message : 'falha de rede'
    }
  }

  async function approveUser(userId: string, approved: boolean) {
    await updateDoc(doc(db, 'users', userId), { approved })
    setMessage(approved ? 'Agora é jogador.' : 'Agora é visitante.')
    await recalculateRankingAfterPublish()
  }

  async function deletePlayer(userId: string) {
    if (userId === currentUser?.id) {
      setMessage('Você não pode remover a sua própria conta por aqui.')
      return
    }

    if (!auth.currentUser) {
      setMessage('Entre de novo para remover jogadores.')
      return
    }

    try {
      const idToken = await auth.currentUser.getIdToken()
      const response = await fetch('/api/delete-player', {
        body: JSON.stringify({ userId }),
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setMessage(data.error || 'Não foi possível remover o jogador.')
        return
      }

      setMessage('Jogador removido do bolão.')
      await recalculateRankingAfterPublish()
    } catch {
      setMessage('Não foi possível remover o jogador. Tente de novo em alguns segundos.')
    }
  }

  async function addPlayerStat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') || '').trim()
    const teamId = String(data.get('teamId') || '')
    const nationalityCode = String(data.get('nationalityCode') || '').trim().toUpperCase()
    const goals = Math.max(0, Number(data.get('goals') || 0))
    const assists = Math.max(0, Number(data.get('assists') || 0))

    if (!name || !teamId || !nationalityCode) {
      setMessage('Preencha jogador, time e nacionalidade.')
      return
    }

    await setDoc(doc(collection(db, 'competitions', competitionId, 'playerStats')), {
      name,
      teamId,
      nationalityCode,
      goals,
      assists,
      createdAt: serverTimestamp(),
    })
    event.currentTarget.reset()
    setMessage('Jogador cadastrado nas estatísticas.')
  }

  async function updatePlayerStat(playerStat: PlayerStat) {
    const name = playerStat.name.trim()
    const nationalityCode = playerStat.nationalityCode.trim().toUpperCase()

    if (!name || !playerStat.teamId || !nationalityCode) {
      setMessage('Preencha jogador, time e nacionalidade.')
      return
    }

    await updateDoc(doc(db, 'competitions', competitionId, 'playerStats', playerStat.id), {
      name,
      teamId: playerStat.teamId,
      nationalityCode,
      goals: Math.max(0, Number(playerStat.goals || 0)),
      assists: Math.max(0, Number(playerStat.assists || 0)),
      updatedAt: serverTimestamp(),
    })
    setMessage('Estatísticas do jogador atualizadas.')
  }

  async function deletePlayerStat(playerStatId: string) {
    await deleteDoc(doc(db, 'competitions', competitionId, 'playerStats', playerStatId))
    setMessage('Jogador removido das estatísticas.')
  }

  async function saveRound(
    roundNumber: number,
    deadline: string,
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!deadline) {
      setMessage('Defina o prazo da rodada.')
      return
    }

    const roundId = `round-${roundNumber}`
    const data = new FormData(event.currentTarget)
    const batch = writeBatch(db)
    let savedMatches = 0

    batch.set(
      doc(db, 'competitions', competitionId, 'rounds', roundId),
      {
        name: `Rodada ${roundNumber}`,
        number: roundNumber,
        deadline: Timestamp.fromDate(new Date(deadline)),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    for (const day of [1, 2] as const) {
      for (let slot = 1; slot <= 9; slot += 1) {
        const homeTeamId = String(data.get(`day-${day}-slot-${slot}-homeTeamId`) || '')
        const awayTeamId = String(data.get(`day-${day}-slot-${slot}-awayTeamId`) || '')

        if (!homeTeamId && !awayTeamId) {
          continue
        }

        if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) {
          setMessage(`Confira o jogo ${slot} do Dia ${day}.`)
          return
        }

        const matchId = `round-${roundNumber}-day-${day}-slot-${slot}`
        const existingMatch = matches.find((match) => match.id === matchId)

        batch.set(
          doc(db, 'competitions', competitionId, 'matches', matchId),
          {
            roundId,
            roundNumber,
            day,
            slot,
            homeTeamId,
            awayTeamId,
            startsAt: Timestamp.fromDate(new Date(deadline)),
            status: existingMatch?.status ?? 'scheduled',
            realHomeScore: existingMatch?.realHomeScore ?? null,
            realAwayScore: existingMatch?.realAwayScore ?? null,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )
        savedMatches += 1
      }
    }

    await batch.commit()
    setMessage(`Rodada ${roundNumber} salva com ${savedMatches} jogo(s).`)
  }

  async function publishRound(roundNumber: number, deadline: string) {
    const roundId = `round-${roundNumber}`
    const roundMatches = matches.filter((match) => match.roundId === roundId)

    if (!deadline) {
      setMessage('Defina o prazo da rodada antes de publicar.')
      return
    }

    if (roundMatches.length < 18) {
      setMessage('Preencha os 18 jogos antes de publicar a rodada.')
      return
    }

    await setDoc(
      doc(db, 'competitions', competitionId, 'rounds', roundId),
      {
        name: `Rodada ${roundNumber}`,
        number: roundNumber,
        deadline: Timestamp.fromDate(new Date(deadline)),
        status: 'published',
        publishedAt: serverTimestamp(),
      },
      { merge: true },
    )

    setMessage(`Rodada ${roundNumber} publicada.`)
  }

  /**
   * Apaga a rodada inteira: os jogos, os palpites feitos neles e a propria rodada.
   * A tabela da fase de liga e derivada dos jogos, entao ela se corrige sozinha.
   */
  async function deleteRound(roundNumber: number) {
    const roundId = `round-${roundNumber}`
    const roundMatches = matches.filter((match) => match.roundId === roundId)
    const matchIds = new Set(roundMatches.map((match) => match.id))
    const roundPredictions = predictions.filter((prediction) => matchIds.has(prediction.matchId))

    const refs = [
      ...roundPredictions.map((prediction) =>
        doc(db, 'competitions', competitionId, 'predictions', prediction.id),
      ),
      ...roundMatches.map((match) => doc(db, 'competitions', competitionId, 'matches', match.id)),
      doc(db, 'competitions', competitionId, 'rounds', roundId),
    ]

    // Um lote do Firestore aceita no maximo 500 operacoes.
    for (let index = 0; index < refs.length; index += 400) {
      const batch = writeBatch(db)
      refs.slice(index, index + 400).forEach((ref) => batch.delete(ref))
      await batch.commit()
    }

    await clearRoundNotificationMarks(roundId)

    setMessage(
      `Rodada ${roundNumber} apagada (${roundMatches.length} jogo(s) e ${roundPredictions.length} palpite(s)).`,
    )
    await recalculateRankingAfterPublish()
  }

  /**
   * O script de notificacao marca em cada usuario as rodadas ja avisadas, para nao
   * mandar o mesmo email duas vezes. Como o id da rodada e sempre o mesmo
   * (`round-1`), apagar e publicar de novo cairia na marca antiga e ninguem seria
   * avisado — entao apagar a rodada tem que apagar a marca junto.
   */
  async function clearRoundNotificationMarks(roundId: string) {
    const reminderKey = `round-${roundId}`
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const marked = usersSnapshot.docs.filter((item) => {
      const data = item.data()

      return (
        data.notifiedPublishedRounds?.[roundId] !== undefined ||
        data.notifiedDeadlineReminders?.[reminderKey] !== undefined
      )
    })

    // FieldPath em vez de string com ponto: o id tem hifen, e assim nao depende
    // de como o caminho seria interpretado.
    for (let index = 0; index < marked.length; index += 400) {
      const batch = writeBatch(db)

      marked.slice(index, index + 400).forEach((item) => {
        batch.update(
          item.ref,
          new FieldPath('notifiedPublishedRounds', roundId),
          deleteField(),
          new FieldPath('notifiedDeadlineReminders', reminderKey),
          deleteField(),
        )
      })

      await batch.commit()
    }
  }

  async function updateRealScore(
    matchId: string,
    side: 'realHomeScore' | 'realAwayScore',
    value: string,
  ) {
    await updateDoc(doc(db, 'competitions', competitionId, 'matches', matchId), {
      [side]: value === '' ? null : Math.max(0, Number(value)),
    })
  }

  async function publishScore(matchId: string) {
    const match = matches.find((item) => item.id === matchId)

    if (
      !match ||
      typeof match.realHomeScore !== 'number' ||
      typeof match.realAwayScore !== 'number'
    ) {
      setMessage('Preencha o placar real antes de publicar.')
      return
    }

    await updateDoc(doc(db, 'competitions', competitionId, 'matches', matchId), {
      status: 'finished',
      scorePublished: true,
      publishedAt: serverTimestamp(),
    })
    setMessage('Resultado publicado. Ranking e tabela já foram recalculados.')
    await recalculateRankingAfterPublish()
  }

  async function addKnockoutTie(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const stage = 'playoffs'
    const hasPlayoffSlots = data.has('playoff-1-homeTeamId') || data.has('playoff-1-awayTeamId')

    if (hasPlayoffSlots) {
      const batch = writeBatch(db)
      const playoffTieIds = getStageTieIds(knockout, 'playoffs', 8)
      const homeLegDeadline = String(data.get('playoff-homeLegDeadline') || '')
      const awayLegDeadline = String(data.get('playoff-awayLegDeadline') || '')
      let savedTies = 0

      if (!homeLegDeadline || !awayLegDeadline) {
        setMessage('Preencha as datas limite de ida e volta dos playoffs.')
        return
      }

      for (let order = 1; order <= 8; order += 1) {
        const homeTeamId = String(data.get(`playoff-${order}-homeTeamId`) || '')
        const awayTeamId = String(data.get(`playoff-${order}-awayTeamId`) || '')
        const existingTie = knockout.find((tie) => tie.id === playoffTieIds[order - 1])

        if (!homeTeamId && !awayTeamId) {
          continue
        }

        if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) {
          setMessage(`Confira o jogo ${order} dos playoffs.`)
          return
        }
        const homeLegScorePublished = existingTie?.homeLegScorePublished ?? existingTie?.scorePublished ?? false
        const awayLegScorePublished = existingTie?.awayLegScorePublished ?? existingTie?.scorePublished ?? false

        batch.set(
          doc(db, 'competitions', competitionId, 'knockout', playoffTieIds[order - 1]),
          {
            stage,
            order,
            homeTeamId,
            awayTeamId,
            homeLegHomeScore: existingTie?.homeLegHomeScore ?? null,
            homeLegAwayScore: existingTie?.homeLegAwayScore ?? null,
            awayLegHomeScore: existingTie?.awayLegHomeScore ?? null,
            awayLegAwayScore: existingTie?.awayLegAwayScore ?? null,
            homeLegDeadline: homeLegDeadline ? Timestamp.fromDate(new Date(homeLegDeadline)) : null,
            awayLegDeadline: awayLegDeadline ? Timestamp.fromDate(new Date(awayLegDeadline)) : null,
            homeLegScorePublished,
            awayLegScorePublished,
            scorePublished: Boolean(homeLegScorePublished && awayLegScorePublished),
            winnerTeamId: null,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )
        savedTies += 1
      }

      await batch.commit()
      setMessage(`Playoffs salvos com ${savedTies} jogo(s).`)
      return
    }

    const homeTeamId = String(data.get('homeTeamId') || '')
    const awayTeamId = String(data.get('awayTeamId') || '')

    if (!stage || !homeTeamId || !awayTeamId || homeTeamId === awayTeamId) {
      setMessage('Preencha fase e dois times diferentes.')
      return
    }

    await setDoc(doc(collection(db, 'competitions', competitionId, 'knockout')), {
      stage,
      homeTeamId,
      awayTeamId,
      order: knockout.filter((tie) => tie.stage === stage).length + 1,
      homeLegHomeScore: null,
      homeLegAwayScore: null,
      awayLegHomeScore: null,
      awayLegAwayScore: null,
      homeLegDeadline: null,
      awayLegDeadline: null,
      homeLegScorePublished: false,
      awayLegScorePublished: false,
      scorePublished: false,
      createdAt: serverTimestamp(),
    })
    form.reset()
    setMessage('Confronto de mata-mata criado.')
  }

  async function saveRoundOf16(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const batch = writeBatch(db)
    const tieIds = getBracketTieIds(knockout)

    for (let order = 1; order <= 8; order += 1) {
      const homeTeamId = String(data.get(`oitavas-${order}-homeTeamId`) || '')
      const awayTeamId = String(data.get(`oitavas-${order}-awayTeamId`) || '')

      if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) {
        setMessage(`Confira o jogo ${order} das oitavas.`)
        return
      }

      batch.set(
        doc(db, 'competitions', competitionId, 'knockout', tieIds.oitavas[order - 1]),
        {
          stage: 'oitavas',
          order,
          homeTeamId: homeTeamId || null,
          awayTeamId: awayTeamId || null,
          nextTieId: tieIds.quartas[Math.floor((order - 1) / 2)],
          nextSlot: order % 2 === 1 ? 'home' : 'away',
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    }

    for (let order = 1; order <= 4; order += 1) {
      batch.set(
        doc(db, 'competitions', competitionId, 'knockout', tieIds.quartas[order - 1]),
        {
          stage: 'quartas',
          order,
          nextTieId: tieIds.semis[Math.floor((order - 1) / 2)],
          nextSlot: order % 2 === 1 ? 'home' : 'away',
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    }

    for (let order = 1; order <= 2; order += 1) {
      batch.set(
        doc(db, 'competitions', competitionId, 'knockout', tieIds.semis[order - 1]),
        {
          stage: 'semis',
          order,
          nextTieId: tieIds.final[0],
          nextSlot: order === 1 ? 'home' : 'away',
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    }

    batch.set(
      doc(db, 'competitions', competitionId, 'knockout', tieIds.final[0]),
      {
        stage: 'final',
        order: 1,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    await batch.commit()
    setMessage('Chaveamento das oitavas salvo.')
  }

  async function updateKnockoutScore(
    tieId: string,
    field:
      | 'homeLegHomeScore'
      | 'homeLegAwayScore'
      | 'awayLegHomeScore'
      | 'awayLegAwayScore',
    value: string,
  ) {
    await updateDoc(doc(db, 'competitions', competitionId, 'knockout', tieId), {
      [field]: value === '' ? null : Math.max(0, Number(value)),
    })
  }

  async function updateKnockoutLegDeadline(stage: string, leg: KnockoutLeg, value: string) {
    const stageTies = knockout.filter((tie) => tie.stage === stage)

    if (stageTies.length === 0) {
      setMessage('Crie os confrontos antes de definir a data limite.')
      return
    }

    const batch = writeBatch(db)
    const field = leg === 'home' ? 'homeLegDeadline' : 'awayLegDeadline'

    stageTies.forEach((tie) => {
      batch.update(doc(db, 'competitions', competitionId, 'knockout', tie.id), {
        [field]: value ? Timestamp.fromDate(new Date(value)) : null,
        updatedAt: serverTimestamp(),
      })
    })

    await batch.commit()
    setMessage('Data limite do mata-mata atualizada.')
  }

  async function publishKnockoutScore(tieId: string, leg?: KnockoutLeg) {
    const tie = knockout.find((item) => item.id === tieId)

    if (leg === 'home') {
      if (
        !tie ||
        typeof tie.homeLegHomeScore !== 'number' ||
        typeof tie.homeLegAwayScore !== 'number'
      ) {
        setMessage('Preencha o placar de ida antes de publicar.')
        return
      }

      await updateDoc(doc(db, 'competitions', competitionId, 'knockout', tieId), {
        homeLegScorePublished: true,
        scorePublished: Boolean(tie.awayLegScorePublished || tie.scorePublished),
        homeLegPublishedAt: serverTimestamp(),
      })
      setMessage('Placar de ida publicado.')
      await recalculateRankingAfterPublish()
      return
    }

    if (leg === 'away') {
      if (
        !tie ||
        typeof tie.awayLegAwayScore !== 'number' ||
        typeof tie.awayLegHomeScore !== 'number'
      ) {
        setMessage('Preencha o placar de volta antes de publicar.')
        return
      }

      await updateDoc(doc(db, 'competitions', competitionId, 'knockout', tieId), {
        awayLegScorePublished: true,
        scorePublished: Boolean(tie.homeLegScorePublished || tie.scorePublished),
        awayLegPublishedAt: serverTimestamp(),
      })
      setMessage('Placar de volta publicado.')
      await recalculateRankingAfterPublish()
      return
    }

    if (
      !tie ||
      typeof tie.homeLegHomeScore !== 'number' ||
      typeof tie.homeLegAwayScore !== 'number' ||
      typeof tie.awayLegHomeScore !== 'number' ||
      typeof tie.awayLegAwayScore !== 'number'
    ) {
      setMessage('Preencha os placares de ida e volta antes de publicar.')
      return
    }

    await updateDoc(doc(db, 'competitions', competitionId, 'knockout', tieId), {
      homeLegScorePublished: true,
      awayLegScorePublished: true,
      scorePublished: true,
      publishedAt: serverTimestamp(),
    })
    setMessage('Placar do mata-mata publicado.')
    await recalculateRankingAfterPublish()
  }

  async function updateWinner(tieId: string, winnerTeamId: string) {
    const tie = knockout.find((item) => item.id === tieId)
    const fallbackPlacement = tie ? getNextTiePlacement(tie, knockout) : null

    await updateDoc(doc(db, 'competitions', competitionId, 'knockout', tieId), {
      winnerTeamId: winnerTeamId || null,
    })

    if (tie?.nextTieId && tie.nextSlot) {
      const nextTie = knockout.find((item) => item.id === tie.nextTieId)
      const nextUpdate: Record<string, string | null> = {
        [tie.nextSlot === 'home' ? 'homeTeamId' : 'awayTeamId']: winnerTeamId || null,
      }

      if (nextTie?.winnerTeamId && nextTie.winnerTeamId === tie.winnerTeamId) {
        nextUpdate.winnerTeamId = null
      }

      await updateDoc(doc(db, 'competitions', competitionId, 'knockout', tie.nextTieId), nextUpdate)
      return
    }

    if (fallbackPlacement) {
      const nextTie = knockout.find((item) => item.id === fallbackPlacement.tieId)
      const nextUpdate: Record<string, string | null> = {
        [fallbackPlacement.slot === 'home' ? 'homeTeamId' : 'awayTeamId']: winnerTeamId || null,
      }

      if (nextTie?.winnerTeamId && nextTie.winnerTeamId === tie?.winnerTeamId) {
        nextUpdate.winnerTeamId = null
      }

      await updateDoc(doc(db, 'competitions', competitionId, 'knockout', fallbackPlacement.tieId), nextUpdate)
    }
  }

  async function updateKnockoutTeamSlot(tieId: string, slot: 'home' | 'away', teamId: string) {
    const tie = knockout.find((item) => item.id === tieId)

    if (!tie) {
      setMessage('Confronto não encontrado.')
      return
    }

    const slotField = slot === 'home' ? 'homeTeamId' : 'awayTeamId'
    const previousTeamId = tie[slotField]
    const shouldClearWinner = Boolean(previousTeamId && tie.winnerTeamId === previousTeamId)
    const currentUpdate: Record<string, string | null> = {
      [slotField]: teamId || null,
    }

    if (shouldClearWinner) {
      currentUpdate.winnerTeamId = null
    }

    await updateDoc(doc(db, 'competitions', competitionId, 'knockout', tieId), currentUpdate)

    if (shouldClearWinner && tie.nextTieId && tie.nextSlot) {
      await updateDoc(doc(db, 'competitions', competitionId, 'knockout', tie.nextTieId), {
        [tie.nextSlot === 'home' ? 'homeTeamId' : 'awayTeamId']: null,
        winnerTeamId: null,
      })
    }

    if (!teamId && previousTeamId) {
      const sourceTie = knockout.find((item) => item.nextTieId === tieId && item.nextSlot === slot)

      if (sourceTie?.winnerTeamId === previousTeamId) {
        await updateDoc(doc(db, 'competitions', competitionId, 'knockout', sourceTie.id), {
          winnerTeamId: null,
        })
      }
    }
  }

  async function deleteKnockoutTie(tieId: string) {
    const batch = writeBatch(db)
    batch.delete(doc(db, 'competitions', competitionId, 'knockout', tieId))

    knockoutPredictions
      .filter((prediction) => prediction.tieId === tieId)
      .forEach((prediction) => {
        batch.delete(
          doc(
            db,
            'competitions',
            competitionId,
            'knockoutPredictions',
            `${prediction.userId}_${tieId}_${prediction.leg}`,
          ),
        )
      })

    await batch.commit()
    setMessage('Confronto excluido.')
  }

  return {
    addKnockoutTie,
    addPlayerStat,
    approveUser,
    deletePlayer,
    deleteKnockoutTie,
    addTeam,
    deleteTeam,
    deletePlayerStat,
    handlePrediction,
    handleKnockoutPrediction,
    publishCompetitionPredictionResult,
    publishScore,
    publishRound,
    deleteRound,
    recalculateRanking,
    publishKnockoutScore,
    saveCompetitionPredictionDeadline,
    saveCompetitionPredictionResult,
    saveRound,
    saveRoundOf16,
    submitCompetitionPrediction,
    updateRealScore,
    updateKnockoutScore,
    updateKnockoutTeamSlot,
    updateKnockoutLegDeadline,
    updatePlayerStat,
    updateTeam,
    updateWinner,
  }
}

function getBracketTieIds(knockout: KnockoutTie[]) {
  return {
    oitavas: getStageTieIds(knockout, 'oitavas', 8),
    quartas: getStageTieIds(knockout, 'quartas', 4),
    semis: getStageTieIds(knockout, 'semis', 2),
    final: getStageTieIds(knockout, 'final', 1),
  }
}

function getStageTieIds(knockout: KnockoutTie[], stage: string, count: number) {
  const ties = getStageTies(knockout, stage)

  return Array.from({ length: count }, (_, index) => ties[index]?.id ?? `knockout-${stage}-${index + 1}`)
}

function getNextTiePlacement(tie: KnockoutTie, knockout: KnockoutTie[]) {
  const nextStageByStage: Record<string, string | undefined> = {
    oitavas: 'quartas',
    quartas: 'semis',
    semis: 'final',
  }
  const nextStage = nextStageByStage[tie.stage]

  if (!nextStage) {
    return null
  }

  const currentStageTies = getStageTies(knockout, tie.stage)
  const nextStageTies = getStageTies(knockout, nextStage)
  const currentIndex = currentStageTies.findIndex((item) => item.id === tie.id)
  const nextTie = nextStageTies[Math.floor(currentIndex / 2)]

  if (currentIndex < 0 || !nextTie) {
    return null
  }

  return {
    slot: currentIndex % 2 === 0 ? 'home' as const : 'away' as const,
    tieId: nextTie.id,
  }
}

function getStageTies(knockout: KnockoutTie[], stage: string) {
  return knockout
    .filter((tie) => tie.stage === stage)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

function getPredictionList(data: FormData, field: string) {
  return Array.from({ length: 5 }, (_, index) => String(data.get(`${field}-${index + 1}`) || '').trim())
}

function hasDuplicateNames(values: string[]) {
  const normalized = values.map((value) => value.trim().toLowerCase()).filter(Boolean)
  return new Set(normalized).size !== normalized.length
}

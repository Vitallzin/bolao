import type {
  CompetitionPrediction,
  CompetitionPredictionResult,
  KnockoutPrediction,
  KnockoutTie,
  Match,
  Prediction,
  Team,
} from '../types'

export type PlayerPointsInput = {
  competitionPredictionResult?: CompetitionPredictionResult
  competitionPredictions: CompetitionPrediction[]
  knockout: KnockoutTie[]
  knockoutPredictions: KnockoutPrediction[]
  matches: Match[]
  predictions: Prediction[]
}

/** Uma perna do mata-mata so pontua depois que o admin publica o placar dela. */
export function isKnockoutLegPublished(tie: KnockoutTie, leg: 'home' | 'away') {
  if (tie.stage === 'final' && leg === 'away') {
    return false
  }

  return leg === 'home'
    ? Boolean(tie.homeLegScorePublished || tie.scorePublished)
    : Boolean(tie.awayLegScorePublished || tie.scorePublished)
}

/**
 * Pontuacao total de um jogador. E a fonte unica de verdade do ranking:
 * roda no servidor (api/recalculate-ranking) e o resultado e gravado no Firestore.
 */
export function calculatePlayerPoints(userId: string, input: PlayerPointsInput) {
  const roundPoints = input.predictions
    .filter((prediction) => prediction.userId === userId)
    .reduce((total, prediction) => {
      const match = input.matches.find((item) => item.id === prediction.matchId)

      if (!match || match.status !== 'finished') {
        return total
      }

      return total + calculatePredictionPoints(prediction, match)
    }, 0)

  const knockoutPoints = input.knockoutPredictions
    .filter((prediction) => prediction.userId === userId)
    .reduce((total, prediction) => {
      const tie = input.knockout.find((item) => item.id === prediction.tieId)

      if (!tie || !isKnockoutLegPublished(tie, prediction.leg)) {
        return total
      }

      return (
        total +
        calculateKnockoutPredictionPoints({
          awayScore: prediction.awayScore,
          homeScore: prediction.homeScore,
          leg: prediction.leg,
          tie,
        })
      )
    }, 0)

  const competitionPoints = calculateCompetitionPredictionPoints(
    input.competitionPredictions.find((prediction) => prediction.userId === userId) ?? {
      id: '',
      userId,
      topScorers: [],
      topAssists: [],
      bestPlayer: '',
      bestGoalkeeper: '',
      championTeamId: '',
      runnerUpTeamId: '',
    },
    input.competitionPredictionResult,
  )

  return roundPoints + knockoutPoints + competitionPoints
}

export function calculatePredictionPoints(prediction: Prediction, match: Match) {
  return calculateScorePoints({
    actualAwayScore: match.realAwayScore,
    actualHomeScore: match.realHomeScore,
    predictedAwayScore: prediction.awayScore,
    predictedHomeScore: prediction.homeScore,
    stage: 'early',
  })
}

export function calculateKnockoutPredictionPoints({
  awayScore,
  homeScore,
  leg,
  tie,
}: {
  awayScore: number
  homeScore: number
  leg: 'home' | 'away'
  tie: KnockoutTie
}) {
  const actualHomeScore = leg === 'home' ? tie.homeLegHomeScore : tie.awayLegHomeScore
  const actualAwayScore = leg === 'home' ? tie.homeLegAwayScore : tie.awayLegAwayScore

  return calculateScorePoints({
    actualAwayScore,
    actualHomeScore,
    predictedAwayScore: awayScore,
    predictedHomeScore: homeScore,
    stage: tie.stage,
  })
}

export function calculateScorePoints({
  actualAwayScore,
  actualHomeScore,
  predictedAwayScore,
  predictedHomeScore,
  stage,
}: {
  actualAwayScore?: number | null
  actualHomeScore?: number | null
  predictedAwayScore: number
  predictedHomeScore: number
  stage: string
}) {
  if (typeof actualHomeScore !== 'number' || typeof actualAwayScore !== 'number') {
    return 0
  }

  const table = getPredictionPointTable(stage)
  const goalError = Math.abs(predictedHomeScore - actualHomeScore) + Math.abs(predictedAwayScore - actualAwayScore)
  const predictedResult = Math.sign(predictedHomeScore - predictedAwayScore)
  const realResult = Math.sign(actualHomeScore - actualAwayScore)
  const resultBonus = predictedResult === realResult ? table.resultBonus : 0

  if (goalError === 0) {
    return table.exact
  }

  if (goalError === 1) {
    return table.offByOne + resultBonus
  }

  if (goalError === 2) {
    return table.offByTwo + resultBonus
  }

  return resultBonus
}

export function calculateCompetitionPredictionPoints(
  prediction: CompetitionPrediction,
  result?: CompetitionPredictionResult,
) {
  if (!result?.published) {
    return 0
  }

  return (
    calculateTopFivePoints(prediction.topScorers, result.topScorers) +
    calculateTopFivePoints(prediction.topAssists, result.topAssists) +
    calculateExactNamePoints(
      prediction.bestPlayer,
      result.bestPlayer,
      competitionPredictionPoints.bestPlayer,
    ) +
    calculateExactNamePoints(
      prediction.bestGoalkeeper,
      result.bestGoalkeeper,
      competitionPredictionPoints.bestGoalkeeper,
    ) +
    calculateFinalistsPoints(prediction, result)
  )
}

function calculateTopFivePoints(predicted: string[], actual: string[]) {
  const normalizedActual = actual.map(normalizeName)

  return predicted.reduce((total, player, index) => {
    const normalizedPlayer = normalizeName(player)

    if (!normalizedPlayer) {
      return total
    }

    if (normalizedActual[index] === normalizedPlayer) {
      return total + competitionPredictionPoints.topFiveExactPosition
    }

    return normalizedActual.includes(normalizedPlayer)
      ? total + competitionPredictionPoints.topFiveWrongPosition
      : total
  }, 0)
}

function calculateExactNamePoints(predicted: string, actual: string, points: number) {
  return normalizeName(predicted) && normalizeName(predicted) === normalizeName(actual) ? points : 0
}

function calculateFinalistsPoints(prediction: CompetitionPrediction, result: CompetitionPredictionResult) {
  let points = 0

  if (prediction.championTeamId && prediction.championTeamId === result.championTeamId) {
    points += competitionPredictionPoints.champion
  } else if (prediction.championTeamId && prediction.championTeamId === result.runnerUpTeamId) {
    points += competitionPredictionPoints.swappedFinalist
  }

  if (prediction.runnerUpTeamId && prediction.runnerUpTeamId === result.runnerUpTeamId) {
    points += competitionPredictionPoints.runnerUp
  } else if (prediction.runnerUpTeamId && prediction.runnerUpTeamId === result.championTeamId) {
    points += competitionPredictionPoints.swappedFinalist
  }

  return points
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export type PointTable = {
  exact: number
  offByOne: number
  offByTwo: number
  resultBonus: number
}

/** Tabelas de pontos por fase. Usadas no calculo e exibidas na aba Regras. */
export const stagePointTables = {
  early: { exact: 100, offByOne: 50, offByTwo: 25, resultBonus: 15 },
  quartas: { exact: 150, offByOne: 75, offByTwo: 40, resultBonus: 25 },
  semis: { exact: 200, offByOne: 100, offByTwo: 50, resultBonus: 35 },
  final: { exact: 300, offByOne: 150, offByTwo: 75, resultBonus: 50 },
} satisfies Record<string, PointTable>

/** Pontos das previsoes da competicao. Usados no calculo e exibidos na aba Regras. */
export const competitionPredictionPoints = {
  topFiveExactPosition: 100,
  topFiveWrongPosition: 50,
  bestPlayer: 150,
  bestGoalkeeper: 100,
  champion: 300,
  runnerUp: 150,
  swappedFinalist: 100,
}

function getPredictionPointTable(stage: string): PointTable {
  if (stage === 'quartas') {
    return stagePointTables.quartas
  }

  if (stage === 'semis') {
    return stagePointTables.semis
  }

  if (stage === 'final') {
    return stagePointTables.final
  }

  return stagePointTables.early
}

export function buildStandings(teams: Team[], matches: Match[]) {
  const table = new Map(
    teams.map((team) => [
      team.id,
      {
        team,
        points: 0,
        played: 0,
        wins: 0,
        awayWins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        awayGoalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        opponentsPoints: 0,
        opponentsGoalDifference: 0,
        opponentsGoalsFor: 0,
      },
    ]),
  )
  const opponentsByTeam = new Map<string, Set<string>>(teams.map((team) => [team.id, new Set<string>()]))

  matches
    .filter((match) => match.status === 'finished')
    .forEach((match) => {
      const home = table.get(match.homeTeamId)
      const away = table.get(match.awayTeamId)

      if (!home || !away || match.realHomeScore === null || match.realAwayScore === null) {
        return
      }

      home.played += 1
      away.played += 1
      home.goalsFor += match.realHomeScore
      home.goalsAgainst += match.realAwayScore
      away.goalsFor += match.realAwayScore
      away.awayGoalsFor += match.realAwayScore
      away.goalsAgainst += match.realHomeScore
      opponentsByTeam.get(match.homeTeamId)?.add(match.awayTeamId)
      opponentsByTeam.get(match.awayTeamId)?.add(match.homeTeamId)

      if (match.realHomeScore > match.realAwayScore) {
        home.points += 3
        home.wins += 1
        away.losses += 1
      } else if (match.realHomeScore < match.realAwayScore) {
        away.points += 3
        away.wins += 1
        away.awayWins += 1
        home.losses += 1
      } else {
        home.points += 1
        away.points += 1
        home.draws += 1
        away.draws += 1
      }

      home.goalDifference = home.goalsFor - home.goalsAgainst
      away.goalDifference = away.goalsFor - away.goalsAgainst
    })

  table.forEach((row, teamId) => {
    const opponents = [...(opponentsByTeam.get(teamId) ?? [])].map((opponentId) => table.get(opponentId))

    row.opponentsPoints = opponents.reduce((total, opponent) => total + (opponent?.points ?? 0), 0)
    row.opponentsGoalDifference = opponents.reduce(
      (total, opponent) => total + (opponent?.goalDifference ?? 0),
      0,
    )
    row.opponentsGoalsFor = opponents.reduce((total, opponent) => total + (opponent?.goalsFor ?? 0), 0)
  })

  return [...table.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      b.awayGoalsFor - a.awayGoalsFor ||
      b.wins - a.wins ||
      b.awayWins - a.awayWins ||
      b.opponentsPoints - a.opponentsPoints ||
      b.opponentsGoalDifference - a.opponentsGoalDifference ||
      b.opponentsGoalsFor - a.opponentsGoalsFor ||
      a.team.name.localeCompare(b.team.name),
  )
}

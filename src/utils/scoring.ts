import type {
  CompetitionPrediction,
  CompetitionPredictionResult,
  KnockoutTie,
  Match,
  Prediction,
  Team,
} from '../types'

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
    calculateExactNamePoints(prediction.bestPlayer, result.bestPlayer, 150) +
    calculateExactNamePoints(prediction.bestGoalkeeper, result.bestGoalkeeper, 100) +
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
      return total + 100
    }

    return normalizedActual.includes(normalizedPlayer) ? total + 50 : total
  }, 0)
}

function calculateExactNamePoints(predicted: string, actual: string, points: number) {
  return normalizeName(predicted) && normalizeName(predicted) === normalizeName(actual) ? points : 0
}

function calculateFinalistsPoints(prediction: CompetitionPrediction, result: CompetitionPredictionResult) {
  let points = 0

  if (prediction.championTeamId && prediction.championTeamId === result.championTeamId) {
    points += 300
  } else if (prediction.championTeamId && prediction.championTeamId === result.runnerUpTeamId) {
    points += 100
  }

  if (prediction.runnerUpTeamId && prediction.runnerUpTeamId === result.runnerUpTeamId) {
    points += 150
  } else if (prediction.runnerUpTeamId && prediction.runnerUpTeamId === result.championTeamId) {
    points += 100
  }

  return points
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function getPredictionPointTable(stage: string) {
  if (stage === 'quartas') {
    return { exact: 150, offByOne: 75, offByTwo: 40, resultBonus: 25 }
  }

  if (stage === 'semis') {
    return { exact: 200, offByOne: 100, offByTwo: 50, resultBonus: 35 }
  }

  if (stage === 'final') {
    return { exact: 300, offByOne: 150, offByTwo: 75, resultBonus: 50 }
  }

  return { exact: 100, offByOne: 50, offByTwo: 25, resultBonus: 15 }
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

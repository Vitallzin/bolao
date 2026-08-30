/**
 * A pontuacao existe em dois lugares: src/utils/scoring.ts (app) e uma copia
 * dentro de api/recalculate-ranking.ts (a funcao serverless nao pode importar
 * de fora da pasta api/, senao nao sobe na Vercel).
 *
 * Este script confere que as duas implementacoes dao exatamente o mesmo
 * resultado. Rode depois de mexer na pontuacao:
 *
 *   npx vite-node scripts/checks/paridade-pontuacao.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import * as app from '../../src/utils/scoring.ts'

const apiFile = path.resolve('api/recalculate-ranking.ts')
const src = fs.readFileSync(apiFile, 'utf8')
const inicio = src.indexOf('type PointTable')
const fim = src.indexOf('export default async function handler')

if (inicio < 0 || fim < 0) {
  console.error('Nao encontrei o bloco de pontuacao em api/recalculate-ranking.ts')
  process.exit(1)
}

const temporario = path.resolve('_paridade-temp.ts')
fs.writeFileSync(
  temporario,
  src.slice(inicio, src.lastIndexOf('// ---', fim)) +
    '\nexport { calculateScorePoints, calculatePlayerPoints, calculatePointsByRound,' +
    ' getLastScoredRoundId, isKnockoutLegPublished, calculateCompetitionPredictionPoints }\n',
)

let divergencias = 0

try {
  const api = await import(temporario)
  const conferir = (rotulo, esperado, obtido) => {
    if (JSON.stringify(esperado) !== JSON.stringify(obtido)) {
      divergencias += 1
      console.error(`DIVERGE  ${rotulo}: app=${JSON.stringify(esperado)} api=${JSON.stringify(obtido)}`)
    }
  }

  const placares = [[[2, 1], [2, 1]], [[2, 1], [2, 0]], [[3, 1], [2, 0]], [[5, 0], [1, 0]], [[0, 5], [1, 0]], [[1, 1], [1, 1]]]

  for (const stage of ['early', 'quartas', 'semis', 'final']) {
    for (const [palpite, real] of placares) {
      const args = {
        actualHomeScore: real[0],
        actualAwayScore: real[1],
        predictedHomeScore: palpite[0],
        predictedAwayScore: palpite[1],
        stage,
      }
      conferir(`${stage} ${palpite.join('x')} vs ${real.join('x')}`, app.calculateScorePoints(args), api.calculateScorePoints(args))
    }
  }

  const input = {
    matches: [{ id: 'm1', roundId: 'r1', roundNumber: 1, status: 'finished', realHomeScore: 2, realAwayScore: 0 }],
    predictions: [{ userId: 'u1', matchId: 'm1', homeScore: 2, awayScore: 1 }],
    knockout: [{ id: 'k1', stage: 'final', homeLegHomeScore: 1, homeLegAwayScore: 0, homeLegScorePublished: true }],
    knockoutPredictions: [{ userId: 'u1', tieId: 'k1', leg: 'home', homeScore: 1, awayScore: 0 }],
    competitionPredictions: [{ userId: 'u1', topScorers: ['Mbappé', 'X', 'Y', 'Z', 'W'], topAssists: [], bestPlayer: 'Vinicius Junior', bestGoalkeeper: '', championTeamId: 't1', runnerUpTeamId: 't2' }],
    competitionPredictionResult: { published: true, topScorers: ['mbappe', 'A', 'B', 'C', 'D'], topAssists: [], bestPlayer: 'VINÍCIUS JÚNIOR', bestGoalkeeper: '', championTeamId: 't1', runnerUpTeamId: 't2' },
  }

  conferir('total do jogador', app.calculatePlayerPoints('u1', input), api.calculatePlayerPoints('u1', input))
  conferir('pontos por rodada', app.calculatePointsByRound('u1', input), api.calculatePointsByRound('u1', input))
  conferir('ultima rodada pontuada', app.getLastScoredRoundId(input.matches), api.getLastScoredRoundId(input.matches))
  conferir('previsoes da competicao', app.calculateCompetitionPredictionPoints(input.competitionPredictions[0], input.competitionPredictionResult), api.calculateCompetitionPredictionPoints(input.competitionPredictions[0], input.competitionPredictionResult))
} finally {
  fs.rmSync(temporario, { force: true })
}

if (divergencias > 0) {
  console.error(`\n${divergencias} divergencia(s): a pontuacao do app e a do servidor nao batem.`)
  process.exit(1)
}

console.log('Pontuacao do app e do servidor batem.')

import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../EmptyState'
import { TeamBadge } from '../TeamBadge'
import { KnockoutPredictionCard } from '../../pages/DashboardPage/KnockoutPage/components/KnockoutPredictionCard'
import type {
  KnockoutPrediction,
  KnockoutTie,
  Match,
  Player,
  Prediction,
  RankingEntry,
  Round,
  Team,
} from '../../types'
import { formatDateTime } from '../../utils/date'
import { calculatePredictionPoints, stagePointTables } from '../../utils/scoring'
import './PredictionsView.css'

type PredictionsViewProps = {
  currentUser: Player
  knockout: KnockoutTie[]
  knockoutPredictions: KnockoutPrediction[]
  matches: Match[]
  onKnockoutPredictionChange: (
    tieId: string,
    leg: 'home' | 'away',
    side: 'homeScore' | 'awayScore',
    value: string,
  ) => void
  onPredictionChange: (matchId: string, side: 'homeScore' | 'awayScore', value: string) => void
  predictions: Prediction[]
  ranking: RankingEntry[]
  rounds: Round[]
  teamMap: Map<string, Team>
}

export function PredictionsView({
  currentUser,
  knockout,
  knockoutPredictions,
  matches,
  onKnockoutPredictionChange,
  onPredictionChange,
  predictions,
  ranking,
  rounds,
  teamMap,
}: PredictionsViewProps) {
  const steps = useMemo(() => buildPredictionSteps(rounds, knockout), [knockout, rounds])
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const activeStep = steps[activeStepIndex]

  useEffect(() => {
    setActiveStepIndex((current) => Math.min(current, Math.max(0, steps.length - 1)))
  }, [steps.length])

  if (steps.length === 0) {
    return (
      <EmptyState
        title="Nenhuma rodada publicada"
        text="Quando o admin publicar rodadas ou cadastrar o mata-mata, os palpites aparecem aqui."
      />
    )
  }

  return (
    <section className="content-grid">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Palpites</span>
          <h2>Seus palpites</h2>
        </div>
        <div className="round-nav predictions-step-nav">
          <button type="button" onClick={() => setActiveStepIndex((current) => Math.max(0, current - 1))} disabled={activeStepIndex === 0}>
            &lt;
          </button>
          <h2>{activeStep.label}</h2>
          <button
            type="button"
            onClick={() => setActiveStepIndex((current) => Math.min(steps.length - 1, current + 1))}
            disabled={activeStepIndex === steps.length - 1}
          >
            &gt;
          </button>
        </div>
      </div>

      {activeStep.kind === 'round-placeholder' ? (
        <EmptyState
          title="Jogos em breve"
          text="Os jogos dessa rodada serão postados em breve."
        />
      ) : activeStep.kind === 'round' ? (
        <RoundPredictions
          currentUser={currentUser}
          matches={matches.filter((match) => match.roundId === activeStep.round.id)}
          predictions={predictions}
          ranking={ranking}
          round={activeStep.round}
          teamMap={teamMap}
          onPredictionChange={onPredictionChange}
        />
      ) : (
        <KnockoutPredictions
          currentUser={currentUser}
          knockoutPredictions={knockoutPredictions}
          label={activeStep.label}
          stage={activeStep.stage}
          ties={activeStep.ties}
          teamMap={teamMap}
          onKnockoutPredictionChange={onKnockoutPredictionChange}
        />
      )}
    </section>
  )
}

function RoundPredictions({
  currentUser,
  matches,
  onPredictionChange,
  predictions,
  ranking,
  round,
  teamMap,
}: {
  currentUser: Player
  matches: Match[]
  onPredictionChange: (matchId: string, side: 'homeScore' | 'awayScore', value: string) => void
  predictions: Prediction[]
  ranking: RankingEntry[]
  round: Round
  teamMap: Map<string, Team>
}) {
  const locked = new Date() >= round.deadline
  const matchesByDay = [1, 2].map((day) => ({
    day,
    matches: matches.filter((match) => match.day === day),
  }))
  const myPredictions = predictions.filter((item) => item.userId === currentUser.id)
  const hasResults = matches.some((match) => match.status === 'finished')
  // O total sai dos proprios palpites, entao aparece mesmo se o ranking do servidor estiver atrasado.
  const myRoundPoints = matches.reduce((total, match) => {
    const prediction = myPredictions.find((item) => item.matchId === match.id)

    if (!prediction || match.status !== 'finished') {
      return total
    }

    return total + calculatePredictionPoints(prediction, match)
  }, 0)
  // A colocacao depende de comparar com os outros, entao so aparece com o ranking disponivel.
  const roundStanding = getRoundStanding(ranking, currentUser.id, round.id)

  if (matches.length === 0) {
    return (
      <EmptyState
        title="Sem jogos nessa rodada"
        text="Assim que o admin definir e publicar os confrontos, você consegue palpitar."
      />
    )
  }

  return (
    <>
      <div className="round-status-line">
        <span className={locked ? 'status-pill status-pill--locked' : 'status-pill'}>
          {locked ? 'Fechada' : `Aberta até ${formatDateTime(round.deadline)}`}
        </span>

        {hasResults ? (
          <div className="round-score-summary">
            <div className="round-score-summary__points">
              <strong>{myRoundPoints}</strong>
              <span>pts nessa rodada</span>
            </div>
            {roundStanding ? (
              <div className="round-score-summary__position">
                <strong>{roundStanding.position}º</strong>
                <span>de {roundStanding.total} na rodada</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {/* Com resultado as linhas ganham rotulo e etiqueta de pontos; a classe abaixo
          iguala a altura de todas para o Dia 1 e o Dia 2 ficarem alinhados. */}
      <div className={hasResults ? 'match-days match-days--scored' : 'match-days'}>
        {matchesByDay.map(({ day, matches: dayMatches }) => (
          <section className="match-day" key={day}>
            <h3>Dia {day}</h3>
            <div className="match-list">
              {dayMatches.map((match) => {
                const prediction = predictions.find(
                  (item) => item.userId === currentUser.id && item.matchId === match.id,
                )
                const finished =
                  match.status === 'finished' &&
                  typeof match.realHomeScore === 'number' &&
                  typeof match.realAwayScore === 'number'
                const matchPoints = finished && prediction
                  ? calculatePredictionPoints(prediction, match)
                  : null

                // Cravou o placar? Mostrar o placar real seria repetir o mesmo numero.
                const showRealScore = finished && matchPoints !== stagePointTables.early.exact

                return (
                  <article className="match-row" key={match.id}>
                    <TeamBadge team={teamMap.get(match.homeTeamId)} />

                    <div className="match-scores">
                      <div className="score-group">
                        {showRealScore ? <span className="score-group__label">Meu palpite</span> : null}
                        <div className="score-group__values">
                          <input
                            aria-label={`Palpite ${teamMap.get(match.homeTeamId)?.name}`}
                            disabled={locked}
                            min="0"
                            placeholder="0"
                            type="number"
                            value={prediction?.homeScore ?? ''}
                            onChange={(event) => onPredictionChange(match.id, 'homeScore', event.target.value)}
                          />
                          <span className="versus">x</span>
                          <input
                            aria-label={`Palpite ${teamMap.get(match.awayTeamId)?.name}`}
                            disabled={locked}
                            min="0"
                            placeholder="0"
                            type="number"
                            value={prediction?.awayScore ?? ''}
                            onChange={(event) => onPredictionChange(match.id, 'awayScore', event.target.value)}
                          />
                        </div>
                      </div>

                      {showRealScore ? (
                        <div className="score-group score-group--real">
                          <span className="score-group__label">Placar real</span>
                          <div className="score-group__values">
                            <span className="score-box">{match.realHomeScore}</span>
                            <span className="versus">x</span>
                            <span className="score-box">{match.realAwayScore}</span>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <TeamBadge team={teamMap.get(match.awayTeamId)} align="right" />

                    {matchPoints !== null ? <MatchPoints points={matchPoints} /> : null}
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {hasResults ? <PointsLegend /> : null}
    </>
  )
}

/** Cravou (placar exato), parcial (acertou parte) ou errou. */
function getMatchOutcome(points: number) {
  if (points >= stagePointTables.early.exact) {
    return 'exact' as const
  }

  return points > 0 ? ('partial' as const) : ('miss' as const)
}

function MatchPoints({ points }: { points: number }) {
  const outcome = getMatchOutcome(points)
  const labels = { exact: 'Cravou!', miss: 'Errou', partial: 'Parcial' }
  const icons = { exact: '✓', miss: '✕', partial: '★' }

  return (
    <div className={`match-points match-points--${outcome}`}>
      <span className="match-points__icon" aria-hidden="true">
        {icons[outcome]}
      </span>
      <span className="match-points__value">
        <strong>{points > 0 ? `+${points}` : '0'} pts</strong>
        <small>{labels[outcome]}</small>
      </span>
    </div>
  )
}

function PointsLegend() {
  const { exact, offByTwo, offByOne, resultBonus } = stagePointTables.early

  return (
    <div className="points-legend">
      <div className="points-legend__item points-legend__item--exact">
        <span className="match-points__icon" aria-hidden="true">✓</span>
        <div>
          <strong>Cravou!</strong>
          <small>Placar exato. {exact} pontos.</small>
        </div>
      </div>
      <div className="points-legend__item points-legend__item--partial">
        <span className="match-points__icon" aria-hidden="true">★</span>
        <div>
          <strong>Parcial</strong>
          <small>
            Acertou o vencedor ou chegou perto do placar. De {resultBonus} a {offByOne + resultBonus}{' '}
            pontos.
          </small>
        </div>
      </div>
      <div className="points-legend__item points-legend__item--miss">
        <span className="match-points__icon" aria-hidden="true">✕</span>
        <div>
          <strong>Errou</strong>
          <small>Não acertou nada do palpite. 0 pontos.</small>
        </div>
      </div>
      <div className="points-legend__item points-legend__item--info">
        <span className="match-points__icon" aria-hidden="true">🏆</span>
        <div>
          <strong>Pontuação</strong>
          <small>Erro de 2 gols ainda vale {offByTwo}. Quanto mais avancada a fase, mais pontos.</small>
        </div>
      </div>
    </div>
  )
}

function KnockoutPredictions({
  currentUser,
  knockoutPredictions,
  label,
  onKnockoutPredictionChange,
  stage,
  teamMap,
  ties,
}: {
  currentUser: Player
  knockoutPredictions: KnockoutPrediction[]
  label: string
  onKnockoutPredictionChange: (
    tieId: string,
    leg: 'home' | 'away',
    side: 'homeScore' | 'awayScore',
    value: string,
  ) => void
  stage: string
  teamMap: Map<string, Team>
  ties: KnockoutTie[]
}) {
  const isFinal = stage === 'final'
  const [activeLeg, setActiveLeg] = useState<'home' | 'away'>('home')

  useEffect(() => {
    setActiveLeg('home')
  }, [stage])

  if (ties.length === 0) {
    return (
      <EmptyState
        title={`Sem jogos em ${label}`}
        text="Assim que o admin cadastrar os confrontos, você consegue palpitar."
      />
    )
  }

  const leg = isFinal ? 'home' : activeLeg
  const deadline = leg === 'home' ? ties[0].homeLegDeadline : ties[0].awayLegDeadline
  const locked = !deadline || new Date() >= deadline

  return (
    <>
      {isFinal ? null : (
        <div className="leg-toggle" role="tablist" aria-label="Ida ou volta">
          <button
            className={activeLeg === 'home' ? 'active' : ''}
            type="button"
            role="tab"
            aria-selected={activeLeg === 'home'}
            onClick={() => setActiveLeg('home')}
          >
            Ida
          </button>
          <button
            className={activeLeg === 'away' ? 'active' : ''}
            type="button"
            role="tab"
            aria-selected={activeLeg === 'away'}
            onClick={() => setActiveLeg('away')}
          >
            Volta
          </button>
        </div>
      )}

      <span className={locked ? 'status-pill status-pill--locked' : 'status-pill'}>
        {locked || !deadline ? 'Fechada' : `Aberta até ${formatDateTime(deadline)}`}
      </span>

      <div className="prediction-knockout-grid">
        {ties.map((tie) => (
          <KnockoutPredictionCard
            currentUser={currentUser}
            key={`${tie.id}-${leg}`}
            knockoutPredictions={knockoutPredictions}
            leg={leg}
            teamMap={teamMap}
            tie={tie}
            onKnockoutPredictionChange={onKnockoutPredictionChange}
          />
        ))}
      </div>
    </>
  )
}

function buildPredictionSteps(rounds: Round[], knockout: KnockoutTie[]) {
  const roundSteps = Array.from({ length: 8 }, (_, index) => {
    const number = index + 1
    const round = rounds.find((item) => item.number === number || item.id === `round-${number}`)

    return round
      ? {
        kind: 'round' as const,
        label: round.name,
        round,
      }
      : {
        kind: 'round-placeholder' as const,
        label: `Rodada ${number}`,
      }
  })
  const playoffTies = getStageTies(knockout, 'playoffs')
  const normalStages = [
    { id: 'oitavas', label: 'Oitavas' },
    { id: 'quartas', label: 'Quartas' },
    { id: 'semis', label: 'Semifinais' },
    { id: 'final', label: 'Final' },
  ]

  return [
    ...roundSteps,
    { kind: 'knockout' as const, label: 'Playoffs', stage: 'playoffs', ties: playoffTies },
    ...normalStages
      .map((stage) => ({
        kind: 'knockout' as const,
        label: stage.label,
        stage: stage.id,
        ties: getStageTies(knockout, stage.id),
      }))
      .filter((step) => step.ties.length > 0),
  ]
}

/**
 * Colocacao do jogador na rodada, comparando com os outros. Depende do ranking
 * gravado pelo servidor; sem ele, a posicao simplesmente nao e exibida.
 */
function getRoundStanding(ranking: RankingEntry[], userId: string, roundId: string) {
  const me = ranking.find((entry) => entry.userId === userId)

  if (!me) {
    return null
  }

  const points = me.roundPoints?.[roundId] ?? 0
  const scores = ranking.map((entry) => entry.roundPoints?.[roundId] ?? 0)
  // Empate divide a mesma colocacao: a posicao e quantos fizeram mais, +1.
  const position = scores.filter((score) => score > points).length + 1

  return { position, total: ranking.length }
}

function getStageTies(knockout: KnockoutTie[], stage: string) {
  return knockout
    .filter((tie) => tie.stage === stage)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

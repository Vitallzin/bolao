import { EmptyState } from '../EmptyState'
import type { RankingEntry } from '../../types'
import './RankingView.css'

type RankingViewProps = {
  lastScoredRoundId?: string | null
  ranking: RankingEntry[]
}

export function RankingView({ lastScoredRoundId, ranking }: RankingViewProps) {
  if (ranking.length === 0) {
    return (
      <EmptyState
        title="Sem jogadores ainda"
        text="Os amigos aparecem no ranking depois do primeiro login."
      />
    )
  }

  return (
    <section className="content-grid">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Amigos</span>
          <h2>Classificacao do bolao</h2>
        </div>
      </div>

      <div className="ranking-list">
        {ranking.map((player, index) => {
          const place = player.position ?? index + 1
          const positionClass = getPositionClassName(place)
          const movement = getMovement(place, player.previousPosition)
          const roundPoints = lastScoredRoundId ? player.roundPoints?.[lastScoredRoundId] ?? 0 : null

          return (
            <article className="ranking-row" key={player.userId}>
              <span className={positionClass}>{place}</span>

              <div className="ranking-row__player">
                <strong>{player.name}</strong>
                {roundPoints !== null ? (
                  <span className="ranking-row__round">+{roundPoints} na ultima rodada</span>
                ) : null}
              </div>

              {movement ? (
                <span
                  className={`ranking-move ranking-move--${movement.direction}`}
                  title={
                    movement.direction === 'up'
                      ? `Subiu ${movement.places} posicao(oes)`
                      : `Caiu ${movement.places} posicao(oes)`
                  }
                >
                  {movement.direction === 'up' ? '▲' : '▼'} {movement.places}
                </span>
              ) : (
                <span className="ranking-move ranking-move--same" title="Manteve a posicao">
                  –
                </span>
              )}

              <strong className="ranking-row__points">{player.points} pts</strong>
            </article>
          )
        })}
      </div>
    </section>
  )
}

/** Compara a posicao atual com a de antes da ultima rodada pontuada. */
function getMovement(place: number, previousPosition: number | null) {
  if (previousPosition === null || previousPosition === place) {
    return null
  }

  return previousPosition > place
    ? { direction: 'up' as const, places: previousPosition - place }
    : { direction: 'down' as const, places: place - previousPosition }
}

function getPositionClassName(place: number) {
  if (place === 1) {
    return 'position position--gold'
  }

  if (place === 2) {
    return 'position position--silver'
  }

  if (place === 3) {
    return 'position position--bronze'
  }

  return 'position'
}

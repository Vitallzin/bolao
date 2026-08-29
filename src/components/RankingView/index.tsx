import { EmptyState } from '../EmptyState'
import type { RankingEntry } from '../../types'
import './RankingView.css'

type RankingViewProps = {
  ranking: RankingEntry[]
}

export function RankingView({ ranking }: RankingViewProps) {
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
          const place = index + 1
          const positionClass = getPositionClassName(place)

          return (
            <article className="ranking-row" key={player.userId}>
              <span className={positionClass}>{place}</span>
              <div>
                <strong>{player.name}</strong>
              </div>
              <strong>{player.points} pts</strong>
            </article>
          )
        })}
      </div>
    </section>
  )
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

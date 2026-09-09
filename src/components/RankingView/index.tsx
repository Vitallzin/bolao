import { EmptyState } from '../EmptyState'
import type { Player, RankingEntry } from '../../types'
import './RankingView.css'

type RankingViewProps = {
  lastScoredRoundId?: string | null
  players: Player[]
  ranking: RankingEntry[]
}

export function RankingView({ lastScoredRoundId, players, ranking }: RankingViewProps) {
  // Enquanto o servidor nao gravar o ranking, mostramos os jogadores zerados —
  // a lista nunca fica vazia so porque o calculo ainda nao rodou.
  const pending = ranking.length === 0
  // O nome vem do perfil atual, nao do que foi congelado no ranking: quem troca
  // o apelido aparece com o nome novo sem esperar o proximo recalculo.
  const profiles = new Map(players.map((player) => [player.id, player]))
  const entries: RankingEntry[] = (pending ? buildPendingRanking(players) : ranking).map((entry) => {
    const profile = profiles.get(entry.userId)

    return profile
      ? { ...entry, name: profile.name, photoURL: profile.photoURL ?? entry.photoURL }
      : entry
  })

  // As colocacoes saem dos pontos aqui na tela, e nao do que o servidor gravou:
  // o empate ja aparece certo antes mesmo do proximo recalculo.
  const places = densePlaces(entries.map((entry) => entry.points))
  const previousPlaces = buildPreviousPlaces(entries, lastScoredRoundId)

  if (entries.length === 0) {
    return (
      <EmptyState
        title="Sem jogadores ainda"
        text="Os amigos aparecem no ranking depois de serem liberados como jogador."
      />
    )
  }

  return (
    <section className="content-grid">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Amigos</span>
          <h2>Classificação do bolão</h2>
        </div>
      </div>

      {pending ? (
        <p className="ranking-pending">
          A pontuação ainda não foi calculada pelo servidor. Assim que o admin publicar um placar, o
          ranking aparece atualizado aqui.
        </p>
      ) : null}

      <div className="ranking-list">
        {entries.map((player, index) => {
          const place = places[index]
          const positionClass = getPositionClassName(place)
          const movement = getMovement(place, previousPlaces.get(player.userId) ?? null)
          const roundPoints = lastScoredRoundId ? player.roundPoints?.[lastScoredRoundId] ?? 0 : null

          return (
            <article className="ranking-row" key={player.userId}>
              <span className={positionClass}>{place}</span>

              <div className="ranking-row__player">
                <strong>{player.name}</strong>
                {roundPoints !== null ? (
                  <span className="ranking-row__round">+{roundPoints} na última rodada</span>
                ) : null}
              </div>

              {movement ? (
                <span
                  className={`ranking-move ranking-move--${movement.direction}`}
                  title={
                    movement.direction === 'up'
                      ? `Subiu ${movement.places} posição(oes)`
                      : `Caiu ${movement.places} posição(oes)`
                  }
                >
                  {movement.direction === 'up' ? '▲' : '▼'} {movement.places}
                </span>
              ) : (
                <span className="ranking-move ranking-move--same" title="Manteve a posição">
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

/** Jogadores liberados, todos zerados, para o ranking nunca ficar vazio. */
function buildPendingRanking(players: Player[]): RankingEntry[] {
  return players
    .filter((player) => player.approved)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((player, index) => ({
      userId: player.id,
      name: player.name,
      photoURL: player.photoURL ?? null,
      points: 0,
      roundPoints: {},
      position: index + 1,
      previousPosition: null,
    }))
}

/**
 * Empate divide a mesma colocacao e a numeracao nao pula: 1o, 2o, 2o, 3o.
 * Espera a lista ja ordenada da maior pontuacao para a menor.
 */
function densePlaces(points: number[]) {
  let place = 0
  let previous: number | null = null

  return points.map((value) => {
    if (value !== previous) {
      place += 1
      previous = value
    }

    return place
  })
}

/**
 * Colocacao de cada jogador antes da ultima rodada pontuada, para as setas de
 * subiu/caiu. Tambem sai dos pontos: descontando a ultima rodada de cada um e
 * reordenando, a comparacao usa a mesma regra de empate da coluna da esquerda.
 */
function buildPreviousPlaces(entries: RankingEntry[], lastScoredRoundId?: string | null) {
  if (!lastScoredRoundId) {
    return new Map<string, number>()
  }

  const before = entries
    .map((entry) => ({
      points: entry.points - (entry.roundPoints?.[lastScoredRoundId] ?? 0),
      userId: entry.userId,
    }))
    .sort((a, b) => b.points - a.points)
  const places = densePlaces(before.map((entry) => entry.points))

  return new Map(before.map((entry, index) => [entry.userId, places[index]] as const))
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

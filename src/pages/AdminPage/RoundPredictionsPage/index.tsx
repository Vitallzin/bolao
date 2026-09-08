import { useMemo, useState } from 'react'
import type { Match, Player, Prediction, Round } from '../../../types'
import './RoundPredictionsPage.css'

type RoundPredictionsPageProps = {
  matches: Match[]
  players: Player[]
  predictions: Prediction[]
  rounds: Round[]
}

type PlayerProgress = {
  filled: number
  player: Player
}

const lastRoundNumber = 8

export function RoundPredictionsPage({
  matches,
  players,
  predictions,
  rounds,
}: RoundPredictionsPageProps) {
  const [selectedRoundNumber, setSelectedRoundNumber] = useState(1)
  const roundId = `round-${selectedRoundNumber}`
  const round = rounds.find((item) => item.number === selectedRoundNumber || item.id === roundId)
  const roundMatchIds = useMemo(
    () => new Set(matches.filter((match) => match.roundId === roundId).map((match) => match.id)),
    [matches, roundId],
  )
  const matchCount = roundMatchIds.size

  /**
   * So conta quantos jogos cada um preencheu — os placares palpitados nao aparecem
   * aqui de proposito, para o admin nao ver palpite de ninguem antes do prazo.
   */
  const progress = useMemo<PlayerProgress[]>(() => {
    const filledByUser = new Map<string, number>()

    predictions.forEach((prediction) => {
      if (roundMatchIds.has(prediction.matchId)) {
        filledByUser.set(prediction.userId, (filledByUser.get(prediction.userId) ?? 0) + 1)
      }
    })

    return players
      .filter((player) => player.approved)
      .map((player) => ({ player, filled: filledByUser.get(player.id) ?? 0 }))
      .sort((a, b) => a.filled - b.filled || a.player.name.localeCompare(b.player.name))
  }, [players, predictions, roundMatchIds])

  const completeCount = progress.filter(
    (item) => matchCount > 0 && item.filled >= matchCount,
  ).length
  const missingCount = progress.length - completeCount

  return (
    <div className="round-predictions-manager">
      <div className="admin-panel round-overview round-predictions-overview">
        <div className="round-status-line">
          <span>{matchCount} jogo(s)</span>
          <span>{round?.status === 'published' ? 'Rodada publicada' : 'Rascunho'}</span>
        </div>
        <div className="round-nav">
          <button
            type="button"
            onClick={() => setSelectedRoundNumber((current) => Math.max(1, current - 1))}
            disabled={selectedRoundNumber === 1}
          >
            &lt;
          </button>
          <h2>Rodada {selectedRoundNumber}</h2>
          <button
            type="button"
            onClick={() => setSelectedRoundNumber((current) => Math.min(lastRoundNumber, current + 1))}
            disabled={selectedRoundNumber === lastRoundNumber}
          >
            &gt;
          </button>
        </div>
        <div className="round-status-line round-predictions-summary">
          <span className="is-complete">{completeCount} completos</span>
          <span className="is-missing">{missingCount} faltando</span>
        </div>
      </div>

      <section className="admin-panel round-predictions-panel">
        <div className="round-of-16-heading">
          <span className="eyebrow">Quem já palpitou</span>
          <h2>Rodada {selectedRoundNumber}</h2>
          <p className="muted-text">
            Só mostra quantos jogos cada jogador já preencheu — os palpites em si continuam
            escondidos.
          </p>
        </div>

        {matchCount === 0 ? (
          <p className="muted-text">Essa rodada ainda não tem jogos cadastrados.</p>
        ) : progress.length === 0 ? (
          <p className="muted-text">Nenhum jogador aprovado para palpitar ainda.</p>
        ) : (
          <div className="round-predictions-list">
            {progress.map(({ filled, player }) => {
              const isComplete = filled >= matchCount
              const status = isComplete
                ? 'complete'
                : filled === 0
                  ? 'none'
                  : 'partial'

              return (
                <article className={`round-prediction-row is-${status}`} key={player.id}>
                  <div>
                    <strong>{player.name}</strong>
                    <span>{player.email}</span>
                  </div>
                  <span className="round-prediction-count">
                    {filled}/{matchCount}
                  </span>
                  <span className="round-prediction-pill">
                    {isComplete
                      ? 'Completo'
                      : filled === 0
                        ? 'Não palpitou'
                        : `Faltam ${matchCount - filled}`}
                  </span>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

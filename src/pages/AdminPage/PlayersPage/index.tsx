import { useState } from 'react'
import { Button } from '../../../components/Button'
import type { Player } from '../../../types'
import './PlayersPage.css'

type PlayersPageProps = {
  onApproveUser: (userId: string, approved: boolean) => void
  onDeletePlayer: (userId: string) => void
  onRecalculateRanking: () => void
  players: Player[]
}

type PendingRoleChange = {
  nextApproved: boolean
  player: Player
}

export function PlayersPage({
  onApproveUser,
  onDeletePlayer,
  onRecalculateRanking,
  players,
}: PlayersPageProps) {
  const [pendingChange, setPendingChange] = useState<PendingRoleChange | null>(null)
  const [playerToRemove, setPlayerToRemove] = useState<Player | null>(null)
  const orderedPlayers = [...players].sort(
    (a, b) => Number(a.approved) - Number(b.approved) || a.name.localeCompare(b.name),
  )
  const visitorCount = players.filter((player) => player.role !== 'admin' && !player.approved).length

  function requestRoleChange(player: Player, nextApproved: boolean) {
    if (player.approved === nextApproved) {
      return
    }

    setPendingChange({ nextApproved, player })
  }

  return (
    <section className="admin-panel players-admin">
      <span className="eyebrow">Jogadores</span>
      <h2>Jogador ou visitante</h2>
      <p className="muted-text">
        {visitorCount > 0
          ? `${visitorCount} pessoa(s) como visitante ainda. Visitante so consegue ver o site; jogador tambem envia palpites e aparece no ranking.`
          : 'Todo mundo que entrou ja esta como jogador ou e admin.'}
      </p>

      {/* O ranking e calculado no servidor. Se ficar desatualizado, da para forcar aqui. */}
      <div className="players-admin__actions">
        <Button onClick={onRecalculateRanking} variant="ghost">
          Recalcular ranking
        </Button>
      </div>

      {orderedPlayers.length === 0 ? (
        <p className="muted-text">Ninguem entrou no site ainda.</p>
      ) : (
        <div className="player-approval-list">
          {orderedPlayers.map((player) => (
            <article className="player-approval-row" key={player.id}>
              <div>
                <strong>{player.name}</strong>
                <span>{player.email}</span>
              </div>

              {player.role === 'admin' ? (
                <span className="status-pill">Admin</span>
              ) : (
                <>
                  <div className="leg-toggle player-role-toggle" role="tablist" aria-label="Jogador ou visitante">
                    <button
                      className={player.approved ? 'active' : ''}
                      type="button"
                      role="tab"
                      aria-selected={player.approved}
                      onClick={() => requestRoleChange(player, true)}
                    >
                      Jogador
                    </button>
                    <button
                      className={!player.approved ? 'active' : ''}
                      type="button"
                      role="tab"
                      aria-selected={!player.approved}
                      onClick={() => requestRoleChange(player, false)}
                    >
                      Visitante
                    </button>
                  </div>
                  <button
                    className="danger-button danger-button--compact"
                    type="button"
                    onClick={() => setPlayerToRemove(player)}
                  >
                    Remover
                  </button>
                </>
              )}
            </article>
          ))}
        </div>
      )}

      {pendingChange ? (
        <ConfirmRoleChangeModal
          nextApproved={pendingChange.nextApproved}
          player={pendingChange.player}
          onCancel={() => setPendingChange(null)}
          onConfirm={() => {
            onApproveUser(pendingChange.player.id, pendingChange.nextApproved)
            setPendingChange(null)
          }}
        />
      ) : null}

      {playerToRemove ? (
        <ConfirmRemovePlayerModal
          player={playerToRemove}
          onCancel={() => setPlayerToRemove(null)}
          onConfirm={() => {
            onDeletePlayer(playerToRemove.id)
            setPlayerToRemove(null)
          }}
        />
      ) : null}
    </section>
  )
}

function ConfirmRemovePlayerModal({
  onCancel,
  onConfirm,
  player,
}: {
  onCancel: () => void
  onConfirm: () => void
  player: Player
}) {
  return (
    <div className="confirm-overlay" role="presentation">
      <div className="confirm-card" role="dialog" aria-modal="true" aria-labelledby="remove-player-title">
        <span className="eyebrow">Remover do bolao</span>
        <h2 id="remove-player-title">Remover {player.name}?</h2>
        <p>
          Isso apaga a conta dessa pessoa de vez: perfil, palpites e o login. Para voltar ao bolao, ela
          teria que criar uma conta nova do zero. Nao da para desfazer.
        </p>
        <div className="confirm-actions">
          <Button className="confirm-cancel-button" onClick={onCancel} variant="ghost">
            Cancelar
          </Button>
          <button className="danger-button" type="button" onClick={onConfirm}>
            Sim, remover
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmRoleChangeModal({
  nextApproved,
  onCancel,
  onConfirm,
  player,
}: {
  nextApproved: boolean
  onCancel: () => void
  onConfirm: () => void
  player: Player
}) {
  return (
    <div className="confirm-overlay" role="presentation">
      <div className="confirm-card" role="dialog" aria-modal="true" aria-labelledby="role-change-title">
        <span className="eyebrow">Confirmar alteracao</span>
        <h2 id="role-change-title">
          Tornar {player.name} {nextApproved ? 'jogador' : 'visitante'}?
        </h2>
        <p>
          {nextApproved
            ? 'A partir de agora essa pessoa consegue enviar palpites e aparece no ranking.'
            : 'A partir de agora essa pessoa so consegue ver o site, sem enviar palpites e sem aparecer no ranking.'}
        </p>
        <div className="confirm-actions">
          <Button className="confirm-cancel-button" onClick={onCancel} variant="ghost">
            Cancelar
          </Button>
          {nextApproved ? (
            <Button onClick={onConfirm}>Sim, tornar jogador</Button>
          ) : (
            <button className="danger-button" type="button" onClick={onConfirm}>
              Sim, tornar visitante
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

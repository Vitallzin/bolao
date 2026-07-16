import { Button } from '../../../components/Button'
import type { Player } from '../../../types'
import './PlayersPage.css'

type PlayersPageProps = {
  onApproveUser: (userId: string, approved: boolean) => void
  players: Player[]
}

export function PlayersPage({ onApproveUser, players }: PlayersPageProps) {
  const orderedPlayers = [...players].sort(
    (a, b) => Number(a.approved) - Number(b.approved) || a.name.localeCompare(b.name),
  )
  const pendingCount = players.filter((player) => player.role !== 'admin' && !player.approved).length

  return (
    <section className="admin-panel players-admin">
      <span className="eyebrow">Jogadores</span>
      <h2>Aprovar jogadores</h2>
      <p className="muted-text">
        {pendingCount > 0
          ? `${pendingCount} jogador(es) aguardando aprovacao. So quem for aprovado consegue enviar palpites e aparecer no ranking.`
          : 'Todo mundo que entrou ja foi aprovado ou esta liberado como admin.'}
      </p>

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
                  <span className={player.approved ? 'status-pill' : 'status-pill status-pill--locked'}>
                    {player.approved ? 'Aprovado' : 'Pendente'}
                  </span>
                  <div className="player-approval-row__actions">
                    {player.approved ? (
                      <Button onClick={() => onApproveUser(player.id, false)} variant="ghost">
                        Revogar
                      </Button>
                    ) : (
                      <Button onClick={() => onApproveUser(player.id, true)}>Aprovar</Button>
                    )}
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

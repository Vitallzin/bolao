import type { SaveState } from './useSaveTracker'
import './SaveStatus.css'

export type { SaveState }

const copy: Record<SaveState, { icon: string; label: string }> = {
  idle: { icon: '✓', label: 'Salva automaticamente' },
  saving: { icon: '', label: 'Salvando…' },
  saved: { icon: '✓', label: 'Palpite salvo' },
  error: { icon: '!', label: 'Não salvou — tente de novo' },
}

/**
 * Selo de confirmacao do palpite, no mesmo desenho dos pontos do jogo (circulo +
 * texto numa pilula). Ocupa sempre a mesma altura, para a linha nao pular quando
 * o estado muda.
 */
export function SaveStatus({ state }: { state: SaveState }) {
  const { icon, label } = copy[state]

  return (
    <div
      className={`save-status save-status--${state}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="save-status__icon" aria-hidden="true">
        {state === 'saving' ? <span className="save-status__spinner" /> : icon}
      </span>
      <span className="save-status__label">{label}</span>
    </div>
  )
}

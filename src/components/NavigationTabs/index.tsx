import { viewLabels } from '../../constants'
import type { View } from '../../types'
import './NavigationTabs.css'

type NavigationTabsProps = {
  activeView: View
  onChange: (view: View) => void
}

export function NavigationTabs({ activeView, onChange }: NavigationTabsProps) {
  return (
    <nav className="tabs" aria-label="Navegacao principal">
      {(['palpites', 'previsoes', 'ranking', 'champions', 'statistics', 'mata-mata'] as View[]).map((view) => (
        <button
          key={view}
          className={activeView === view ? 'active' : ''}
          type="button"
          onClick={() => onChange(view)}
        >
          {viewLabels[view]}
        </button>
      ))}
    </nav>
  )
}

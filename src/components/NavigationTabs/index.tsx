import { useEffect, useRef } from 'react'
import { viewLabels } from '../../constants'
import type { View } from '../../types'
import './NavigationTabs.css'

type NavigationTabsProps = {
  activeView: View
  onChange: (view: View) => void
}

export function NavigationTabs({ activeView, onChange }: NavigationTabsProps) {
  const navRef = useRef<HTMLElement>(null)

  // No celular as abas rolam para o lado: traz a ativa para a vista, senao ela
  // fica cortada na borda ("Tabe...") depois de trocar de aba.
  useEffect(() => {
    const nav = navRef.current
    const active = nav?.querySelector<HTMLElement>('button.active')

    if (!nav || !active || nav.scrollWidth <= nav.clientWidth) {
      return
    }

    const left = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2
    nav.scrollTo({ behavior: 'smooth', left })
  }, [activeView])

  return (
    <nav className="tabs" aria-label="Navegação principal" ref={navRef}>
      {(['palpites', 'previsoes', 'ranking', 'champions', 'statistics', 'mata-mata', 'regras', 'sobre'] as View[]).map((view) => (
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

import { useRef, useState } from 'react'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Acompanha, por chave (um jogo, uma ida/volta), se o ultimo palpite ja foi
 * confirmado pelo servidor. O palpite continua salvando sozinho a cada digito;
 * isto so mostra o resultado. Escritas em sequencia no mesmo jogo contam juntas:
 * "salvo" so aparece quando a ultima terminou.
 */
export function useSaveTracker() {
  const [states, setStates] = useState<Record<string, SaveState>>({})
  const inFlight = useRef<Record<string, number>>({})
  const lastFailed = useRef<Record<string, boolean>>({})

  function setState(key: string, state: SaveState) {
    setStates((current) => (current[key] === state ? current : { ...current, [key]: state }))
  }

  /** Roda a gravacao e reflete o andamento em `states[key]`. */
  async function track(key: string, write: () => Promise<boolean>) {
    inFlight.current[key] = (inFlight.current[key] ?? 0) + 1
    setState(key, 'saving')

    let written = false

    try {
      written = await write()
      lastFailed.current[key] = false
    } catch {
      lastFailed.current[key] = true
    }

    inFlight.current[key] -= 1

    if (inFlight.current[key] > 0) {
      return
    }

    // Gravacao recusada (prazo vencido): nada a confirmar, volta ao que o palpite ja diz.
    setState(key, lastFailed.current[key] ? 'error' : written ? 'saved' : 'idle')
  }

  return { states, track }
}

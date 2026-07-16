export const knockoutStages = [
  { id: 'playoffs', label: 'Rodada de playoffs' },
  { id: 'oitavas', label: 'Oitavas' },
  { id: 'quartas', label: 'Quartas' },
  { id: 'semis', label: 'Semis' },
  { id: 'final', label: 'Final' },
]

export const bracketStages = knockoutStages.filter((stage) => stage.id !== 'playoffs')
export const knockoutStageLabel = new Map(knockoutStages.map((stage) => [stage.id, stage.label]))

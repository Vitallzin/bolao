/**
 * Notas de versao mostradas na aba Sobre, da mais recente para a mais antiga.
 * A primeira entrada e a versao publicada do site — constants.ts tira o
 * appVersion daqui, entao basta adicionar a nova versao no topo desta lista.
 *
 * Ao lancar: acrescente a entrada aqui, atualize o "version" do package.json e
 * o badge do README com o mesmo numero.
 */
export type Release = {
  /** Data do lancamento, no formato AAAA-MM-DD. */
  date: string
  highlights: string[]
  title: string
  version: string
}

export const releases: Release[] = [
  {
    version: '1.2.0',
    date: '2026-09-09',
    title: 'Palpites dos outros jogadores',
    highlights: [
      'Depois que o prazo da rodada fecha, dá para ver os palpites dos outros jogadores direto na aba Palpites.',
      'A opção só aparece com a rodada fechada — enquanto o prazo está aberto, ninguém vê o palpite de ninguém.',
      'A navegação mostra um jogador por vez, com quantos jogos ele preencheu e quantos pontos fez na rodada.',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-09-08',
    title: 'Acompanhamento e revisão pelo admin',
    highlights: [
      'O admin vê quantos jogos cada jogador já preencheu na rodada, sem que nenhum palpite seja revelado.',
      'As previsões da competição de cada jogador ficam visíveis para o admin, uma pessoa por vez.',
      'O admin pode corrigir os nomes enviados nas previsões para padronizar a grafia antes da pontuação.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-08-30',
    title: 'Lançamento',
    highlights: [
      'Palpites por rodada da fase de liga e por confronto do mata-mata, cada etapa com seu próprio prazo.',
      'Pontuação calculada no servidor assim que o admin publica um placar, com ranking atualizado na hora.',
      'Previsões da competição: campeão, vice, artilheiro, garçom, melhor jogador e melhor goleiro.',
      'Tabela da fase de liga com os nove critérios de desempate oficiais da UEFA.',
      'Painel do admin completo e notificações por e-mail de rodada nova e de prazo chegando.',
    ],
  },
]

# Bolão da Champions

Site de bolão para acompanhar a Champions League com os amigos: cada jogador envia palpites para
a fase de liga e o mata-mata, o site calcula a pontuação automaticamente e mantém um ranking ao vivo.

## Funcionalidades

- **Palpites** — jogos da fase de liga por rodada e confrontos de mata-mata separados em Ida e Volta,
  cada etapa com seu próprio prazo.
- **Previsões da competição** — campeão, vice, artilheiro, garçom, melhor jogador e melhor goleiro,
  enviados uma única vez antes do início.
- **Tabela da fase de liga** — classificação calculada com o critério de desempate oficial da UEFA
  (pontos, saldo de gols, gols marcados, gols fora, vitórias, vitórias fora e força dos adversários
  enfrentados).
- **Ranking** — pontuação de cada jogador com destaque para o pódio.
- **Estatísticas** — artilharia, assistências e participação em gols dos jogadores da competição.
- **Painel administrativo** — cadastro de times, rodadas, mata-mata, estatísticas de jogadores,
  publicação de resultados e aprovação de novos jogadores.
- **Contas e acesso** — login por e-mail/senha (com confirmação de e-mail) ou Google; todo jogador
  novo entra como pendente até o administrador aprovar, e só então consegue palpitar e aparecer no
  ranking.
- **Notificações por e-mail** — aviso quando uma rodada é publicada e lembrete para quem ainda não
  palpitou perto do prazo, configurável por jogador. Ver [`scripts/notify`](scripts/notify).

## Stack

React 19 + TypeScript, Vite, Firebase (Auth e Firestore). Sem backend próprio — o Firestore e suas
regras de segurança (`firestore.rules`) são a única camada de dados.

## Rodando localmente

```bash
npm install
npm run dev
```

Crie um arquivo `.env.local` na raiz com as credenciais do seu projeto Firebase:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

No Firebase Console, ative **Authentication → Sign-in method** para Google e Email/Password, e publique
as regras em [`firestore.rules`](firestore.rules).

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Ambiente de desenvolvimento com hot reload |
| `npm run build` | Checagem de tipos (`tsc -b`) e build de produção |
| `npm run preview` | Serve o build de produção localmente |
| `npm run lint` | Lint com oxlint |

## Estrutura

```
src/
  components/     componentes de UI compartilhados
  pages/          telas (login, dashboard, admin e suas sub-páginas)
  hooks/          integração com Firebase Auth e Firestore
  utils/          pontuação, datas, países, tratamento de erros
api/               função serverless do Vercel (e-mail de confirmação de conta)
scripts/notify/    script standalone que envia as notificações por e-mail (roda via GitHub Actions)
```

## Notificações por e-mail

As notificações de rodada/prazo não usam Cloud Functions — rodam como um script Node separado,
agendado por hora através do GitHub Actions, usando o Admin SDK do Firebase e a API do
[Resend](https://resend.com). Configuração completa em [`scripts/notify/README.md`](scripts/notify/README.md).

## E-mail de confirmação de conta

O e-mail enviado para confirmar o endereço de quem cria conta com e-mail/senha também não usa o
template padrão do Firebase (genérico, em inglês e com chance maior de cair em spam) — é gerado pela
função serverless [`api/send-verification-email.ts`](api/send-verification-email.ts), que roda no
próprio Vercel, e enviado com a mesma identidade visual e o mesmo remetente do Resend usado nas
notificações.

No painel do Vercel (**Settings → Environment Variables**), além das variáveis `VITE_FIREBASE_*`,
adicione (sem o prefixo `VITE_`, para não irem para o código do navegador):

```
FIREBASE_SERVICE_ACCOUNT=   (o mesmo JSON da conta de serviço usado no GitHub Actions)
RESEND_API_KEY=             (a mesma chave do Resend)
RESEND_FROM_EMAIL=          (opcional, remetente verificado no Resend)
SITE_URL=                   (a URL do site publicado)
```

<div align="center">

# Bolão da Champions

**Aplicação web para acompanhar a Champions League com os amigos** — palpites, ranking ao vivo e
classificação com o critério de desempate oficial da UEFA.

[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)
[![GitHub Actions](https://img.shields.io/badge/Automação-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)](https://github.com/features/actions)

</div>

---

<!--
  Dica: coloque aqui um print ou GIF do site (tela de login e o dashboard já bastam).
  Exemplo:
  <p align="center">
    <img src=".github/preview.png" alt="Tela do Bolão da Champions" width="800">
  </p>
-->

## Sobre o projeto

O Bolão da Champions é uma aplicação web para acompanhar a Champions League com um grupo de amigos.
Cada jogador cria uma conta, envia palpites por rodada da fase de liga e por confronto do mata-mata
(ida e volta), e o sistema calcula a pontuação automaticamente, incluindo o critério de desempate
oficial da UEFA na tabela de classificação. Construído com React, TypeScript e Firebase, sem servidor
tradicional — inclui painel administrativo completo, aprovação de novos usuários e notificações por
e-mail agendadas.

**[Ver o projeto no ar](https://bolao-virid.vercel.app)**

## Funcionalidades

- **Login por e-mail e senha (com confirmação de e-mail) ou Google.**
- **Sistema de aprovação** — só jogadores liberados pelo admin enviam palpites e aparecem no ranking; o resto entra como visitante, só de olho no site.
- **Palpites separados por rodada** da fase de liga e por confronto de mata-mata (ida e volta), cada etapa com seu próprio prazo.
- **Previsões da competição** — campeão, vice, artilheiro, garçom, melhor jogador e melhor goleiro.
- **Classificação da fase de liga** calculada com o critério de desempate oficial da UEFA (pontos, saldo de gols, gols marcados, gols fora, vitórias, vitórias fora e força dos adversários enfrentados).
- **Ranking** dos jogadores com destaque para o pódio.
- **Painel administrativo** completo — times, rodadas, mata-mata, estatísticas de jogadores, publicação de resultados e aprovação de usuários.
- **Notificações por e-mail** configuráveis por jogador — aviso de rodada nova e lembrete de prazo, com envio automático agendado.

## Tecnologias

| Camada | Ferramentas |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, CSS puro (sistema de design próprio) |
| Autenticação e dados | Firebase Authentication, Firebase Firestore, Firestore Security Rules |
| Automação de e-mail | Vercel Serverless Functions, Firebase Admin SDK, Nodemailer (Gmail), GitHub Actions |
| Deploy | Vercel |
| Qualidade | TypeScript (checagem estrita), oxlint |

## Arquitetura

O projeto é **100% serverless** — sem back-end tradicional:

- **Firestore** guarda os dados, e as **Security Rules** são a única camada de autorização (papéis
  admin/jogador/visitante, e-mail verificado, prazos de cada rodada).
- O **e-mail de confirmação de conta** é gerado por uma função serverless na Vercel
  ([`api/send-verification-email.ts`](api/send-verification-email.ts)), com identidade visual
  própria — no lugar do template genérico do Firebase.
- As **notificações agendadas** (rodada publicada, lembrete de prazo) rodam via um script Node
  disparado de hora em hora pelo GitHub Actions ([`scripts/notify`](scripts/notify)), evitando a
  necessidade de Cloud Functions e de um plano pago no Firebase.

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
api/              funções serverless do Vercel (e-mail de confirmação, remoção de jogador)
scripts/notify/   script standalone que envia as notificações por e-mail (roda via GitHub Actions)
```

## Notificações por e-mail

Configuração completa (conta do Gmail, senha de app, secrets) em
[`scripts/notify/README.md`](scripts/notify/README.md).

## Funções serverless (Vercel)

Duas operações precisam do Admin SDK e por isso rodam no servidor, não no navegador:

- [`api/send-verification-email.ts`](api/send-verification-email.ts) — gera o link de confirmação de
  e-mail e envia com a identidade visual do projeto, no lugar do template padrão do Firebase.
- [`api/delete-player.ts`](api/delete-player.ts) — remove um jogador de vez (perfil, palpites e a
  conta no Firebase Auth). Só o admin consegue chamar, e não é possível remover a si mesmo nem outro
  admin.

No painel do Vercel (**Settings → Environment Variables**), além das variáveis `VITE_FIREBASE_*`,
adicione (sem o prefixo `VITE_`, para não irem para o código do navegador):

```
FIREBASE_SERVICE_ACCOUNT=   (o mesmo JSON da conta de serviço usado no GitHub Actions)
GMAIL_USER=                 (o email da conta Gmail dedicada ao projeto)
GMAIL_APP_PASSWORD=         (a senha de app de 16 caracteres, nao a senha normal da conta)
SITE_URL=                   (a URL do site publicado)
```

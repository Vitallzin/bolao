# Notificacoes por email do bolao

Script standalone (fora do app React) que roda de hora em hora via GitHub Actions e manda:

- Um email quando uma rodada e publicada (`notifyOnRoundPublished`).
- Um lembrete se o prazo (rodada ou mata-mata, ida/volta) esta perto de fechar e o jogador ainda nao mandou todos os palpites (`notifyOnDeadlineReminder`).

Cada usuario controla essas preferencias em Configuracoes > Notificacoes, dentro do site.

## Por que um script separado, e nao Cloud Functions

Roda fora do Firebase (GitHub Actions, gratuito), sem precisar colocar o projeto no plano pago (Blaze) do Firebase.
Usa o Admin SDK do Firebase, que tem acesso total ao Firestore e ignora as regras de seguranca (`firestore.rules`) —
por isso nao precisou mudar nada nas regras para o script funcionar.

## Configuracao necessaria (uma vez)

### 1. Chave de servico do Firebase

1. Firebase Console > Configuracoes do projeto > Contas de servico.
2. "Gerar nova chave privada" — baixa um arquivo `.json`.
3. Copie o conteudo inteiro desse arquivo.
4. No GitHub: Settings > Secrets and variables > Actions > New repository secret.
   - Nome: `FIREBASE_SERVICE_ACCOUNT`
   - Valor: cole o JSON inteiro.

**Nunca** commite esse arquivo `.json` no repositorio.

### 2. Conta do Gmail dedicada (envio de email)

Use uma conta Google separada, so para o bolao (nao a sua pessoal).

1. Ative a **verificacao em duas etapas** nessa conta: myaccount.google.com/security > "Verificacao em
   duas etapas".
2. Depois de ativar, va em myaccount.google.com/apppasswords > crie uma senha de app (nome sugerido:
   "Bolao notificacoes"). Vai gerar uma senha de 16 caracteres — copie sem os espacos.
3. No GitHub, crie dois secrets:
   - `GMAIL_USER`: o email dessa conta (ex: `bolaodachampions@gmail.com`)
   - `GMAIL_APP_PASSWORD`: a senha de 16 caracteres gerada no passo 2 (**nao** a senha normal da conta —
     essa senha normal nao funciona para envio automatizado)

O Gmail tem limite de ~500 emails/dia por conta, bem acima do que um bolao de amigos precisa.

### 3. Link do site

Crie o secret `SITE_URL` com a URL onde o site esta publicado (ex: `https://seubolao.vercel.app`), usada
nos botoes dos emails.

## Rodando manualmente

Na aba "Actions" do GitHub, escolha o workflow "Bolao email notifications" e clique em "Run workflow" —
nao precisa esperar a proxima hora cheia.

## Rodando local (para testar)

```bash
cd scripts/notify
npm install
FIREBASE_SERVICE_ACCOUNT='{"...": "..."}' GMAIL_USER=bolao@gmail.com GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx SITE_URL=https://seubolao.vercel.app npm run notify
```

## Como evita mandar o mesmo aviso duas vezes

Cada usuario, no Firestore (`users/{uid}`), guarda `notifiedPublishedRounds` e `notifiedDeadlineReminders`
com as chaves ja avisadas. O script confere isso antes de mandar.

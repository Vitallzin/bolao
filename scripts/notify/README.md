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

### 2. Conta no Resend (envio de email)

1. Crie uma conta gratuita em [resend.com](https://resend.com) (100 emails/dia gratis).
2. Pegue a API key em API Keys > Create API Key.
3. No GitHub, crie o secret `RESEND_API_KEY` com essa chave.
4. (Opcional) Se voce verificar um dominio proprio no Resend, crie o secret `RESEND_FROM_EMAIL`, ex:
   `Bolao da Champions <bolao@seudominio.com>`. Sem isso, usa o dominio de teste do Resend
   (`onboarding@resend.dev` — funciona, mas tem limite de envio menor e mais chance de cair em spam).

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
FIREBASE_SERVICE_ACCOUNT='{"...": "..."}' RESEND_API_KEY=re_xxx SITE_URL=https://seubolao.vercel.app npm run notify
```

## Como evita mandar o mesmo aviso duas vezes

Cada usuario, no Firestore (`users/{uid}`), guarda `notifiedPublishedRounds` e `notifiedDeadlineReminders`
com as chaves ja avisadas. O script confere isso antes de mandar.

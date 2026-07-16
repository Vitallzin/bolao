import { FirebaseError } from 'firebase/app'

export function getFirebaseMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return 'Nao consegui concluir o login. Tente de novo em alguns segundos.'
  }

  const messages: Record<string, string> = {
    'auth/unauthorized-domain':
      'Esse dominio nao esta liberado no Firebase Auth. Adicione localhost e 127.0.0.1 em Authentication > Settings > Authorized domains.',
    'auth/operation-not-allowed':
      'Esse metodo de login ainda nao esta ativado no Firebase. Ative em Authentication > Sign-in method.',
    'auth/popup-blocked':
      'O navegador bloqueou a janela do Google. Libere popups para este site e tente de novo.',
    'auth/popup-closed-by-user': 'A janela do Google foi fechada antes de terminar o login.',
    'auth/email-already-in-use': 'Ja existe uma conta com esse email. Tente entrar em vez de criar uma nova.',
    'auth/invalid-email': 'Esse email nao parece valido.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/missing-password': 'Informe uma senha.',
    'auth/wrong-password': 'Email ou senha incorretos.',
    'auth/user-not-found': 'Nao encontramos uma conta com esse email.',
    'auth/invalid-credential': 'Email ou senha incorretos.',
    'auth/too-many-requests': 'Muitas tentativas seguidas. Aguarde um pouco e tente de novo.',
    'permission-denied':
      'O login funcionou, mas o Firestore bloqueou o perfil. Confira se as regras foram publicadas e se o banco foi criado.',
  }

  return messages[error.code] ?? `Firebase retornou: ${error.code}`
}

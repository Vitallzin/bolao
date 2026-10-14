import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import {
  clearIndexedDbPersistence,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  terminate,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
// Cache local (IndexedDB) do Firestore: ao recarregar, as telas abrem na hora
// com o que ja foi baixado e o servidor so manda o que mudou. Nao muda o que o
// usuario pode ler — as regras continuam valendo no servidor — e o cache e
// apagado no logout (clearLocalData), para nao sobrar dado num PC compartilhado.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
export const googleProvider = new GoogleAuthProvider()

/**
 * Apaga o cache local do Firestore. So funciona com o Firestore parado, entao
 * depois disso a pagina precisa recarregar para ele subir de novo.
 */
export async function clearLocalData() {
  try {
    await terminate(db)
    await clearIndexedDbPersistence(db)
  } catch {
    // Outra aba aberta segura o cache; ele e sobrescrito no proximo login.
  }
}

// Analytics nao e necessario para abrir a tela: carrega so depois, num arquivo
// separado, sem pesar no primeiro carregamento.
if (firebaseConfig.measurementId) {
  window.addEventListener('load', () => {
    void import('firebase/analytics').then(async ({ getAnalytics, isSupported }) => {
      if (await isSupported()) {
        getAnalytics(app)
      }
    })
  }, { once: true })
}

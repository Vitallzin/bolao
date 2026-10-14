import { useEffect, useRef, useState } from 'react'
import { FirebaseError } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, getDoc, getDocFromCache, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { defaultNotificationPreferences } from '../constants'
import { auth, clearLocalData, db, googleProvider } from '../firebase'
import type { NotificationPreferences, Player } from '../types'
import { getFirebaseMessage } from '../utils/firebaseErrors'
import { toPublicProfile, userDocToPlayer } from '../utils/userProfile'

export function useAuthProfile() {
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<Player | null>(null)
  const [emailVerified, setEmailVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messageId, setMessageId] = useState(0)
  const pendingSignUpNameRef = useRef<string | null>(null)

  function showMessage(nextMessage: string) {
    setMessage(nextMessage)
    setMessageId((current) => current + 1)
  }

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setAuthUser(user)
      setEmailVerified(Boolean(user?.emailVerified))
      setLoading(true)
      showMessage('')

      if (!user) {
        setCurrentUser(null)
        setLoading(false)
        return
      }

      const pendingSignUpName = pendingSignUpNameRef.current
      pendingSignUpNameRef.current = null

      try {
        const profile = await ensureUserProfile(user, pendingSignUpName)
        setCurrentUser(profile)
      } catch (error) {
        await signOut(auth)
        setCurrentUser(null)
        showMessage(getFirebaseMessage(error))
      } finally {
        setLoading(false)
      }
    })
  }, [])

  // O proprio perfil em tempo real: liberacao pelo admin, nome trocado em outra
  // aba etc. Antes isso vinha da lista de todos os usuarios, que agora so o
  // admin pode ler.
  const signedInUid = currentUser ? authUser?.uid : undefined

  useEffect(() => {
    if (!signedInUid || !authUser) {
      return
    }

    return onSnapshot(
      doc(db, 'users', signedInUid),
      (snapshot) => {
        if (snapshot.exists()) {
          setCurrentUser(userDocToPlayer(snapshot.id, snapshot.data(), { photoURL: authUser.photoURL }))
        }
      },
      () => undefined,
    )
  }, [authUser, signedInUid])

  async function handleGoogleLogin() {
    showMessage('')

    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      showMessage(getFirebaseMessage(error))
    }
  }

  async function handleEmailLogin(email: string, password: string) {
    showMessage('')

    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      showMessage(getFirebaseMessage(error))
    }
  }

  async function handleEmailSignUp(name: string, email: string, password: string) {
    showMessage('')

    const trimmedName = name.trim()
    pendingSignUpNameRef.current = trimmedName || null

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)

      if (trimmedName) {
        await updateProfile(credential.user, { displayName: trimmedName })
      }

      await requestVerificationEmail(credential.user)
    } catch (error) {
      pendingSignUpNameRef.current = null
      showMessage(getAuthFlowMessage(error))
    }
  }

  async function resendVerificationEmail() {
    if (!auth.currentUser) {
      return
    }

    showMessage('')

    try {
      await requestVerificationEmail(auth.currentUser)
      showMessage('Email de confirmação reenviado.')
    } catch (error) {
      showMessage(getAuthFlowMessage(error))
    }
  }

  async function refreshEmailVerification() {
    if (!auth.currentUser) {
      return
    }

    await auth.currentUser.reload()
    setEmailVerified(Boolean(auth.currentUser.emailVerified))

    if (!auth.currentUser.emailVerified) {
      showMessage('Ainda não encontramos a confirmação. Confira sua caixa de entrada (e o spam).')
    }
  }

  async function handleLogout() {
    await signOut(auth)
    // Sem o cache, o proximo a usar este navegador nao ve nada do anterior. O
    // Firestore para ao limpar o cache, entao a pagina recarrega (ja na tela de login).
    await clearLocalData()
    window.location.reload()
  }

  async function handleProfileNameUpdate(name: string) {
    if (!currentUser) {
      return
    }

    const nextName = name.trim()

    if (!nextName) {
      showMessage('Informe um nome para o perfil.')
      return
    }

    await updateDoc(doc(db, 'users', currentUser.id), {
      name: nextName,
      updatedAt: serverTimestamp(),
    })
    await setDoc(doc(db, 'profiles', currentUser.id), toPublicProfile({ ...currentUser, name: nextName }), { merge: true })
    setCurrentUser((profile) => profile ? { ...profile, name: nextName } : profile)
    showMessage('Nome atualizado.')
  }

  async function handleNotificationPreferencesUpdate(preferences: NotificationPreferences) {
    if (!currentUser) {
      return
    }

    await updateDoc(doc(db, 'users', currentUser.id), {
      ...preferences,
      updatedAt: serverTimestamp(),
    })
    setCurrentUser((profile) => (profile ? { ...profile, ...preferences } : profile))
    showMessage('Preferências de notificação salvas.')
  }

  return {
    authUser,
    currentUser,
    emailVerified,
    handleEmailLogin,
    handleEmailSignUp,
    handleGoogleLogin,
    handleLogout,
    handleNotificationPreferencesUpdate,
    handleProfileNameUpdate,
    loading,
    message,
    messageId,
    refreshEmailVerification,
    resendVerificationEmail,
    setMessage: showMessage,
  }
}

async function ensureUserProfile(user: User, pendingSignUpName: string | null): Promise<Player> {
  const userRef = doc(db, 'users', user.uid)
  // Perfil do cache local primeiro: abre a tela sem esperar o servidor. O que
  // estiver desatualizado (nome, liberacao) chega em seguida pelo onSnapshot do
  // proprio users/{uid}, logo abaixo em useAuthProfile. Papel e liberacao aqui so mudam a interface —
  // quem decide o que cada um le e grava sao as regras do Firestore no servidor.
  // "Nao existe" nunca vem do cache: so o servidor confirma antes de criar um
  // perfil novo, senao um cache velho recriaria a conta por cima da verdadeira.
  const cached = await getDocFromCache(userRef).catch(() => null)
  const snapshot = cached?.exists() ? cached : await getDoc(userRef)

  if (snapshot.exists()) {
    const profile = userDocToPlayer(snapshot.id, snapshot.data(), {
      email: user.email,
      name: user.displayName,
      photoURL: user.photoURL,
    })

    // So registra o ultimo acesso: a tela nao precisa esperar essa gravacao,
    // que antes segurava o "Carregando" por mais uma ida ao servidor.
    void setDoc(
      userRef,
      {
        name: profile.name,
        email: profile.email,
        photoURL: user.photoURL ?? null,
        lastLoginAt: serverTimestamp(),
      },
      { merge: true },
    ).catch(() => undefined)
    // Mantem o perfil publico (nome, foto, liberado) igual ao privado. Cria o de
    // quem entrou antes dele existir.
    void setDoc(doc(db, 'profiles', user.uid), toPublicProfile(profile), { merge: true }).catch(() => undefined)

    return profile
  }

  const profile = {
    id: user.uid,
    name: pendingSignUpName || user.displayName || 'Jogador',
    email: user.email ?? '',
    photoURL: user.photoURL ?? null,
    role: 'user',
    approved: false,
    ...defaultNotificationPreferences,
  } satisfies Player

  await setDoc(userRef, {
    name: profile.name,
    email: profile.email,
    photoURL: user.photoURL ?? null,
    role: profile.role,
    approved: false,
    ...defaultNotificationPreferences,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  })
  // Depois do users/{uid}: a regra do perfil publico confere a liberacao nele.
  await setDoc(doc(db, 'profiles', user.uid), toPublicProfile(profile))

  return profile
}

async function requestVerificationEmail(user: User) {
  const idToken = await user.getIdToken()
  const response = await fetch('/api/send-verification-email', {
    headers: { Authorization: `Bearer ${idToken}` },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Não consegui enviar o email de confirmação. Tente de novo em alguns segundos.')
  }
}

function getAuthFlowMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    return getFirebaseMessage(error)
  }

  return error instanceof Error ? error.message : getFirebaseMessage(error)
}

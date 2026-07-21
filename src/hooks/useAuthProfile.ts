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
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { defaultNotificationPreferences } from '../constants'
import { auth, db, googleProvider } from '../firebase'
import type { NotificationPreferences, Player } from '../types'
import { getFirebaseMessage } from '../utils/firebaseErrors'

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
      showMessage('Email de confirmacao reenviado.')
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
      showMessage('Ainda nao encontramos a confirmacao. Confira sua caixa de entrada (e o spam).')
    }
  }

  async function handleLogout() {
    await signOut(auth)
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
    showMessage('Preferencias de notificacao salvas.')
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
    setCurrentUser,
    setMessage: showMessage,
  }
}

async function ensureUserProfile(user: User, pendingSignUpName: string | null): Promise<Player> {
  const userRef = doc(db, 'users', user.uid)
  const snapshot = await getDoc(userRef)

  if (snapshot.exists()) {
    const data = snapshot.data()
    const role = data.role === 'admin' ? 'admin' : 'user'
    const profile = {
      id: snapshot.id,
      name: String(data.name ?? user.displayName ?? 'Jogador'),
      email: String(data.email ?? user.email ?? ''),
      photoURL: String(user.photoURL ?? data.photoURL ?? '') || null,
      role,
      approved: role === 'admin' || data.approved === true,
      notificationsEnabled:
        typeof data.notificationsEnabled === 'boolean'
          ? data.notificationsEnabled
          : defaultNotificationPreferences.notificationsEnabled,
      notifyOnRoundPublished:
        typeof data.notifyOnRoundPublished === 'boolean'
          ? data.notifyOnRoundPublished
          : defaultNotificationPreferences.notifyOnRoundPublished,
      notifyOnDeadlineReminder:
        typeof data.notifyOnDeadlineReminder === 'boolean'
          ? data.notifyOnDeadlineReminder
          : defaultNotificationPreferences.notifyOnDeadlineReminder,
      reminderDaysBefore:
        typeof data.reminderDaysBefore === 'number'
          ? data.reminderDaysBefore
          : defaultNotificationPreferences.reminderDaysBefore,
      preferredNotificationTime:
        typeof data.preferredNotificationTime === 'string'
          ? data.preferredNotificationTime
          : defaultNotificationPreferences.preferredNotificationTime,
    } satisfies Player

    await setDoc(
      userRef,
      {
        name: profile.name,
        email: profile.email,
        photoURL: user.photoURL ?? null,
        lastLoginAt: serverTimestamp(),
      },
      { merge: true },
    )

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

  return profile
}

async function requestVerificationEmail(user: User) {
  const idToken = await user.getIdToken()
  const response = await fetch('/api/send-verification-email', {
    headers: { Authorization: `Bearer ${idToken}` },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Nao consegui enviar o email de confirmacao. Tente de novo em alguns segundos.')
  }
}

function getAuthFlowMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    return getFirebaseMessage(error)
  }

  return error instanceof Error ? error.message : getFirebaseMessage(error)
}

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  useEffect(() => {
    let isSubscribed = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isSubscribed) return

      setSession(nextSession)
      setLoading(false)
      setError(null)

      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
      }
    })

    async function restoreSession() {
      const { data, error: sessionError } = await supabase.auth.getSession()

      if (!isSubscribed) return

      if (sessionError) {
        setError('Unable to connect to your account. Your local characters are still available.')
      } else {
        setSession(data.session)
      }

      setLoading(false)
    }

    restoreSession()

    return () => {
      isSubscribed = false
      subscription.unsubscribe()
    }
  }, [])

  return {
    error,
    loading,
    passwordRecovery,
    session,
    setPasswordRecovery,
    user: session?.user ?? null,
  }
}

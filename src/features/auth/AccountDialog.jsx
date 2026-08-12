/* This project does not include the optional prop-types runtime package. */
/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import { sendPasswordReset, signIn, signOut, signUp, updatePassword } from '../../lib/auth'

export function AccountDialog({
  authError,
  authLoading,
  onClose,
  onRecoveryComplete,
  passwordRecovery,
  syncError,
  user,
}) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape' && !isSubmitting) onClose()
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isSubmitting, onClose])

  function changeMode(nextMode) {
    setMode(nextMode)
    setError(null)
    setNotice(null)
    setPassword('')
  }

  async function handleAuthSubmit(event) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setIsSubmitting(true)

    const normalizedEmail = email.trim()

    try {
      if (mode === 'forgot') {
        const { error: resetError } = await sendPasswordReset(normalizedEmail)
        if (resetError) throw resetError

        setNotice(`A password reset link was sent to ${normalizedEmail}.`)
        return
      }

      const authAction = mode === 'signup' ? signUp : signIn
      const { data, error: submitError } = await authAction(normalizedEmail, password)
      if (submitError) throw submitError

      if (mode === 'signup' && data.user && !data.session) {
        setNotice(`A confirmation link was sent to ${normalizedEmail}.`)
      }
    } catch (submitError) {
      setError(submitError.message || 'Unable to complete that request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handlePasswordUpdate(event) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const { error: updateError } = await updatePassword(password)
      if (updateError) throw updateError

      setPassword('')
      setNotice('Your password has been updated.')
      setMode('account')
      onRecoveryComplete()
    } catch (updateError) {
      setError(updateError.message || 'Unable to update your password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSignOut() {
    setError(null)
    setIsSubmitting(true)

    const { error: signOutError } = await signOut()

    if (signOutError) {
      setError(signOutError.message)
      setIsSubmitting(false)
      return
    }

    onClose()
  }

  const activeMode = passwordRecovery ? 'recovery' : mode
  const showAccount = user && activeMode !== 'recovery'

  return (
    <div
      className="tracker-dialog-backdrop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose()
      }}
      role="presentation"
    >
      <section
        aria-labelledby="account-dialog-title"
        aria-modal="true"
        className="tracker-dialog account-dialog has-close"
        role="dialog"
      >
        <button
          aria-label="Close account"
          className="tracker-dialog-close"
          disabled={isSubmitting}
          onClick={onClose}
          type="button"
        />
        <h2 id="account-dialog-title">Account</h2>

        {authLoading ? (
          <p className="account-status">Checking your session…</p>
        ) : activeMode === 'recovery' ? (
          <>
            <p className="account-subtitle">Choose a new password for your account.</p>
            <form onSubmit={handlePasswordUpdate}>
              <label htmlFor="recovery-password">New password</label>
              <input
                autoComplete="new-password"
                autoFocus
                id="recovery-password"
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
              {(error || authError) && (
                <p className="account-message is-error" role="alert">
                  {error || authError}
                </p>
              )}
              <button className="account-submit-button" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </>
        ) : showAccount ? (
          <div className="account-summary">
            <p className="account-status">Signed in as</p>
            <p className="account-email">{user.email}</p>
            {syncError && (
              <p className="account-message is-error" role="alert">
                {syncError}
              </p>
            )}
            {notice && <p className="account-message is-success">{notice}</p>}
            {error && (
              <p className="account-message is-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="account-sign-out-button"
              disabled={isSubmitting}
              onClick={handleSignOut}
              type="button"
            >
              {isSubmitting ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        ) : (
          <>
            <p className="account-subtitle">
              {mode === 'signup'
                ? 'Create an account to sync your characters.'
                : mode === 'forgot'
                  ? 'Enter your email to receive a reset link.'
                  : 'Sign in to access your saved characters.'}
            </p>

            <form onSubmit={handleAuthSubmit}>
              <label htmlFor="account-email">Email</label>
              <input
                autoComplete="email"
                autoFocus
                id="account-email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />

              {mode !== 'forgot' && (
                <>
                  <label htmlFor="account-password">Password</label>
                  <input
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    id="account-password"
                    minLength={6}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type="password"
                    value={password}
                  />
                </>
              )}

              {(error || authError) && (
                <p className="account-message is-error" role="alert">
                  {error || authError}
                </p>
              )}
              {notice && <p className="account-message is-success">{notice}</p>}

              <button className="account-submit-button" disabled={isSubmitting} type="submit">
                {isSubmitting
                  ? 'Please wait…'
                  : mode === 'signup'
                    ? 'Create account'
                    : mode === 'forgot'
                      ? 'Send reset link'
                      : 'Sign in'}
              </button>
            </form>

            <div className="account-mode-links">
              {mode === 'signin' && (
                <button onClick={() => changeMode('forgot')} type="button">
                  Forgot password?
                </button>
              )}
              <button
                onClick={() =>
                  changeMode(mode === 'signup' || mode === 'forgot' ? 'signin' : 'signup')
                }
                type="button"
              >
                {mode === 'signup'
                  ? 'Already have an account? Sign in'
                  : mode === 'forgot'
                    ? 'Back to sign in'
                    : 'Need an account? Sign up'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

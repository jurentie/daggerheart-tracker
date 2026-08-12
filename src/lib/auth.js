import { supabase } from './supabase'

function getAuthRedirectUrl() {
  return window.location.origin
}

export function signUp(email, password) {
  return supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: getAuthRedirectUrl() },
  })
}

export function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export function signOut() {
  return supabase.auth.signOut()
}

export function sendPasswordReset(email) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthRedirectUrl(),
  })
}

export function updatePassword(password) {
  return supabase.auth.updateUser({ password })
}

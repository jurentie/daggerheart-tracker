const welcomeChoiceStorageKey = 'daggerheart-tracker-welcome-complete-v1'

export function loadWelcomeChoice() {
  if (typeof window === 'undefined') return false

  try {
    return window.localStorage.getItem(welcomeChoiceStorageKey) === 'true'
  } catch {
    return false
  }
}

export function saveWelcomeChoice() {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(welcomeChoiceStorageKey, 'true')
  } catch {
    // The current visit can continue even if the browser blocks local storage.
  }
}

export function clearWelcomeChoice() {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(welcomeChoiceStorageKey)
  } catch {
    // The welcome screen can still be restored for this visit.
  }
}

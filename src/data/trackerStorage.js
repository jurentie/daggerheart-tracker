import { defaultTracker } from './defaultTracker'

const trackerStorageKey = 'daggerheart-tracker'

function getTrackerStorageKey(userId) {
  return userId ? `${trackerStorageKey}-user-${userId}` : trackerStorageKey
}

function createDefaultTracker() {
  return JSON.parse(JSON.stringify(defaultTracker))
}

export function isValidTracker(tracker) {
  if (
    !tracker ||
    tracker.version !== defaultTracker.version ||
    typeof tracker.activeCharacterId !== 'string' ||
    !Array.isArray(tracker.characters) ||
    tracker.characters.length === 0
  ) {
    return false
  }

  return tracker.characters.some(
    (character) =>
      character?.id === tracker.activeCharacterId &&
      typeof character.name === 'string' &&
      Array.isArray(character.resources),
  )
}

export function loadTrackerFromStorage(userId = null) {
  if (typeof window === 'undefined') {
    return createDefaultTracker()
  }

  try {
    const storedTracker = window.localStorage.getItem(getTrackerStorageKey(userId))

    if (!storedTracker) {
      return createDefaultTracker()
    }

    const parsedTracker = JSON.parse(storedTracker)
    return isValidTracker(parsedTracker) ? parsedTracker : createDefaultTracker()
  } catch {
    return createDefaultTracker()
  }
}

export function saveTrackerToStorage(tracker, userId = null) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(getTrackerStorageKey(userId), JSON.stringify(tracker))
  } catch {
    // Storage can be unavailable in private browsing or when the device is full.
  }
}

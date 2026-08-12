import { useEffect, useRef, useState } from 'react'
import daggerHeader from './assets/dagger-header-v2.png'
import { createDefaultCharacter } from './data/defaultTracker'
import { loadTrackerFromCloud, saveTrackerToCloud } from './data/trackerCloud'
import {
  clearGuestTrackerStorage,
  isValidTracker,
  loadTrackerFromStorage,
  saveTrackerToStorage,
} from './data/trackerStorage'
import {
  clearWelcomeChoice,
  loadWelcomeChoice,
  saveWelcomeChoice,
} from './data/welcomeStorage'
import { AccountDialog } from './features/auth/AccountDialog'
import { WelcomeDialog } from './features/auth/WelcomeDialog'
import { useAuth } from './hooks/useAuth'

const maximumResourceSlots = 12

function getResourceValue(resource) {
  return resource.valueType === 'available' ? resource.current : resource.marked
}

function getMinimumResourceMaximum(resource) {
  return resource.id === 'armor' ? 0 : 1
}

function updateCharacterResource(character, resourceId, updateResource) {
  const updateResources = (resources = []) =>
    resources.map((resource) =>
      resource.id === resourceId ? updateResource(resource) : resource,
    )

  return {
    ...character,
    resources: updateResources(character.resources),
    customResources: updateResources(character.customResources),
  }
}

function createCustomResourceId() {
  return `custom-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`
}

function createCharacterId() {
  return `character-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`
}

function getCharacterDisplayName(character) {
  return character.name.trim() || 'Unnamed Character'
}

function copyTracker(tracker) {
  return globalThis.structuredClone
    ? globalThis.structuredClone(tracker)
    : JSON.parse(JSON.stringify(tracker))
}

export default function App() {
  const [tracker, setTracker] = useState(loadTrackerFromStorage)
  const [trackerOwner, setTrackerOwner] = useState('guest')
  const [syncError, setSyncError] = useState(null)
  const [isEditingMaximums, setIsEditingMaximums] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAddingTracker, setIsAddingTracker] = useState(false)
  const [isManagingCharacters, setIsManagingCharacters] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [hasCompletedWelcome, setHasCompletedWelcome] = useState(loadWelcomeChoice)
  const [characterPendingDeletion, setCharacterPendingDeletion] = useState(null)
  const [customTrackerName, setCustomTrackerName] = useState('')
  const [customTrackerMaximum, setCustomTrackerMaximum] = useState('6')
  const [customDialogViewport, setCustomDialogViewport] = useState(null)
  const editSnapshotRef = useRef(null)
  const menuRef = useRef(null)
  const {
    error: authError,
    loading: authLoading,
    passwordRecovery,
    setPasswordRecovery,
    user,
  } = useAuth()
  const activeCharacter = tracker.characters.find(
    (character) => character.id === tracker.activeCharacterId,
  )
  const characterName = activeCharacter.name
  const resources = [...activeCharacter.resources, ...(activeCharacter.customResources ?? [])]
  const shouldShowWelcome = !authLoading && !user && !hasCompletedWelcome
  const isTrackerReady =
    !authLoading && trackerOwner === (user?.id ?? 'guest')

  useEffect(() => {
    if (authLoading) return undefined

    let isCurrent = true
    const owner = user?.id ?? 'guest'

    async function loadTrackerForOwner() {
      if (!user) {
        setTracker(loadTrackerFromStorage())
        setTrackerOwner('guest')
        setSyncError(null)
        return
      }

      setTrackerOwner(null)
      setSyncError(null)

      try {
        const cloudTracker = await loadTrackerFromCloud(user.id)
        if (!isCurrent) return

        if (cloudTracker !== null && !isValidTracker(cloudTracker)) {
          throw new Error('The cloud tracker uses an unsupported data version.')
        }

        if (cloudTracker) {
          setTracker(cloudTracker)
        } else {
          const guestTracker = loadTrackerFromStorage()
          await saveTrackerToCloud(user.id, guestTracker)
          if (!isCurrent) return
          setTracker(guestTracker)
        }

        setTrackerOwner(owner)
      } catch {
        if (!isCurrent) return

        setTracker(loadTrackerFromStorage(user.id))
        setTrackerOwner(owner)
        setSyncError('Cloud sync is unavailable. Changes are saved on this device for now.')
      }
    }

    loadTrackerForOwner()

    return () => {
      isCurrent = false
    }
  }, [authLoading, user])

  useEffect(() => {
    if (authLoading) return undefined
    if (isEditingMaximums) return undefined

    const expectedOwner = user?.id ?? 'guest'
    if (trackerOwner !== expectedOwner) return undefined

    saveTrackerToStorage(tracker, user?.id)

    if (!user) return undefined

    const saveTimer = window.setTimeout(async () => {
      try {
        await saveTrackerToCloud(user.id, tracker)
        setSyncError(null)
      } catch {
        setSyncError('Cloud sync is unavailable. Changes are saved on this device for now.')
      }
    }, 500)

    return () => window.clearTimeout(saveTimer)
  }, [authLoading, isEditingMaximums, tracker, trackerOwner, user])

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined
    }

    function closeMenuOnOutsidePress(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    function closeMenuOnEscape(event) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeMenuOnOutsidePress)
    document.addEventListener('keydown', closeMenuOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeMenuOnOutsidePress)
      document.removeEventListener('keydown', closeMenuOnEscape)
    }
  }, [isMenuOpen])

  useEffect(() => {
    if (!isAddingTracker) return undefined

    function closeDialogOnEscape(event) {
      if (event.key === 'Escape') {
        closeCustomTrackerDialog()
      }
    }

    function updateCustomDialogViewport() {
      const viewport = window.visualViewport

      setCustomDialogViewport(
        viewport
          ? {
              height: `${viewport.height}px`,
              top: `${viewport.offsetTop}px`,
            }
          : null,
      )
    }

    document.addEventListener('keydown', closeDialogOnEscape)
    window.visualViewport?.addEventListener('resize', updateCustomDialogViewport)
    window.visualViewport?.addEventListener('scroll', updateCustomDialogViewport)
    updateCustomDialogViewport()

    return () => {
      document.removeEventListener('keydown', closeDialogOnEscape)
      window.visualViewport?.removeEventListener('resize', updateCustomDialogViewport)
      window.visualViewport?.removeEventListener('scroll', updateCustomDialogViewport)
      setCustomDialogViewport(null)
    }
  }, [isAddingTracker])

  useEffect(() => {
    if (!isManagingCharacters) return undefined

    function closeCharacterDialogOnEscape(event) {
      if (event.key === 'Escape') {
        setIsManagingCharacters(false)
      }
    }

    document.addEventListener('keydown', closeCharacterDialogOnEscape)
    return () => document.removeEventListener('keydown', closeCharacterDialogOnEscape)
  }, [isManagingCharacters])

  useEffect(() => {
    if (!characterPendingDeletion) return undefined

    function closeDeleteConfirmationOnEscape(event) {
      if (event.key === 'Escape') {
        setCharacterPendingDeletion(null)
      }
    }

    document.addEventListener('keydown', closeDeleteConfirmationOnEscape)
    return () => document.removeEventListener('keydown', closeDeleteConfirmationOnEscape)
  }, [characterPendingDeletion])

  function updateActiveCharacter(updateCharacter) {
    setTracker((currentTracker) => ({
      ...currentTracker,
      characters: currentTracker.characters.map((character) =>
        character.id === currentTracker.activeCharacterId
          ? updateCharacter(character)
          : character,
      ),
    }))
  }

  function selectResourceSlot(resourceId, slotNumber) {
    updateActiveCharacter((character) =>
      updateCharacterResource(character, resourceId, (resource) => {
        const valueKey = resource.valueType === 'available' ? 'current' : 'marked'
        const nextValue = getResourceValue(resource) === slotNumber ? slotNumber - 1 : slotNumber

        return { ...resource, [valueKey]: nextValue }
      }),
    )
  }

  function setResourceMaximum(resourceId, getRequestedMaximum) {
    updateActiveCharacter((character) =>
      updateCharacterResource(character, resourceId, (resource) => {
        if (resource.id !== resourceId || resource.id === 'hope') return resource

        const minimum = getMinimumResourceMaximum(resource)
        const requestedMaximum = getRequestedMaximum(resource)
        const nextMaximum = Math.min(
          maximumResourceSlots,
          Math.max(minimum, Number.isFinite(requestedMaximum) ? requestedMaximum : minimum),
        )
        const valueKey = resource.valueType === 'available' ? 'current' : 'marked'

        return {
          ...resource,
          max: nextMaximum,
          [valueKey]: Math.min(getResourceValue(resource), nextMaximum),
        }
      }),
    )
  }

  function addCustomTracker(event) {
    event.preventDefault()

    const name = customTrackerName.trim()
    const maximum = Math.min(
      maximumResourceSlots,
      Math.max(1, Number.parseInt(customTrackerMaximum, 10) || 1),
    )

    if (!name) return

    updateActiveCharacter((character) => ({
      ...character,
      customResources: [
        ...(character.customResources ?? []),
        {
          id: createCustomResourceId(),
          name,
          valueType: 'marked',
          marked: 0,
          max: maximum,
          slotShape: 'square',
          isCustom: true,
        },
      ],
    }))
    setCustomTrackerName('')
    setCustomTrackerMaximum('6')
    setIsAddingTracker(false)
  }

  function adjustCustomTrackerMaximum(amount) {
    const currentMaximum = Number.parseInt(customTrackerMaximum, 10) || 1
    const nextMaximum = Math.min(maximumResourceSlots, Math.max(1, currentMaximum + amount))
    setCustomTrackerMaximum(String(nextMaximum))
  }

  function closeCustomTrackerDialog() {
    setIsAddingTracker(false)
    setCustomTrackerName('')
    setCustomTrackerMaximum('6')
  }

  function removeCustomTracker(resourceId) {
    updateActiveCharacter((character) => ({
      ...character,
      customResources: (character.customResources ?? []).filter(
        (resource) => resource.id !== resourceId,
      ),
    }))
  }

  function switchCharacter(characterId) {
    setTracker((currentTracker) => ({
      ...currentTracker,
      activeCharacterId: characterId,
    }))
  }

  function addCharacter() {
    const characterId = createCharacterId()

    setTracker((currentTracker) => ({
      ...currentTracker,
      activeCharacterId: characterId,
      characters: [...currentTracker.characters, createDefaultCharacter(characterId)],
    }))
    setIsManagingCharacters(false)
  }

  function deleteCharacter(characterId) {
    setTracker((currentTracker) => {
      if (currentTracker.characters.length <= 1) {
        const defaultCharacterId = createCharacterId()

        return {
          ...currentTracker,
          activeCharacterId: defaultCharacterId,
          characters: [createDefaultCharacter(defaultCharacterId)],
        }
      }

      const characters = currentTracker.characters.filter(
        (character) => character.id !== characterId,
      )

      return {
        ...currentTracker,
        activeCharacterId:
          currentTracker.activeCharacterId === characterId
            ? characters[0].id
            : currentTracker.activeCharacterId,
        characters,
      }
    })
    setCharacterPendingDeletion(null)
    setIsEditingMaximums(false)
  }

  function completeWelcome(nextStep) {
    saveWelcomeChoice()
    setHasCompletedWelcome(true)

    if (nextStep === 'account') {
      setIsAccountOpen(true)
    }
  }

  function resetAfterSignOut() {
    clearGuestTrackerStorage()
    clearWelcomeChoice()
    setTracker(loadTrackerFromStorage())
    setTrackerOwner('guest')
    setHasCompletedWelcome(false)
    setIsAccountOpen(false)
  }

  function beginEditing() {
    editSnapshotRef.current = copyTracker(tracker)
    setIsEditingMaximums(true)
    setIsMenuOpen(false)
  }

  function saveEdits() {
    editSnapshotRef.current = null
    setIsEditingMaximums(false)
  }

  function cancelEdits() {
    if (editSnapshotRef.current) {
      setTracker(editSnapshotRef.current)
    }

    editSnapshotRef.current = null
    setIsAddingTracker(false)
    setCustomTrackerName('')
    setCustomTrackerMaximum('6')
    setIsEditingMaximums(false)
  }

  if (!isTrackerReady) {
    return (
      <main className="tracker-main min-h-screen" aria-busy="true">
        <span className="sr-only">Loading tracker</span>
      </main>
    )
  }

  return (
    <main
      className={`tracker-main min-h-screen px-2 py-3 sm:px-6 sm:py-5${isEditingMaximums ? ' has-edit-bar' : ''}`}
    >
      <section className="tracker-shell mx-auto max-w-2xl px-2 py-5 sm:px-6 sm:py-6">
        {!isEditingMaximums && (
          <div className="overflow-menu absolute top-2 right-2 z-20" ref={menuRef}>
            <button
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              aria-label="Open tracker menu"
              className="overflow-menu-toggle"
              onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>

            {isMenuOpen && (
              <div className="overflow-menu-panel" role="menu">
                <button
                  onClick={beginEditing}
                  role="menuitem"
                  type="button"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setIsManagingCharacters(true)
                    setIsMenuOpen(false)
                  }}
                  role="menuitem"
                  type="button"
                >
                  Characters
                </button>
                <button
                  onClick={() => {
                    setIsAccountOpen(true)
                    setIsMenuOpen(false)
                  }}
                  role="menuitem"
                  type="button"
                >
                  Account
                </button>
              </div>
            )}
          </div>
        )}

        <header className="text-center">
          <h1 className="sr-only">Daggerheart Stat Tracker</h1>
          <label className="sr-only" htmlFor="character-name">
            Character name
          </label>
          <input
            className="character-name w-full bg-transparent px-3 text-center text-[clamp(1.75rem,8vw,2.25rem)] tracking-wide outline-none transition-colors placeholder:text-[#aaa8c4] focus:text-[#e4ffff]"
            id="character-name"
            maxLength={80}
            onChange={(event) => {
              const name = event.target.value
              updateActiveCharacter((character) => ({ ...character, name }))
            }}
            placeholder="Character Name"
            type="text"
            value={characterName}
          />

          <div className="mt-1 flex items-center gap-3" aria-hidden="true">
            <span className="dagger-rule dagger-rule-left flex-1" />
            <img className="h-auto w-full max-w-40" src={daggerHeader} alt="" />
            <span className="dagger-rule dagger-rule-right flex-1" />
          </div>
        </header>

        <ul className="mt-6 grid grid-cols-1 gap-3" aria-label="Character resources">
          {resources.map((resource) => {
            const resourceValue = getResourceValue(resource)
            const minimumMaximum = getMinimumResourceMaximum(resource)
            const slotColumns = Math.max(1, Math.min(resource.max, 6))
            const slotTrackWidth = slotColumns * 44 + (slotColumns - 1) * 2

            return (
              <li
                className="resource-card px-2 py-4 font-semibold sm:px-4"
                key={resource.id}
              >
                {isEditingMaximums && resource.isCustom && (
                  <button
                    aria-label={`Remove ${resource.name} tracker`}
                    className="remove-custom-tracker absolute top-2 right-2 z-10"
                    onClick={() => removeCustomTracker(resource.id)}
                    type="button"
                  />
                )}

                <div
                  className={`relative z-1 flex items-baseline justify-between gap-4${isEditingMaximums && resource.isCustom ? ' pr-12' : ''}`}
                >
                  <h2 className="text-[clamp(1rem,4.5vw,1.125rem)] uppercase tracking-[0.12em]">
                    {resource.name}
                  </h2>
                  <span className="resource-count text-base font-normal">
                    {resourceValue} / {resource.max}
                  </span>
                </div>

                {isEditingMaximums && (
                  <div className="maximum-editor relative z-1">
                    <span className="maximum-editor-label">Maximum</span>
                    <span className="maximum-editor-connector" aria-hidden="true" />
                    {resource.id === 'hope' ? (
                      <span className="maximum-fixed">Fixed at 6</span>
                    ) : (
                      <div className="maximum-stepper">
                        <button
                          aria-label={`Decrease ${resource.name} maximum`}
                          disabled={resource.max <= minimumMaximum}
                          onClick={() =>
                            setResourceMaximum(resource.id, (currentResource) =>
                              currentResource.max - 1,
                            )
                          }
                          type="button"
                        >
                          −
                        </button>
                        <input
                          aria-label={`${resource.name} maximum`}
                          className="maximum-value"
                          inputMode="numeric"
                          onChange={(event) => {
                            const digits = event.target.value.replace(/\D/g, '')
                            const maximum = digits
                              ? Number.parseInt(digits, 10)
                              : minimumMaximum

                            setResourceMaximum(resource.id, () => maximum)
                          }}
                          onFocus={(event) => event.target.select()}
                          pattern="[0-9]*"
                          type="text"
                          value={resource.max}
                        />
                        <button
                          aria-label={`Increase ${resource.name} maximum`}
                          disabled={resource.max >= maximumResourceSlots}
                          onClick={() =>
                            setResourceMaximum(resource.id, (currentResource) =>
                              currentResource.max + 1,
                            )
                          }
                          type="button"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div
                  className="resource-slots relative z-1 mt-3"
                  style={{
                    '--slot-columns': slotColumns,
                    maxWidth: `${slotTrackWidth}px`,
                  }}
                >
                  {resource.max === 0 ? (
                    <span className="resource-empty text-base font-normal">No slots</span>
                  ) : (
                    Array.from({ length: resource.max }, (_, index) => {
                      const slotNumber = index + 1
                      const isActive = slotNumber <= resourceValue
                      const action = resource.valueType === 'available' ? 'Set' : 'Mark'

                      return (
                        <button
                          aria-label={`${action} ${resource.name} at ${slotNumber} of ${resource.max}`}
                          aria-pressed={isActive}
                          className={`stat-slot stat-slot-${resource.slotShape} stat-slot-${resource.id}${resource.isCustom ? ' stat-slot-custom' : ''}${isActive ? ' is-active' : ''}`}
                          disabled={isEditingMaximums}
                          key={slotNumber}
                          onClick={() => selectResourceSlot(resource.id, slotNumber)}
                          type="button"
                        >
                          {resource.slotShape === 'shield' && (
                            <svg
                              aria-hidden="true"
                              className="stat-slot-shield-icon"
                              focusable="false"
                              shapeRendering="geometricPrecision"
                              viewBox="0 0 40 40"
                            >
                              <defs>
                                <linearGradient
                                  id={`armor-slot-fill-${slotNumber}`}
                                  x1="7"
                                  x2="34"
                                  y1="5"
                                  y2="35"
                                  gradientUnits="userSpaceOnUse"
                                >
                                  <stop stopColor="#e9c66d" />
                                  <stop offset="0.76" stopColor="#75438e" />
                                </linearGradient>
                              </defs>
                              <path
                                className="stat-slot-shield-path"
                                d="M5.5 4.5h29l3.5 8-4 18L20 38 6 30.5l-4-18Z"
                                fill={
                                  isActive
                                    ? `url(#armor-slot-fill-${slotNumber})`
                                    : '#17184b'
                                }
                                vectorEffect="non-scaling-stroke"
                              />
                            </svg>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        {isEditingMaximums && (
          <button
            aria-label="Add custom tracker"
            className="edit-add-button relative z-10"
            onClick={() => setIsAddingTracker(true)}
            type="button"
          >
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}
      </section>

      {isEditingMaximums && (
        <button
          className="edit-delete-character-button"
          onClick={() => setCharacterPendingDeletion(activeCharacter)}
          type="button"
        >
          Delete character
        </button>
      )}

      {isAddingTracker && (
        <div
          className="tracker-dialog-backdrop custom-tracker-backdrop"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) closeCustomTrackerDialog()
          }}
          role="presentation"
          style={customDialogViewport ?? undefined}
        >
          <section
            aria-labelledby="custom-tracker-title"
            aria-modal="true"
            className="tracker-dialog custom-tracker-dialog has-close"
            role="dialog"
          >
            <button
              aria-label="Close custom tracker dialog"
              className="tracker-dialog-close"
              onClick={closeCustomTrackerDialog}
              type="button"
            />
            <h2 id="custom-tracker-title">Add Custom</h2>
            <form onSubmit={addCustomTracker}>
              <label htmlFor="custom-tracker-name">Name</label>
              <input
                autoFocus
                id="custom-tracker-name"
                maxLength={40}
                onChange={(event) => setCustomTrackerName(event.target.value)}
                placeholder="Focus"
                required
                type="text"
                value={customTrackerName}
              />

              <label htmlFor="custom-tracker-maximum">Maximum</label>
              <div className="custom-maximum-stepper">
                <button
                  aria-label="Decrease maximum"
                  disabled={(Number.parseInt(customTrackerMaximum, 10) || 1) <= 1}
                  onClick={() => adjustCustomTrackerMaximum(-1)}
                  type="button"
                >
                  −
                </button>
                <input
                  id="custom-tracker-maximum"
                  inputMode="numeric"
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, '')

                    if (!digits) {
                      setCustomTrackerMaximum('')
                      return
                    }

                    const maximum = Math.min(
                      maximumResourceSlots,
                      Math.max(1, Number.parseInt(digits, 10)),
                    )
                    setCustomTrackerMaximum(String(maximum))
                  }}
                  pattern="[0-9]*"
                  required
                  type="text"
                  value={customTrackerMaximum}
                />
                <button
                  aria-label="Increase maximum"
                  disabled={
                    (Number.parseInt(customTrackerMaximum, 10) || 1) >= maximumResourceSlots
                  }
                  onClick={() => adjustCustomTrackerMaximum(1)}
                  type="button"
                >
                  +
                </button>
              </div>

              <div className="tracker-dialog-actions">
                <button className="is-primary" type="submit">
                  Add
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isManagingCharacters && (
        <div
          className="tracker-dialog-backdrop"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsManagingCharacters(false)
            }
          }}
          role="presentation"
        >
          <section
            aria-labelledby="characters-title"
            aria-modal="true"
            className="tracker-dialog character-dialog has-close"
            role="dialog"
          >
            <button
              aria-label="Close character manager"
              className="tracker-dialog-close"
              onClick={() => setIsManagingCharacters(false)}
              type="button"
            />
            <h2 id="characters-title">Characters</h2>

            <ul className="character-list" aria-label="Saved characters">
              {tracker.characters.map((character) => {
                const isActive = character.id === tracker.activeCharacterId

                return (
                  <li className="character-list-item" key={character.id}>
                    <button
                      aria-current={isActive ? 'true' : undefined}
                      className="character-select-button"
                      onClick={() => switchCharacter(character.id)}
                      type="button"
                    >
                      <span>{getCharacterDisplayName(character)}</span>
                      {isActive && <span className="character-state">Current</span>}
                    </button>
                  </li>
                )
              })}
            </ul>

            <button className="character-add-button" onClick={addCharacter} type="button">
              + Add character
            </button>
          </section>
        </div>
      )}

      {characterPendingDeletion && (
        <div
          className="tracker-dialog-backdrop"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setCharacterPendingDeletion(null)
          }}
          role="presentation"
        >
          <section
            aria-labelledby="delete-character-title"
            aria-modal="true"
            className="tracker-dialog character-delete-confirmation has-close"
            role="alertdialog"
          >
            <button
              aria-label="Close delete confirmation"
              className="tracker-dialog-close"
              onClick={() => setCharacterPendingDeletion(null)}
              type="button"
            />
            <h2 id="delete-character-title">Delete character?</h2>
            <p>
              Delete “{getCharacterDisplayName(characterPendingDeletion)}”? This cannot be undone.
            </p>
            <div className="tracker-dialog-actions">
              <button onClick={() => setCharacterPendingDeletion(null)} type="button">
                Cancel
              </button>
              <button
                className="is-danger"
                onClick={() => deleteCharacter(characterPendingDeletion.id)}
                type="button"
              >
                Delete
              </button>
            </div>
          </section>
        </div>
      )}

      {shouldShowWelcome && (
        <WelcomeDialog
          onAccount={() => completeWelcome('account')}
          onGuest={() => completeWelcome('guest')}
        />
      )}

      {(isAccountOpen || passwordRecovery) && (
        <AccountDialog
          authError={authError}
          authLoading={authLoading}
          onClose={() => {
            setIsAccountOpen(false)
            if (passwordRecovery) setPasswordRecovery(false)
          }}
          onRecoveryComplete={() => setPasswordRecovery(false)}
          onSignedOut={resetAfterSignOut}
          passwordRecovery={passwordRecovery}
          syncError={syncError}
          user={user}
        />
      )}

      {isEditingMaximums && (
        <div className="edit-action-bar">
          <button
            className="edit-save-button"
            onClick={saveEdits}
            type="button"
          >
            Save changes
          </button>
          <button className="edit-cancel-button" onClick={cancelEdits} type="button">
            Cancel
          </button>
        </div>
      )}
    </main>
  )
}

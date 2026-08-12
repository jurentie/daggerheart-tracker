/* This project does not include the optional prop-types runtime package. */
/* eslint-disable react/prop-types */

export function WelcomeDialog({ onAccount, onGuest }) {
  return (
    <div className="tracker-dialog-backdrop welcome-backdrop" role="presentation">
      <section
        aria-labelledby="welcome-dialog-title"
        aria-modal="true"
        className="tracker-dialog welcome-dialog"
        role="dialog"
      >
        <p className="welcome-eyebrow">Daggerheart Stat Tracker</p>
        <h2 id="welcome-dialog-title">Welcome, adventurer!</h2>
        <p className="welcome-introduction">
          Sign in to keep your characters available across devices.
        </p>

        <button className="welcome-account-button" onClick={onAccount} type="button">
          Sign up or sign in
        </button>
        <button className="welcome-guest-button" onClick={onGuest} type="button">
          Continue as guest
        </button>
        <p className="welcome-caveat">
          Guest characters are saved only in this browser. They won’t sync to other devices and
          may be lost if browser data is cleared.
        </p>
      </section>
    </div>
  )
}

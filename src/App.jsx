const plannedResources = ['Hope', 'Stress', 'HP', 'Armor', 'Custom']

export default function App() {
  return (
    <main className="min-h-screen px-5 py-12 sm:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-lg flex-col justify-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
          Local setup ready
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-stone-50 sm:text-5xl">
          Daggerheart Tracker
        </h1>
        <p className="mt-5 max-w-md text-lg leading-8 text-stone-300">
          A quick, table-friendly way to track the resources that change most during play.
        </p>

        <ul className="mt-9 grid grid-cols-2 gap-3" aria-label="Planned resources">
          {plannedResources.map((resource) => (
            <li
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center font-semibold text-stone-100 shadow-sm"
              key={resource}
            >
              {resource}
            </li>
          ))}
        </ul>

        <p className="mt-8 text-sm text-stone-400">
          Next: build the first local, offline-friendly tracker.
        </p>
      </section>
    </main>
  )
}

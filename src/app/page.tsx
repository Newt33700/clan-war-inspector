const WEEKLY_BATTLES = 16;
const PREVIEW_BATTLES = 11;

const FOUNDATIONS = [
  'Next.js App Router, TypeScript strict, Tailwind CSS',
  'Vitest : 80 % de couverture globale, 100 % sur le domaine',
  'Stryker : 90 % de mutants tues sur le metier et le proxy',
  'ESLint et Prettier alignes, verifiables en une commande',
];

export default function HomePage() {
  const segments = Array.from({ length: WEEKLY_BATTLES }, (_, index) => index);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-12 px-6 py-20">
      <header className="space-y-4">
        <p className="text-royale-gold-400 text-xs font-semibold tracking-[0.35em] uppercase">
          Clash Royale &middot; Guerre de clan
        </p>
        <h1 className="text-royale-gold-400 font-display text-5xl leading-none sm:text-6xl">
          Clan War Inspector
        </h1>
        <p className="text-royale-parchment-dim max-w-xl text-lg">
          Seize combats par semaine, par joueur. Le tableau de bord dit qui les a joues,
          qui les a oublies, et depuis combien de semaines.
        </p>
      </header>

      <section
        aria-labelledby="preview-title"
        className="border-royale-blue-800 bg-royale-navy-900 space-y-4 rounded-xl border p-6"
      >
        <h2
          id="preview-title"
          className="text-royale-parchment font-display text-xl tracking-wide"
        >
          La jauge d assiduite
        </h2>
        <div
          role="img"
          aria-label={`${PREVIEW_BATTLES} combats sur ${WEEKLY_BATTLES}`}
          className="flex gap-1"
        >
          {segments.map((index) => (
            <span
              key={index}
              data-testid="battle-segment"
              className={`h-8 flex-1 rounded-sm ${
                index < PREVIEW_BATTLES ? 'bg-royale-gold-400' : 'bg-royale-red-700/60'
              }`}
            />
          ))}
        </div>
        <p className="text-royale-parchment-dim text-sm">
          Apercu avec des valeurs factices. Le calcul reel arrive avec l US 4.2.
        </p>
      </section>

      <section aria-labelledby="foundations-title" className="space-y-3">
        <h2
          id="foundations-title"
          className="text-royale-parchment font-display text-xl tracking-wide"
        >
          Socle en place
        </h2>
        <ul className="text-royale-parchment-dim space-y-2">
          {FOUNDATIONS.map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden="true" className="text-royale-green-500">
                &#10003;
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

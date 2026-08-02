import { ClanDashboard } from './components/clan-dashboard';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-12">
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

      <ClanDashboard />
    </main>
  );
}

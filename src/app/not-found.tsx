import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-royale-gold-400 font-display text-7xl">404</p>
      <h1 className="text-royale-parchment font-display text-2xl tracking-wide">
        Cette page a deserte le champ de bataille
      </h1>
      <p className="text-royale-parchment-dim">
        Elle n a pas joue ses 16 combats non plus. Retournez au tableau de bord pour
        inspecter votre clan.
      </p>
      <Link
        href="/"
        className="bg-royale-gold-400 text-royale-navy-950 rounded-md px-4 py-2 font-semibold"
      >
        Retour au dashboard
      </Link>
    </main>
  );
}

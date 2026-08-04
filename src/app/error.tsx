'use client';

/**
 * Filet de securite global : une erreur de rendu inattendue affiche un
 * ecran thematise avec possibilite de reessayer, plutot qu'une page
 * blanche. Les erreurs metier (proxy, reseau) restent gerees localement
 * par les sections du dashboard.
 */

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-display text-royale-red-700 text-5xl">Defaite !</p>
      <h1 className="text-royale-parchment font-display text-2xl tracking-wide">
        Une erreur inattendue a fait tomber la tour
      </h1>
      <p className="text-royale-parchment-dim">
        Rien de definitif : relancez la partie. Si l erreur persiste, verifiez la
        configuration du serveur (cle API Supercell).
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-royale-gold-400 text-royale-navy-950 rounded-md px-4 py-2 font-semibold"
      >
        Reessayer
      </button>
    </main>
  );
}

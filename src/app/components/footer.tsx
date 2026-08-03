/**
 * Pied de page legal (US 13.3) : mention obligatoire de non-affiliation a
 * Supercell, affichee sur toutes les pages. `pb-tab-bar` (comme `main` dans
 * `layout.tsx`) evite que le texte ne soit masque par la MobileTabBar fixe.
 */

export function Footer() {
  return (
    <footer className="bg-slate-900 pb-tab-bar px-6 py-4 text-xs text-slate-400 md:pb-4">
      <p className="mx-auto max-w-4xl">
        Ce contenu n&apos;est pas affilié, soutenu, sponsorisé ou spécifiquement approuvé par
        Supercell et Supercell n&apos;en est pas responsable. Pour plus d&apos;informations,
        veuillez consulter la politique relative aux contenus de fans de Supercell :{' '}
        <a
          href="https://www.supercell.com/fan-content-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-slate-300"
        >
          www.supercell.com/fan-content-policy
        </a>
        .
      </p>
    </footer>
  );
}

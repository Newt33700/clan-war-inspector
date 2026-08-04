import { KofiButton } from './kofi-button';

/**
 * Pied de page legal (US 13.3) : mention obligatoire de non-affiliation a
 * Supercell, affichee sur toutes les pages. `pb-tab-bar` (comme `main` dans
 * `layout.tsx`) evite que le texte ne soit masque par la MobileTabBar fixe.
 */

export function Footer() {
  return (
    <footer className="pb-tab-bar bg-slate-900 px-6 py-4 text-xs text-slate-400 md:pb-4">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3">
        <KofiButton />
        <p>
          Ce contenu n&apos;est pas affilié, soutenu, sponsorisé ou spécifiquement
          approuvé par Supercell et Supercell n&apos;en est pas responsable. Pour plus
          d&apos;informations, veuillez consulter la politique relative aux contenus de
          fans de Supercell :{' '}
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
      </div>
    </footer>
  );
}

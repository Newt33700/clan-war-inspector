/**
 * Lien vers la page Ko-fi du projet, style sobre plutot que le widget
 * script officiel (Widget_2.js) : ce dernier injecte son bouton via
 * `document.write`, ce qui efface toute la page une fois appele apres le
 * chargement initial -- systematique sur une SPA React/Next.js ou le script
 * ne se charge qu'apres l'hydratation. Un simple lien evite ce risque.
 */

const KOFI_URL = 'https://ko-fi.com/clanwarinspector';

export function KofiButton({ className = '' }: { className?: string }) {
  return (
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-md border border-amber-700/40 bg-amber-800/20 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-800/40 ${className}`}
    >
      <span aria-hidden="true">☕</span>
      Faire un don sur Ko-fi
    </a>
  );
}

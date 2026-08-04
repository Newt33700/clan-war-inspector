'use client';

/**
 * Carte membre mobile en accordeon (Navigation Mobile "Tactile") :
 * l'etat ferme n'affiche plus que le pseudo et le role (etiquette
 * couleur) pour scroller vite dans une longue liste, le detail
 * (tag, trophees, dons) ne se deplie qu'au tap. Contrairement au tableau
 * desktop (inchange), le contenu deplie n'est monte dans le DOM que si
 * `isOpen`, pour ne rien charger d'inutile dans la liste fermee.
 *
 * L'API Supercell n'expose pas d'icone de ligue par membre (seulement au
 * niveau du clan) : comme pour le Hall of Fame, l'avatar generique
 * (initiales) remplace l'icone de ligue absente des donnees.
 */

import { useState } from 'react';
import type { ClanMember } from '@/domain/clan/members';
import { TrophyIcon } from './section-icons';
import { useTranslations } from './i18n/locale-provider';

/** Asset RoyaleAPI : icone de dons a cote du decompte. */
const DONATION_ICON_URL = 'https://cdn.royaleapi.com/static/img/ui/cards.png';

const ROLE_BADGE_CLASSES: Record<ClanMember['role'], string> = {
  leader: 'bg-cr-gold text-royale-navy-950',
  coLeader: 'bg-cr-blue text-white',
  elder: 'bg-royale-purple-500 text-white',
  member: 'bg-slate-300 text-slate-700',
};

interface PlayerAccordionItemProps {
  member: ClanMember;
  /** Ouvre le panneau d'inspection complet du joueur (US 9), depuis le
   *  detail deplie. */
  onSelectMember: (tag: string) => void;
}

export function PlayerAccordionItem({
  member,
  onSelectMember,
}: PlayerAccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslations();

  return (
    <li data-testid="member-card" className="cr-pill-row overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex h-16 w-full items-center gap-3 px-4 text-left"
      >
        <span
          aria-hidden="true"
          className="bg-royale-navy-900 font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        >
          {member.name.slice(0, 2).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-display block truncate font-semibold text-slate-900">
            {member.name}
          </span>
          <span
            className={`mt-0.5 inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${ROLE_BADGE_CLASSES[member.role]}`}
          >
            {t(`roles.${member.role}`)}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`shrink-0 text-lg font-black text-slate-900 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>

      <div
        className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          {isOpen && (
            <div className="grid grid-cols-3 gap-2 border-t border-black/10 bg-slate-200 px-4 py-3 text-center text-xs">
              <div>
                <p className="text-slate-500 uppercase">{t('membersTable.tag')}</p>
                <p className="text-slate-900">{member.tag}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase">{t('membersTable.trophies')}</p>
                <p className="font-display flex items-center justify-center gap-1 text-slate-900 tabular-nums">
                  <TrophyIcon className="text-cr-gold h-4 w-4" />
                  {member.trophies}
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase">{t('membersTable.donations')}</p>
                <p className="font-display flex items-center justify-center gap-1 text-slate-900 tabular-nums">
                  <img
                    src={DONATION_ICON_URL}
                    alt=""
                    aria-hidden="true"
                    className="h-4 w-4"
                  />
                  {member.donations}
                </p>
              </div>
              <div className="col-span-3 pt-1">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectMember(member.tag);
                  }}
                  className="font-display text-cr-blue text-xs font-semibold hover:underline"
                >
                  {t('membersTable.viewProfile')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

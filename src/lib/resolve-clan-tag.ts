/**
 * Resolution du tag de clan actif pour un Server Component de route
 * (US 13.2, Epique 13) : le parametre d'URL `?clan=` reste prioritaire sur
 * le cookie (US 13.1), exactement comme l'URL primait sur le localStorage
 * dans l'ancien `ClanDashboard` (US 6.2).
 */

import { isValidClanTag, normalizeClanTag } from '@/domain/clan/clan-tag';
import { readClanTagFromCookies } from './clan-tag-server';

export interface ClanTagSearchParams {
  clan?: string | string[];
}

/** Resout le tag actif : `?clan=` d'abord, puis le cookie, sinon `null`. */
export async function resolveActiveClanTag(
  searchParams: ClanTagSearchParams,
): Promise<string | null> {
  const raw = Array.isArray(searchParams.clan) ? searchParams.clan[0] : searchParams.clan;
  if (raw !== undefined && isValidClanTag(raw)) {
    return normalizeClanTag(raw);
  }
  return readClanTagFromCookies();
}

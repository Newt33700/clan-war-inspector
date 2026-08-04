import { proxyPlayerBattlelog } from '../../../_lib/supercell';

/** GET /api/players/{playerTag}/battlelog - combats recents (retour utilisateur 2026-08-04). */
export async function GET(
  _request: Request,
  context: { params: Promise<{ playerTag: string }> },
): Promise<Response> {
  const { playerTag } = await context.params;
  return proxyPlayerBattlelog(playerTag);
}

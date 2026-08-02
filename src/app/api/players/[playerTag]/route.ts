import { proxyPlayerResource } from '../../_lib/supercell';

/** GET /api/players/{playerTag} - profil detaille d'un joueur (US 9). */
export async function GET(
  _request: Request,
  context: { params: Promise<{ playerTag: string }> },
): Promise<Response> {
  const { playerTag } = await context.params;
  return proxyPlayerResource(playerTag);
}

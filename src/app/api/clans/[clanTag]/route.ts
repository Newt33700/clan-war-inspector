import { proxyClanResource } from '../../_lib/supercell';

/** GET /api/clans/{clanTag} - informations et membres du clan. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ clanTag: string }> },
): Promise<Response> {
  const { clanTag } = await context.params;
  return proxyClanResource(clanTag, '');
}

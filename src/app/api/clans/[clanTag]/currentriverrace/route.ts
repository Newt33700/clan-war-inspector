import { proxyClanResource } from '../../../_lib/supercell';

/** GET /api/clans/{clanTag}/currentriverrace - guerre en cours. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ clanTag: string }> },
): Promise<Response> {
  const { clanTag } = await context.params;
  return proxyClanResource(clanTag, '/currentriverrace');
}

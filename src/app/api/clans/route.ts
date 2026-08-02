import { proxyClanSearch } from '../_lib/supercell';

/** GET /api/clans?name=... - recherche de clan par nom (US 10.1). */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') ?? '';
  return proxyClanSearch(name);
}

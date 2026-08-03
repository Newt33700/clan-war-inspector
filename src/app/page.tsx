import { redirect } from 'next/navigation';

/**
 * Racine du site (US 13.2, Epique 13) : redirige inconditionnellement
 * vers /dashboard, qui resout lui-meme le clan actif (URL > cookie).
 */
export default function HomePage() {
  redirect('/dashboard');
}

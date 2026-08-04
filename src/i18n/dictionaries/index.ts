import type { Locale } from '../locale';
import fr, { type Dictionary } from './fr';
import en from './en';
import it from './it';
import es from './es';

export type { Dictionary };

export const dictionaries: Record<Locale, Dictionary> = { fr, en, it, es };

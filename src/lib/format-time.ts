/**
 * Formatage d'horodatage (US 6.4) : heure locale HH:MM, sans dependance
 * a l'Intl locale du navigateur pour rester previsible en test.
 */

function twoDigits(value: number): string {
  return value.toString().padStart(2, '0');
}

/** Formate une date en heure locale `HH:MM`. */
export function formatTimeOfDay(date: Date): string {
  return `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`;
}

/**
 * Calcul de contraste WCAG 2.x (US 6.8) : formule officielle de luminance
 * relative et de ratio de contraste, utilisee pour verifier que les tokens
 * du theme restent lisibles (AA, >= 4.5:1 pour du texte de taille normale).
 */

function toLinearChannel(value: number): number {
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/** Luminance relative d'une couleur hexadecimale (`#rrggbb`), entre 0 et 1. */
export function relativeLuminance(hex: string): number {
  const value = hex.replace('#', '');
  const r = toLinearChannel(Number.parseInt(value.slice(0, 2), 16) / 255);
  const g = toLinearChannel(Number.parseInt(value.slice(2, 4), 16) / 255);
  const b = toLinearChannel(Number.parseInt(value.slice(4, 6), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ratio de contraste WCAG entre deux couleurs, toujours >= 1. */
export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

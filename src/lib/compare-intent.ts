/**
 * Rule-of-thumb detection for destination indecision / comparison intent.
 * When false, suggestions behaviour is unchanged.
 */

const INDECISION_PATTERNS = [
  /\bvs\.?\b/i,
  /\bversus\b/i,
  /haven'?t decided/i,
  /\bnot sure\b/i,
  /\bundecided\b/i,
  /can'?t decide/i,
  /can'?t choose/i,
  /still deciding/i,
  /maybe both\b/i,
  /\bboth countries\b/i,
  /\bone deep or\b/i,
  /\beither\b.+\bor\b/i,
];

/** "Costa Rica or Nicaragua", "Paris vs Rome", etc. */
const OR_BETWEEN_PLACES = /\b([A-Za-z][A-Za-z\s,'-]{1,40})\s+(?:or|vs\.?|versus)\s+([A-Za-z][A-Za-z\s,'-]{1,40})\b/;

function combinedText(
  additionalDetails: string | null | undefined,
  destination: string | null | undefined
): string {
  return [additionalDetails, destination].filter(Boolean).join(' ').trim();
}

export function hasCompareIntent(
  additionalDetails: string | null | undefined,
  destination?: string | null | undefined
): boolean {
  const text = combinedText(additionalDetails, destination);
  if (!text) return false;

  const hasIndecisionPhrase = INDECISION_PATTERNS.some((p) => p.test(text));
  const orMatch = text.match(OR_BETWEEN_PLACES);
  const hasOrBetweenPlaces =
    !!orMatch &&
    orMatch[1].trim().split(/\s+/).length >= 1 &&
    orMatch[2].trim().split(/\s+/).length >= 1;

  if (hasOrBetweenPlaces && (hasIndecisionPhrase || /\bor\b|\bvs\b|\bversus\b/i.test(text))) {
    return true;
  }

  if (hasIndecisionPhrase && hasOrBetweenPlaces) {
    return true;
  }

  // "haven't decided, maybe both" without explicit "X or Y" still counts if "both" + place names appear
  if (/\bboth\b/i.test(text) && hasIndecisionPhrase && hasOrBetweenPlaces) {
    return true;
  }

  return hasOrBetweenPlaces && /\b(haven'?t decided|not sure|undecided|maybe both|one deep)\b/i.test(text);
}

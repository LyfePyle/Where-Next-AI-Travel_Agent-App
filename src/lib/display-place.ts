/**
 * Readable place names for Book-tab labels.
 * Stored stops are often the raw typed string ("puerto escondido").
 */

const SMALL_WORDS = new Set([
  'de',
  'del',
  'da',
  'das',
  'do',
  'dos',
  'la',
  'las',
  'los',
  'el',
  'y',
  'of',
  'the',
  'and',
  'van',
  'von',
  'di',
  'du',
]);

/**
 * Capitalize a place that was stored in lowercase.
 * Leaves tokens that already contain a capital ("Bali", "USA") alone.
 * Particles stay lower ("Oaxaca de Juarez") unless they follow a comma
 * ("San Salvador, El Salvador").
 */
export function titleCasePlace(input: string): string {
  let capNext = true;
  let out = '';
  const re = /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’.-]*)|([^A-Za-zÀ-ÿ]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(input))) {
    const word = match[1];
    const gap = match[2];
    if (gap) {
      out += gap;
      if (/[,/]/.test(gap)) capNext = true;
      continue;
    }
    if (/[A-Z]/.test(word)) {
      out += word;
    } else if (!capNext && SMALL_WORDS.has(word.toLowerCase())) {
      out += word.toLowerCase();
    } else {
      const lower = word.toLowerCase();
      out += lower.charAt(0).toUpperCase() + lower.slice(1);
    }
    capNext = false;
  }
  return out;
}

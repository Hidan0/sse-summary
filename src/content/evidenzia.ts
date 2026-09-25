/*
 * Normalizzazione ed evidenziazione delle parole cercate. Senza MiniSearch, così le pagine
 * che evidenziano i risultati (`MarkdownContent`) non scaricano anche il motore di ricerca.
 */

/*
 * Parole troppo comuni per essere utili: senza, "la" troverebbe per prefisso mezzo corso.
 */
const STOPWORDS = new Set([
    "a", "ad", "al", "alla", "alle", "agli", "ai", "col", "con", "da", "dal", "dalla", "dalle", "dai", "degli",
    "dei", "del", "della", "delle", "dello", "di", "e", "ed", "gli", "i", "il", "in", "l", "la", "le", "lo", "ma",
    "nel", "nella", "nelle", "nei", "negli", "o", "per", "se", "si", "su", "sul", "sulla", "tra", "fra", "un",
    "una", "uno", "che", "non", "come"
]);

export function normalizza(text: string): string
{
    return text.normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase();
}

export function processTerm(term: string): string | null
{
    const parola = normalizza(term);

    return STOPWORDS.has(parola) ? null : parola;
}

/*
 * Le parole di una query, normalizzate e senza parole vuote: servono a evidenziare i risultati e le pagine.
 */
export function paroleQuery(query: string): string[]
{
    return query.split(/[^\p{L}\p{N}]+/u)
        .map((parola) => processTerm(parola))
        .filter((parola): parola is string => !!parola && parola.length >= 2);
}

export interface PezzoTesto
{
    testo: string;
    evidenziato: boolean;
}

/*
 * Divide un testo in pezzi, evidenziando le parole che iniziano con una delle parole cercate.
 */
export function evidenzia(testo: string, parole: string[]): PezzoTesto[]
{
    const pezzi: PezzoTesto[] = [];
    let ultimo = 0;

    for (const match of testo.matchAll(/[\p{L}\p{N}]+/gu))
    {
        const parola = normalizza(match[0]);
        if (!parole.some((cercata) => parola.startsWith(cercata))) { continue; }

        if (match.index > ultimo) { pezzi.push({ testo: testo.slice(ultimo, match.index), evidenziato: false }); }
        pezzi.push({ testo: match[0], evidenziato: true });
        ultimo = match.index + match[0].length;
    }
    if (ultimo < testo.length) { pezzi.push({ testo: testo.slice(ultimo), evidenziato: false }); }

    return pezzi;
}

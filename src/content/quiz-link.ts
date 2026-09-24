import type { LocationQuery, LocationQueryRaw } from "vue-router";

/*
 * Codifica di un quiz nei parametri di un link, per condividerlo senza backend.
 *
 * - `m`: modalità (`s` simulazione, `a` allenamento)
 * - `q`: id delle domande, nell'ordine in cui sono state proposte, separati da `.`
 * - `o`: ordine delle opzioni di ogni domanda, un carattere in base 36 (indice della permutazione)
 * - `r`: risposta data a ogni domanda (posizione mostrata, `-` se non data); solo per i risultati
 * - `t`: durata in secondi; `p`: risposte corrette di chi condivide
 */
export const VERSIONE_LINK = "1";

export type ModalitaCondivisa = "simulazione" | "allenamento";

export interface QuizCondiviso
{
    modalita: ModalitaCondivisa;
    ids: string[];
    ordini: number[][];
    risposte?: (number | null)[];
    durata?: number;
    corrette?: number;
}

function fattoriale(n: number): number
{
    return (n <= 1) ? 1 : n * fattoriale(n - 1);
}

/*
 * Indice lessicografico di una permutazione di `0..n-1` e viceversa.
 */
function permutazioneInIndice(permutazione: number[]): number
{
    const restanti = [...permutazione].sort((a, b) => a - b);

    return permutazione.reduce((indice, valore, posizione) =>
    {
        const rango = restanti.indexOf(valore);
        restanti.splice(rango, 1);

        return indice + (rango * fattoriale(permutazione.length - posizione - 1));

    }, 0);
}
function indiceInPermutazione(indice: number, n: number): number[]
{
    const restanti = Array.from({ length: n }, (_, value) => value);
    const risultato: number[] = [];

    let resto = indice;
    for (let posizione = n; posizione > 0; posizione -= 1)
    {
        const blocco = fattoriale(posizione - 1);
        risultato.push(restanti.splice(Math.floor(resto / blocco), 1)[0]);
        resto %= blocco;
    }

    return risultato;
}

export function codificaQuiz(quiz: QuizCondiviso): LocationQueryRaw
{
    const query: LocationQueryRaw = {
        v: VERSIONE_LINK,
        m: (quiz.modalita === "simulazione") ? "s" : "a",
        q: quiz.ids.join("."),
        o: quiz.ordini.map((ordine) => permutazioneInIndice(ordine).toString(36)).join("")
    };

    if (quiz.risposte)
    {
        query.r = quiz.risposte.map((risposta) => ((risposta === null) ? "-" : String(risposta))).join("");
    }
    if (quiz.durata !== undefined) { query.t = String(Math.floor(quiz.durata)); }
    if (quiz.corrette !== undefined) { query.p = String(quiz.corrette); }

    return query;
}

/*
 * Gli ordini delle opzioni restano codificati: per ricostruirli serve il numero di opzioni di ogni domanda,
 * noto solo dopo averle caricate (vedi `decodificaOrdine`).
 */
export interface QuizLinkDecodificato extends Omit<QuizCondiviso, "ordini">
{
    ordini: string;
}

/*
 * Restituisce `undefined` se il link è incompleto o malformato.
 */
export function decodificaQuiz(query: LocationQuery): QuizLinkDecodificato | undefined
{
    const testo = (key: string) => ((typeof query[key] === "string") ? query[key] as string : undefined);

    const ids = testo("q")?.split(".")
        .filter(Boolean);
    const ordini = testo("o");
    const valido = (testo("v") === VERSIONE_LINK) && ids?.length && ordini && (ordini.length === ids.length);
    if (!valido) { return undefined; }

    const risposteTesto = testo("r");
    if (risposteTesto && (risposteTesto.length !== ids.length)) { return undefined; }

    const numero = (key: string) =>
    {
        const value = Number(testo(key));

        return (testo(key) !== undefined) && Number.isInteger(value) && (value >= 0) ? value : undefined;
    };

    return {
        modalita: (testo("m") === "s") ? "simulazione" : "allenamento",
        ids: ids,
        ordini: ordini,
        risposte: risposteTesto?.split("").map((carattere) => ((carattere === "-") ? null : Number(carattere))),
        durata: numero("t"),
        corrette: numero("p")
    };
}

export function decodificaOrdine(carattere: string, opzioni: number): number[] | undefined
{
    const indice = parseInt(carattere, 36);
    if (Number.isNaN(indice) || (indice >= fattoriale(opzioni))) { return undefined; }

    return indiceInPermutazione(indice, opzioni);
}

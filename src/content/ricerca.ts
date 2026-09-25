import MiniSearch from "minisearch";
import type { SearchResult } from "minisearch";

import { normalizza, processTerm } from "./evidenzia";

export { evidenzia, normalizza, paroleQuery } from "./evidenzia";
export type { PezzoTesto } from "./evidenzia";

export type TipoDocumento = "glossario" | "riassunto" | "abcde";

/*
 * Un documento è una sezione di un riassunto o di una scheda ABCDE, oppure una voce del glossario.
 * `link` è il percorso del router (con l'eventuale `#ancora`).
 */
export interface DocumentoRicerca
{
    id: string;
    tipo: TipoDocumento;
    titolo: string;
    sezione: string;
    termini: string;
    testo: string;
    modulo: string;
    capitolo: string;
    link: string;
}

export interface RisultatoRicerca extends DocumentoRicerca
{
    punteggio: number;
    parole: string[];
}

const CAMPI = ["termini", "sezione", "titolo", "testo"];

export function creaIndice(documenti: DocumentoRicerca[]): MiniSearch<DocumentoRicerca>
{
    const indice = new MiniSearch<DocumentoRicerca>({
        fields: CAMPI,
        storeFields: ["tipo", "titolo", "sezione", "termini", "testo", "modulo", "capitolo", "link"],
        processTerm: processTerm
    });
    indice.addAll(documenti);

    return indice;
}

/*
 * Ricerca per prefisso dalla terza lettera e tolleranza agli errori di battitura solo per le parole lunghe,
 * così le sigle ("PLS", "CTE") non trovano parole simili per caso. Tutte le parole devono comparire.
 */
export function cerca(indice: MiniSearch<DocumentoRicerca>, query: string): RisultatoRicerca[]
{
    const risultati: SearchResult[] = indice.search(query, {
        boost: { termini: 4, sezione: 2, titolo: 1.5 },
        prefix: (term) => term.length >= 3,
        fuzzy: (term) => ((term.length >= 5) ? 0.2 : false),
        combineWith: "AND",
        boostDocument: (id, term, stored) => ((stored?.tipo === "glossario") ? 1.5 : 1)
    });

    return risultati.map((risultato) => ({
        ...(risultato as unknown as DocumentoRicerca),
        id: String(risultato.id),
        punteggio: risultato.score,
        parole: risultato.terms
    }));
}

/*
 * Un estratto del testo attorno alla prima parola trovata.
 */
export function frammento(testo: string, parole: string[], lunghezza = 160): string
{
    const normalizzato = normalizza(testo);
    const posizioni = parole
        .map((parola) => normalizzato.search(new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(parola)}`, "u")))
        .filter((posizione) => posizione >= 0);

    if (!posizioni.length || (testo.length <= lunghezza)) { return tronca(testo, lunghezza); }

    let inizio = Math.max(0, Math.min(...posizioni) - Math.floor(lunghezza / 3));
    const spazio = testo.indexOf(" ", inizio);
    if ((inizio > 0) && (spazio >= 0) && (spazio - inizio < 20)) { inizio = spazio + 1; }

    return `${inizio > 0 ? "… " : ""}${tronca(testo.slice(inizio), lunghezza)}`;
}

function tronca(testo: string, lunghezza: number): string
{
    if (testo.length <= lunghezza) { return testo; }

    const taglio = testo.lastIndexOf(" ", lunghezza);

    return `${testo.slice(0, (taglio > lunghezza / 2) ? taglio : lunghezza)} …`;
}

function escapeRegExp(text: string): string
{
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

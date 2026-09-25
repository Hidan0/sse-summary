import type { RouteLocationRaw } from "vue-router";

import { riassuntiBySlug } from "./index";
import type { ArgomentoQuiz, Domanda, LivelloQuiz, QuizMeta, QuizModule } from "./types";

export const LIVELLI: { id: LivelloQuiz, nome: string, descrizione: string }[] = [
    { id: "base", nome: "Base", descrizione: "Nozioni e definizioni, nello stile dei pre-esami" },
    { id: "esame", nome: "Esame", descrizione: "Casi, distrattori plausibili, domande \"tranne\"" },
    { id: "numeri", nome: "Numeri", descrizione: "Percentuali, soglie, tempi e rapporti" }
];

/*
 * Regole della simulazione, come all'esame: 30 domande, alla quinta risposta sbagliata non si passa.
 */
export const SIMULAZIONE = { domande: 30, erroriMassimi: 5 };

const quizMeta = import.meta.glob<QuizMeta>("./quiz/*.yaml", { query: "?meta", import: "default", eager: true });
const quizFull = import.meta.glob<QuizModule>("./quiz/*.yaml", { import: "default" });

export const argomentiQuiz: ArgomentoQuiz[] = Object.entries(quizMeta)
    .map(([path, meta]) => ({
        ...meta,
        slug: path.slice(path.lastIndexOf("/") + 1, -".yaml".length),
        load: quizFull[path]
    }))
    .sort((a, b) => a.modulo.localeCompare(b.modulo) || (a.ordine - b.ordine));

export interface DomandaConArgomento extends Domanda
{
    argomento: ArgomentoQuiz;
}

export async function loadDomande(argomenti: ArgomentoQuiz[]): Promise<DomandaConArgomento[]>
{
    const moduli = await Promise.all(argomenti.map((argomento) => argomento.load()));

    return moduli.flatMap((modulo, index) => modulo.domande
        .map((domanda) => ({ ...domanda, argomento: argomenti[index] })));
}

/*
 * Una domanda pronta per essere proposta: `ordine[i]` è l'indice originale dell'opzione mostrata in posizione `i`.
 */
export interface DomandaSessione extends DomandaConArgomento
{
    ordine: number[];
}

/*
 * Mescola le domande e l'ordine delle opzioni. Con `fissa` l'ordine resta quello scritto
 * (es. opzioni tipo "tutte le precedenti").
 */
export function preparaDomande(lista: DomandaConArgomento[]): DomandaSessione[]
{
    return shuffle(lista).map((domanda) =>
    {
        const ordine = domanda.opzioni.map((_, index) => index);

        return { ...domanda, ordine: domanda.fissa ? ordine : shuffle(ordine) };
    });
}

export async function estraiSimulazione(argomenti: ArgomentoQuiz[]): Promise<DomandaSessione[]>
{
    return preparaDomande(shuffle(await loadDomande(argomenti)).slice(0, SIMULAZIONE.domande));
}

/*
 * Carica le domande indicate, nell'ordine dato. Gli id non più presenti (domande rimosse) restano `undefined`.
 */
export async function loadDomandePerId(ids: string[]): Promise<(DomandaConArgomento | undefined)[]>
{
    const tutte = new Map((await loadDomande(argomentiQuiz)).map((domanda) => [domanda.id, domanda]));

    return ids.map((id) => tutte.get(id));
}

/*
 * Link alla sezione del riassunto da ripassare per una domanda.
 */
export function ripassoDomanda(domanda: Domanda): { to: RouteLocationRaw, titolo: string } | undefined
{
    if (!domanda.ripasso) { return undefined; }

    const [slug, sezione] = domanda.ripasso.split("#");
    const riassunto = riassuntiBySlug.get(slug);
    if (!riassunto) { return undefined; }

    return {
        to: { name: "riassunto", params: { slug: slug }, hash: sezione ? `#${sezione}` : "" },
        titolo: riassunto.titolo
    };
}

export function formatDurata(secondi: number): string
{
    const totale = Math.max(0, Math.floor(secondi));

    return `${Math.floor(totale / 60)}:${String(totale % 60).padStart(2, "0")}`;
}

export function shuffle<T>(values: T[]): T[]
{
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1)
    {
        const other = Math.floor(Math.random() * (index + 1));
        [result[index], result[other]] = [result[other], result[index]];
    }

    return result;
}

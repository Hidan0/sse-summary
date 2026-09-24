import type { ArgomentoQuiz, Domanda, LivelloQuiz, QuizMeta, QuizModule } from "./types";

export const LIVELLI: { id: LivelloQuiz, nome: string, descrizione: string }[] = [
    { id: "base", nome: "Base", descrizione: "Nozioni e definizioni, nello stile dei pre-esami" },
    { id: "esame", nome: "Esame", descrizione: "Casi, distrattori plausibili, domande \"tranne\"" },
    { id: "numeri", nome: "Numeri", descrizione: "Percentuali, soglie, tempi e rapporti" }
];

/*
 * Regole della simulazione, come all'esame: 30 domande, alla quinta risposta sbagliata non si passa.
 */
export const SIMULAZIONE = { domande: 30, erroriMassimi: 4 };

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

import { describe, expect, it } from "vitest";
import type { LocationQuery } from "vue-router";

import { codificaQuiz, decodificaOrdine, decodificaQuiz } from "@/content/quiz-link";

function permutazioni(n: number): number[][]
{
    if (n === 1) { return [[0]]; }

    return permutazioni(n - 1).flatMap((permutazione) => Array.from({ length: n }, (_, posizione) =>
    {
        const nuova = permutazione.map((valore) => valore + 1);
        nuova.splice(posizione, 0, 0);

        return nuova;
    }));
}

describe("Link dei quiz condivisi", () =>
{
    it("codificano e decodificano ogni ordine delle opzioni (3 e 4 opzioni)", () =>
    {
        for (const n of [3, 4])
        {
            for (const ordine of permutazioni(n))
            {
                const query = codificaQuiz({ modalita: "allenamento", ids: ["x-001"], ordini: [ordine] });
                const dati = decodificaQuiz(query as LocationQuery)!;

                expect(decodificaOrdine(dati.ordini[0], n)).toEqual(ordine);
            }
        }
    });

    it("conservano modalità, domande, risposte, durata e punteggio", () =>
    {
        const quiz = {
            modalita: "simulazione" as const,
            ids: ["sse1-001", "tss2-010", "sse2a-003"],
            ordini: [[2, 0, 1, 3], [0, 1, 2], [3, 2, 1, 0]],
            risposte: [1, null, 3],
            durata: 754,
            corrette: 2
        };

        const dati = decodificaQuiz(codificaQuiz(quiz) as LocationQuery)!;

        expect(dati.modalita).toBe("simulazione");
        expect(dati.ids).toEqual(quiz.ids);
        expect(dati.risposte).toEqual(quiz.risposte);
        expect(dati.durata).toBe(754);
        expect(dati.corrette).toBe(2);
        expect([...dati.ordini].map((carattere, index) => decodificaOrdine(carattere, quiz.ordini[index].length)))
            .toEqual(quiz.ordini);
    });

    it("rifiutano link incompleti o malformati", () =>
    {
        expect(decodificaQuiz({})).toBeUndefined();
        expect(decodificaQuiz({ v: "1", q: "a-1.b-2", o: "0" })).toBeUndefined();
        expect(decodificaQuiz({ v: "1", q: "a-1", o: "0", r: "12" })).toBeUndefined();
        expect(decodificaQuiz({ v: "9", q: "a-1", o: "0" })).toBeUndefined();
        expect(decodificaOrdine("z", 4)).toBeUndefined();
    });
});

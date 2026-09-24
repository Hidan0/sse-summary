import { ref, watch } from "vue";
import type { Ref } from "vue";
import { useRoute } from "vue-router";

import { loadDomandePerId } from "@/content/quiz";
import { decodificaOrdine, decodificaQuiz } from "@/content/quiz-link";
import type { QuizLinkDecodificato } from "@/content/quiz-link";
import type { DomandaSessione } from "@/stores/quiz";

export interface QuizDaLink
{
    dati: QuizLinkDecodificato;
    domande: DomandaSessione[];
    risposte: (number | null)[];

    /*
     * Domande del link che non esistono più (rimosse o modificate) e sono state saltate.
     */
    mancanti: number;
}

/*
 * Legge un quiz condiviso dai parametri della rotta corrente e ne carica le domande.
 */
export function useQuizDaLink(): { stato: Ref<"caricamento" | "errore" | "pronto">, quiz: Ref<QuizDaLink | null> }
{
    const route = useRoute();

    const stato = ref<"caricamento" | "errore" | "pronto">("caricamento");
    const quiz = ref<QuizDaLink | null>(null);

    watch(() => route.query, async (query) =>
    {
        stato.value = "caricamento";
        quiz.value = null;

        const dati = decodificaQuiz(query);
        if (!dati)
        {
            stato.value = "errore";

            return;
        }

        const trovate = await loadDomandePerId(dati.ids);

        const domande: DomandaSessione[] = [];
        const risposte: (number | null)[] = [];
        trovate.forEach((domanda, index) =>
        {
            const ordine = domanda && decodificaOrdine(dati.ordini[index], domanda.opzioni.length);
            if (!domanda || !ordine) { return; }

            domande.push({ ...domanda, ordine: ordine });
            risposte.push(dati.risposte?.[index] ?? null);
        });

        if (!domande.length)
        {
            stato.value = "errore";

            return;
        }

        quiz.value = { dati: dati, domande: domande, risposte: risposte, mancanti: dati.ids.length - domande.length };
        stato.value = "pronto";

    }, { immediate: true });

    return { stato, quiz };
}

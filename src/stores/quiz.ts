import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";

import { loadDomande, shuffle, SIMULAZIONE } from "@/content/quiz";
import type { DomandaConArgomento } from "@/content/quiz";
import type { ArgomentoQuiz, LivelloQuiz } from "@/content/types";

export type ModalitaQuiz = "allenamento" | "simulazione" | "errori";

export interface DomandaSessione extends DomandaConArgomento
{
    /*
     * Ordine casuale delle opzioni: `ordine[i]` è l'indice originale dell'opzione mostrata in posizione `i`.
     */
    ordine: number[];
}

export interface OpzioniAllenamento
{
    argomenti: ArgomentoQuiz[];
    livelli: LivelloQuiz[];
    numero: number | null;
}

export const useQuiz = defineStore("quiz", () =>
{
    const modalita = ref<ModalitaQuiz>("allenamento");
    const domande = ref<DomandaSessione[]>([]);
    const risposte = ref<(number | null)[]>([]);
    const indice = ref(0);
    const inizio = ref(0);
    const fine = ref(0);

    /*
     * Id delle domande sbagliate, salvati nel browser per il ripasso degli errori.
     */
    const errori = useLocalStorage<string[]>("sse-quiz-errori", []);

    const attiva = computed(() => domande.value.length > 0);
    const terminata = computed(() => fine.value > 0);

    const isCorretta = (index: number) =>
    {
        const risposta = risposte.value[index];
        if (risposta === null || risposta === undefined) { return false; }

        return domande.value[index].ordine[risposta] === domande.value[index].corretta;
    };

    const sbagliate = computed(() => domande.value.filter((_, index) => !isCorretta(index)).length);
    const superata = computed(() => sbagliate.value <= SIMULAZIONE.erroriMassimi);

    const avvia = (tipo: ModalitaQuiz, lista: DomandaConArgomento[]) =>
    {
        modalita.value = tipo;
        domande.value = shuffle(lista).map((domanda) => ({
            ...domanda,
            ordine: shuffle(domanda.opzioni.map((_, index) => index))
        }));
        risposte.value = domande.value.map(() => null);
        indice.value = 0;
        inizio.value = Date.now();
        fine.value = 0;
    };

    const avviaAllenamento = async ({ argomenti, livelli, numero }: OpzioniAllenamento) =>
    {
        const lista = (await loadDomande(argomenti)).filter((domanda) => livelli.includes(domanda.livello));

        avvia("allenamento", numero ? shuffle(lista).slice(0, numero) : lista);
    };
    const avviaSimulazione = async (argomenti: ArgomentoQuiz[]) =>
    {
        const lista = await loadDomande(argomenti);

        avvia("simulazione", shuffle(lista).slice(0, SIMULAZIONE.domande));
    };
    const avviaErrori = async (argomenti: ArgomentoQuiz[]) =>
    {
        const ids = new Set(errori.value);
        const lista = (await loadDomande(argomenti)).filter((domanda) => ids.has(domanda.id));

        avvia("errori", lista);
    };

    const aggiornaErrori = (index: number) =>
    {
        const { id } = domande.value[index];
        const altri = errori.value.filter((value) => value !== id);

        errori.value = isCorretta(index) ? altri : [...altri, id];
    };

    const rispondi = (opzione: number) =>
    {
        if (terminata.value) { return; }

        // In allenamento la prima risposta è definitiva, perché viene mostrata subito la soluzione.
        if ((modalita.value !== "simulazione") && (risposte.value[indice.value] !== null)) { return; }

        risposte.value[indice.value] = opzione;
        if (modalita.value !== "simulazione") { aggiornaErrori(indice.value); }
    };

    const termina = () =>
    {
        if (modalita.value === "simulazione")
        {
            domande.value.forEach((_, index) => aggiornaErrori(index));
        }

        fine.value = Date.now();
    };

    const avanti = () =>
    {
        if (indice.value < domande.value.length - 1) { indice.value += 1; }
        else { termina(); }
    };
    const indietro = () =>
    {
        if (indice.value > 0) { indice.value -= 1; }
    };

    const esci = () =>
    {
        domande.value = [];
        risposte.value = [];
        fine.value = 0;
    };
    const azzeraErrori = () => { errori.value = []; };

    return {
        modalita,
        domande,
        risposte,
        indice,
        inizio,
        fine,
        errori,
        attiva,
        terminata,
        sbagliate,
        superata,
        isCorretta,
        avviaAllenamento,
        avviaSimulazione,
        avviaErrori,
        rispondi,
        avanti,
        indietro,
        termina,
        esci,
        azzeraErrori
    };
});

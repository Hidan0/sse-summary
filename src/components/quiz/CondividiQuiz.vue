<script lang="ts" setup>
    import { computed, ref } from "vue";
    import type { PropType } from "vue";

    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { useUrlQuiz } from "@/composables/url-quiz";
    import { codificaQuiz } from "@/content/quiz-link";
    import type { DomandaSessione, ModalitaQuiz } from "@/stores/quiz";
    import { condividi } from "@/utils/condividi";

    const props = defineProps({
        domande: {
            type: Array as PropType<DomandaSessione[]>,
            required: true
        },
        risposte: {
            type: Array as PropType<(number | null)[]>,
            required: true
        },
        modalita: {
            type: String as PropType<ModalitaQuiz>,
            required: true
        },
        durata: {
            default: undefined,
            type: Number
        }
    });

    const urlQuiz = useUrlQuiz();

    const corrette = computed(() => props.domande
        .filter((domanda, index) =>
        {
            const risposta = props.risposte[index];

            return (risposta !== null) && (domanda.ordine[risposta] === domanda.corretta);
        }).length);

    const nome = computed(() => ((props.modalita === "simulazione") ? "la simulazione d'esame" : "un quiz"));

    const link = (tipo: "sfida" | "risultato") =>
    {
        const query = codificaQuiz({
            modalita: (props.modalita === "simulazione") ? "simulazione" : "allenamento",
            ids: props.domande.map(({ id }) => id),
            ordini: props.domande.map(({ ordine }) => ordine),
            risposte: (tipo === "risultato") ? props.risposte : undefined,
            durata: props.durata,
            corrette: corrette.value
        });
        return urlQuiz((tipo === "sfida") ? "quiz-sfida" : "quiz-risultato", query);
    };

    const stato = ref<{ messaggio: string, link?: string } | null>(null);

    const condividiLink = async (tipo: "sfida" | "risultato") =>
    {
        const url = link(tipo);
        const punteggio = `${corrette.value} su ${props.domande.length}`;
        const testo = (tipo === "sfida") ?
            `Ho fatto ${punteggio} con ${nome.value} di Riassunti SSE. Riesci a fare meglio? Stesse domande:` :
            `Il mio risultato con ${nome.value} di Riassunti SSE: ${punteggio}.`;

        const esito = await condividi({ titolo: "Riassunti SSE · Quiz", testo: testo, url: url });

        if (esito === "copiato") { stato.value = { messaggio: "Link copiato negli appunti." }; }
        else if (esito === "non-disponibile") { stato.value = { messaggio: "Copia il link:", link: url }; }
        else { stato.value = null; }
    };
</script>

<template>
    <div class="condividi-quiz">
        <button type="button"
                class="btn btn-outline-primary"
                @click="condividiLink('sfida')">
            <FontAwesome icon="flag-checkered" /> Sfida un amico
        </button>
        <button type="button"
                class="btn btn-outline-primary"
                @click="condividiLink('risultato')">
            <FontAwesome icon="share-nodes" /> Condividi il risultato
        </button>

        <p v-if="stato" class="stato">
            {{ stato.messaggio }}
            <input v-if="stato.link"
                   class="form-control form-control-sm"
                   readonly
                   :value="stato.link"
                   @focus="($event.target as HTMLInputElement).select()" />
        </p>
    </div>
</template>

<style lang="scss" scoped>
    .condividi-quiz
    {
        display: contents;

        .stato
        {
            color: var(--app-muted);
            flex-basis: 100%;
            font-size: 0.9em;
            margin: 0;

            input
            {
                margin-top: 0.25rem;
            }
        }
    }
</style>

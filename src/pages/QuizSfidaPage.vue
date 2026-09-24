<script lang="ts" setup>
    import { computed, ref } from "vue";
    import { useRouter } from "vue-router";

    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { useQuizDaLink } from "@/composables/quiz-da-link";
    import { formatDurata, SIMULAZIONE } from "@/content/quiz";
    import { useQuiz } from "@/stores/quiz";
    import { condividi } from "@/utils/condividi";

    const quizStore = useQuiz();
    const router = useRouter();
    const { stato, quiz } = useQuizDaLink();

    const simulazione = computed(() => quiz.value?.dati.modalita === "simulazione");

    /*
     * Chi ha appena creato la sfida dalla pagina dei quiz (stato di navigazione, non presente nel link).
     */
    const creatore = (window.history.state as { creatore?: boolean } | null)?.creatore === true;

    const moduli = computed(() =>
    {
        const presenti = new Set(quiz.value?.domande.map(({ argomento }) => argomento.modulo));

        return (["TSS", "SSE"] as const).filter((modulo) => presenti.has(modulo))
            .join(" e ");
    });

    const statoInvio = ref<{ messaggio: string, link?: string } | null>(null);
    const invia = async () =>
    {
        const url = window.location.href;
        const testo = `Ti sfido alla simulazione d'esame di Riassunti SSE: ${quiz.value?.domande.length} domande ` +
            "di " + moduli.value + ", le stesse per tutti. Vediamo chi sbaglia meno!";

        const esito = await condividi({ titolo: "Riassunti SSE · Sfida", testo: testo, url: url });

        if (esito === "copiato") { statoInvio.value = { messaggio: "Link copiato negli appunti." }; }
        else if (esito === "non-disponibile") { statoInvio.value = { messaggio: "Copia il link:", link: url }; }
        else if (esito === "condiviso") { statoInvio.value = { messaggio: "Sfida inviata." }; }
        else { statoInvio.value = null; }
    };

    const accetta = () =>
    {
        if (!quiz.value) { return; }

        const { dati, domande } = quiz.value;
        const sfida = (dati.corrette !== undefined) ?
            { corrette: dati.corrette, totale: dati.ids.length, durata: dati.durata } :
            null;

        quizStore.avviaSfida(dati.modalita, domande, sfida);
        router.push({ name: "quiz-sessione" });
    };
</script>

<template>
    <div id="quiz-sfida-page" class="container page">
        <div v-if="stato === 'caricamento'" class="loading">
            <div class="spinner-border text-primary" role="status"></div>
        </div>

        <section v-else-if="stato === 'errore' || !quiz" class="card">
            <h1>Link non valido</h1>
            <p>Il link della sfida è incompleto o le sue domande non esistono più.</p>
            <RouterLink class="btn btn-primary" :to="{ name: 'quiz' }">
                Vai ai quiz
            </RouterLink>
        </section>

        <section v-else class="card sfida">
            <p class="icona">
                <FontAwesome icon="flag-checkered" />
            </p>
            <template v-if="creatore">
                <h1>La tua sfida è pronta</h1>
                <p class="lead">
                    Una simulazione d'esame di <strong>{{ moduli }}</strong>. Invia il link: chi lo apre farà
                    esattamente queste domande, nello stesso ordine.
                </p>
            </template>
            <h1 v-else>
                Hai ricevuto una sfida!
            </h1>

            <p v-if="!creatore && (quiz.dati.corrette === undefined)" class="lead">
                Una simulazione d'esame con le stesse domande per tutti: confrontate i risultati!
            </p>
            <p v-else-if="!creatore" class="lead">
                Chi ti ha sfidato ha risposto bene a <strong>{{ quiz.dati.corrette }} domande su
                    {{ quiz.dati.ids.length }}</strong>
                <template v-if="quiz.dati.durata !== undefined">
                    in {{ formatDurata(quiz.dati.durata) }}
                </template>.
                Riesci a fare meglio?
            </p>

            <ul class="regole">
                <li>
                    <strong>{{ quiz.domande.length }} domande</strong>, le stesse e nello stesso ordine.
                </li>
                <li v-if="simulazione">
                    Come nella <strong>simulazione d'esame</strong>: soluzioni solo alla fine,
                    alla {{ SIMULAZIONE.erroriMassimi + 1 }}ª risposta sbagliata non si passa.
                </li>
                <li v-else>
                    Come nell'<strong>allenamento</strong>: la soluzione compare dopo ogni risposta.
                </li>
                <li v-if="quiz.mancanti" class="avviso">
                    {{ quiz.mancanti }}
                    {{ quiz.mancanti === 1 ? "domanda non esiste più" : "domande non esistono più" }}
                    nel sito e {{ quiz.mancanti === 1 ? "è stata saltata" : "sono state saltate" }}:
                    il confronto potrebbe non essere alla pari.
                </li>
            </ul>

            <p v-if="quizStore.attiva && !quizStore.terminata" class="text-secondary small">
                Accettando la sfida, il quiz che hai in corso verrà sostituito.
            </p>

            <div v-if="creatore" class="azioni">
                <button type="button"
                        class="btn btn-primary btn-lg"
                        @click="invia">
                    <FontAwesome icon="share-nodes" /> Invia la sfida
                </button>
                <button type="button"
                        class="btn btn-outline-primary btn-lg"
                        @click="accetta">
                    Inizia il quiz
                </button>
            </div>
            <div v-else class="azioni">
                <button type="button"
                        class="btn btn-primary btn-lg"
                        @click="accetta">
                    Accetta la sfida
                </button>
                <RouterLink class="btn btn-link" :to="{ name: 'quiz' }">
                    No, grazie
                </RouterLink>
            </div>

            <p v-if="statoInvio" class="stato-invio">
                {{ statoInvio.messaggio }}
                <input v-if="statoInvio.link"
                       class="form-control form-control-sm"
                       readonly
                       :value="statoInvio.link"
                       @focus="($event.target as HTMLInputElement).select()" />
            </p>
            <p v-if="creatore" class="text-secondary small nota">
                Puoi iniziare anche più tardi: basta riaprire il link che hai inviato.
            </p>

            <p class="disclaimer">
                Domande generate con l'intelligenza artificiale, non ufficiali.
                <RouterLink :to="{ name: 'avvertenze' }">
                    Avvertenze
                </RouterLink>
            </p>
        </section>
    </div>
</template>

<style lang="scss" scoped>
    @use "@/assets/scss/variables";

    #quiz-sfida-page
    {
        max-width: 640px;
        padding-bottom: 3rem;
        padding-top: calc(var(--navigation-bar-height) + 1.5rem);

        .loading
        {
            display: flex;
            justify-content: center;
            padding: 3rem 0;
        }

        .card
        {
            background-color: var(--app-surface);
            border: none;
            box-shadow: 0px 0.125em 0.5em var(--app-shadow);
            padding: 1.5rem;
        }

        h1
        {
            font-size: 1.6rem;
            font-weight: 700;
        }

        .sfida
        {
            text-align: center;

            .icona
            {
                color: var(--app-accent);
                font-size: 2.5rem;
                margin-bottom: 0.5rem;
            }

            .regole
            {
                display: inline-block;
                margin: 0.5rem 0 1rem;
                text-align: left;

                li + li
                {
                    margin-top: 0.35rem;
                }

                .avviso
                {
                    color: variables.$warning;
                }
            }

            .azioni
            {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                justify-content: center;
            }

            .stato-invio
            {
                color: var(--app-muted);
                font-size: 0.9em;
                margin: 0.75rem 0 0;

                input
                {
                    margin-top: 0.25rem;
                }
            }

            .nota
            {
                margin: 0.75rem 0 0;
            }

            .disclaimer
            {
                color: var(--app-muted);
                font-size: 0.8em;
                margin: 1rem 0 0;
            }
        }
    }
</style>

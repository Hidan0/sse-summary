<script lang="ts" setup>
    import { computed, ref } from "vue";
    import { useRouter } from "vue-router";

    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { argomentiQuiz, LIVELLI, SIMULAZIONE } from "@/content/quiz";
    import type { LivelloQuiz } from "@/content/types";
    import { useQuiz } from "@/stores/quiz";

    const quiz = useQuiz();
    const router = useRouter();

    const moduli = computed(() => (["TSS", "SSE"] as const)
        .map((modulo) => ({ modulo: modulo, argomenti: argomentiQuiz.filter((value) => value.modulo === modulo) }))
        .filter(({ argomenti }) => argomenti.length));

    const totale = computed(() => argomentiQuiz.reduce((sum, argomento) => sum + argomento.totale, 0));

    const selezionati = ref(new Set(argomentiQuiz.map(({ slug }) => slug)));
    const livelli = ref(new Set<LivelloQuiz>(LIVELLI.map(({ id }) => id)));
    const numero = ref<number | null>(20);
    const caricamento = ref(false);

    const toggle = <T>(set: Set<T>, value: T) =>
    {
        if (set.has(value)) { set.delete(value); }
        else { set.add(value); }
    };

    const disponibili = computed(() => argomentiQuiz
        .filter(({ slug }) => selezionati.value.has(slug))
        .flatMap((argomento) => [...livelli.value].map((livello) => argomento.livelli[livello]))
        .reduce((sum, value) => sum + value, 0));

    const avvia = async (azione: () => Promise<void>) =>
    {
        caricamento.value = true;
        try
        {
            await azione();
            await router.push({ name: "quiz-sessione" });
        }
        finally
        {
            caricamento.value = false;
        }
    };

    const avviaSimulazione = () => avvia(() => quiz.avviaSimulazione(argomentiQuiz));
    const avviaAllenamento = () => avvia(() => quiz.avviaAllenamento({
        argomenti: argomentiQuiz.filter(({ slug }) => selezionati.value.has(slug)),
        livelli: [...livelli.value],
        numero: numero.value
    }));
    const avviaErrori = () => avvia(() => quiz.avviaErrori(argomentiQuiz));
</script>

<template>
    <div id="quiz-page" class="container page">
        <h1>Quiz</h1>

        <aside class="disclaimer" role="note">
            <FontAwesome icon="triangle-exclamation" />
            <div>
                <strong>Domande generate con l'intelligenza artificiale.</strong>
                Non sono domande ufficiali d'esame e non sono state controllate né validate da istruttori o
                esaminatori. Sono scritte a partire dal materiale del corso e verificate in automatico, ma possono
                contenere errori: nel dubbio fa fede il materiale del corso. Ogni risposta indica la fonte e il
                riassunto da ripassare.
            </div>
        </aside>

        <p class="text-secondary">
            {{ totale }} domande in {{ argomentiQuiz.length }} argomenti.
        </p>

        <section v-if="quiz.attiva && !quiz.terminata" class="card riprendi">
            <div>
                <strong>Hai un quiz in corso</strong>
                ({{ quiz.indice + 1 }} di {{ quiz.domande.length }}).
            </div>
            <RouterLink class="btn btn-primary" :to="{ name: 'quiz-sessione' }">
                Riprendi
            </RouterLink>
        </section>

        <div class="modalita">
            <section class="card">
                <h2><FontAwesome icon="stopwatch" /> Simulazione d'esame</h2>
                <p>
                    {{ SIMULAZIONE.domande }} domande a caso su tutti gli argomenti, TSS e SSE.
                    Alla <strong>{{ SIMULAZIONE.erroriMassimi + 1 }}ª risposta sbagliata</strong> non si passa.
                    Le soluzioni si vedono alla fine.
                </p>
                <button type="button"
                        class="btn btn-primary"
                        :disabled="caricamento || !totale"
                        @click="avviaSimulazione">
                    Inizia la simulazione
                </button>
            </section>

            <section class="card">
                <h2><FontAwesome icon="rotate-left" /> Ripasso degli errori</h2>
                <p>
                    Le domande che hai sbagliato, salvate in questo browser.
                    Quando rispondi bene, escono dall'elenco.
                </p>
                <div class="azioni">
                    <button type="button"
                            class="btn btn-primary"
                            :disabled="caricamento || !quiz.errori.length"
                            @click="avviaErrori">
                        Ripassa {{ quiz.errori.length }} {{ quiz.errori.length === 1 ? "errore" : "errori" }}
                    </button>
                    <button v-if="quiz.errori.length"
                            type="button"
                            class="btn btn-link"
                            @click="quiz.azzeraErrori">
                        Azzera
                    </button>
                </div>
            </section>
        </div>

        <section class="card allenamento">
            <h2><FontAwesome icon="dumbbell" /> Allenamento</h2>
            <p>Scegli argomenti e livelli: dopo ogni risposta vedi subito la soluzione e la spiegazione.</p>

            <div v-for="{ modulo, argomenti } in moduli"
                 :key="modulo"
                 class="gruppo">
                <h3>{{ modulo }}</h3>
                <div class="chips">
                    <button v-for="argomento in argomenti"
                            :key="argomento.slug"
                            type="button"
                            class="chip"
                            :class="{ attivo: selezionati.has(argomento.slug) }"
                            :aria-pressed="selezionati.has(argomento.slug)"
                            @click="toggle(selezionati, argomento.slug)">
                        {{ argomento.titolo }} <small>{{ argomento.totale }}</small>
                    </button>
                </div>
            </div>

            <div class="gruppo">
                <h3>Livello</h3>
                <div class="chips">
                    <button v-for="livello in LIVELLI"
                            :key="livello.id"
                            type="button"
                            class="chip"
                            :class="{ attivo: livelli.has(livello.id) }"
                            :aria-pressed="livelli.has(livello.id)"
                            :title="livello.descrizione"
                            @click="toggle(livelli, livello.id)">
                        {{ livello.nome }}
                    </button>
                </div>
            </div>

            <div class="gruppo">
                <h3>Quante domande</h3>
                <div class="chips">
                    <button v-for="value in [10, 20, 40, null]"
                            :key="String(value)"
                            type="button"
                            class="chip"
                            :class="{ attivo: numero === value }"
                            @click="numero = value">
                        {{ value ?? "Tutte" }}
                    </button>
                </div>
            </div>

            <button type="button"
                    class="btn btn-primary"
                    :disabled="caricamento || !disponibili"
                    @click="avviaAllenamento">
                Inizia l'allenamento ({{ numero ? Math.min(numero, disponibili) : disponibili }} domande)
            </button>
        </section>
    </div>
</template>

<style lang="scss" scoped>
    @use "@/assets/scss/variables";

    #quiz-page
    {
        max-width: 960px;
        padding-bottom: 3rem;
        padding-top: calc(var(--navigation-bar-height) + 1.5rem);

        h1
        {
            font-weight: 700;
        }

        .disclaimer
        {
            background-color: color-mix(in srgb, #{variables.$warning} 15%, var(--app-surface));
            border-left: 4px solid variables.$warning;
            border-radius: 0.375rem;
            display: flex;
            gap: 0.75rem;
            margin: 1rem 0;
            padding: 0.75rem 1rem;

            .fa
            {
                color: variables.$warning;
                margin-top: 0.2rem;
            }
        }

        .card
        {
            background-color: var(--app-surface);
            border: none;
            box-shadow: 0px 0.125em 0.5em var(--app-shadow);
            padding: 1rem 1.25rem;

            h2
            {
                font-size: 1.2rem;
            }
        }

        .riprendi
        {
            align-items: center;
            display: flex;
            flex-direction: row;
            gap: 1rem;
            justify-content: space-between;
            margin-bottom: 1rem;
        }

        .modalita
        {
            display: grid;
            gap: 1rem;
            grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
            margin-bottom: 1rem;

            .card
            {
                justify-content: space-between;

                .btn
                {
                    align-self: flex-start;
                }
            }

            .azioni
            {
                display: flex;
                gap: 0.5rem;
            }
        }

        .allenamento
        {
            .btn-primary
            {
                align-self: flex-start;
                margin-top: 0.5rem;
            }
        }

        .gruppo
        {
            margin-bottom: 1rem;

            h3
            {
                color: var(--app-muted);
                font-size: 0.8rem;
                font-weight: 700;
                letter-spacing: 0.05em;
                text-transform: uppercase;
            }
        }

        .chips
        {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .chip
        {
            background-color: transparent;
            border: 1px solid var(--app-accent-soft);
            border-radius: 1rem;
            color: var(--app-text);
            font-size: 0.9em;
            padding: 0.3rem 0.8rem;

            small
            {
                color: var(--app-muted);
            }

            &.attivo
            {
                background-color: var(--app-accent-soft);
                border-color: var(--app-accent);
                color: var(--app-accent);
            }
        }
    }
</style>

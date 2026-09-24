<script lang="ts" setup>
    import { computed, onUnmounted, ref } from "vue";
    import { useRouter } from "vue-router";
    import type { RouteLocationRaw } from "vue-router";

    import MarkdownContent from "@/components/content/MarkdownContent.vue";
    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { riassuntiBySlug } from "@/content";
    import { LIVELLI, SIMULAZIONE } from "@/content/quiz";
    import { useQuiz } from "@/stores/quiz";
    import type { DomandaSessione } from "@/stores/quiz";

    const quiz = useQuiz();
    const router = useRouter();

    if (!quiz.attiva) { router.replace({ name: "quiz" }); }

    const LETTERE = ["A", "B", "C", "D"];

    const domanda = computed(() => quiz.domande[quiz.indice]);
    const risposta = computed(() => quiz.risposte[quiz.indice]);
    const simulazione = computed(() => quiz.modalita === "simulazione");

    // In allenamento la soluzione si vede subito dopo la risposta; in simulazione solo alla fine.
    const mostraSoluzione = computed(() => !simulazione.value && (risposta.value !== null));

    const livello = (value: DomandaSessione) => LIVELLI.find(({ id }) => id === value.livello)?.nome;

    const ripasso = (value: DomandaSessione): { to: RouteLocationRaw, titolo: string } | undefined =>
    {
        if (!value.ripasso) { return undefined; }

        const [slug, sezione] = value.ripasso.split("#");
        const riassunto = riassuntiBySlug.get(slug);
        if (!riassunto) { return undefined; }

        return {
            to: { name: "riassunto", params: { slug: slug }, hash: sezione ? `#${sezione}` : "" },
            titolo: riassunto.titolo
        };
    };

    const classeOpzione = (posizione: number) =>
    {
        const selezionata = risposta.value === posizione;
        if (!mostraSoluzione.value) { return { selezionata: selezionata }; }

        const corretta = domanda.value.ordine[posizione] === domanda.value.corretta;

        return { corretta: corretta, sbagliata: selezionata && !corretta };
    };

    const risposteDate = computed(() => quiz.risposte.filter((value) => value !== null).length);

    const adesso = ref(Date.now());
    const timer = setInterval(() => { adesso.value = Date.now(); }, 1000);
    onUnmounted(() => clearInterval(timer));

    const durata = computed(() =>
    {
        const secondi = Math.floor(((quiz.fine || adesso.value) - quiz.inizio) / 1000);

        return `${Math.floor(secondi / 60)}:${String(secondi % 60).padStart(2, "0")}`;
    });

    const esitoClasse = computed(() => ({
        ok: !simulazione.value || quiz.superata,
        ko: simulazione.value && !quiz.superata
    }));

    const sbagliate = computed(() => quiz.domande
        .map((value, index) => ({ domanda: value, index: index }))
        .filter(({ index }) => !quiz.isCorretta(index)));

    const termina = () =>
    {
        const mancanti = quiz.domande.length - risposteDate.value;

        if (mancanti && !window.confirm(`Mancano ${mancanti} risposte, che conteranno come sbagliate. Terminare?`))
        {
            return;
        }

        quiz.termina();
    };

    const esci = () =>
    {
        quiz.esci();
        router.push({ name: "quiz" });
    };
</script>

<template>
    <div id="quiz-sessione-page" class="container page">
        <template v-if="quiz.attiva && !quiz.terminata && domanda">
            <header class="stato">
                <span>
                    <strong>{{ quiz.indice + 1 }}</strong> / {{ quiz.domande.length }}
                    <span v-if="simulazione" class="text-secondary"> · {{ durata }}</span>
                </span>
                <button type="button"
                        class="btn btn-link btn-sm"
                        @click="esci">
                    Esci
                </button>
            </header>
            <div class="progresso">
                <div :style="{ width: `${((quiz.indice + 1) / quiz.domande.length) * 100}%` }"></div>
            </div>

            <article class="domanda card">
                <p class="meta">
                    <span class="livello">{{ livello(domanda) }}</span>
                    {{ domanda.argomento.modulo }} · {{ domanda.argomento.titolo }}
                </p>
                <!-- eslint-disable vue/no-v-html -->
                <h1 class="testo" v-html="domanda.domanda"></h1>

                <ol class="opzioni">
                    <li v-for="(originale, posizione) in domanda.ordine" :key="originale">
                        <button type="button"
                                class="opzione"
                                :class="classeOpzione(posizione)"
                                :disabled="mostraSoluzione"
                                @click="quiz.rispondi(posizione)">
                            <span class="lettera">{{ LETTERE[posizione] }}</span>
                            <span v-html="domanda.opzioni[originale]"></span>
                        </button>
                    </li>
                </ol>
                <!-- eslint-enable vue/no-v-html -->

                <div v-if="mostraSoluzione" class="soluzione">
                    <p class="esito" :class="quiz.isCorretta(quiz.indice) ? 'ok' : 'ko'">
                        <FontAwesome :icon="quiz.isCorretta(quiz.indice) ? 'circle-check' : 'circle-xmark'" />
                        {{ quiz.isCorretta(quiz.indice) ? "Corretto" : "Sbagliato" }}
                    </p>
                    <MarkdownContent :html="domanda.spiegazione" />
                    <RouterLink v-if="ripasso(domanda)"
                                class="ripasso"
                                :to="ripasso(domanda)!.to">
                        <FontAwesome icon="book-open" /> Ripassa: {{ ripasso(domanda)!.titolo }}
                    </RouterLink>
                </div>
            </article>

            <nav class="navigazione">
                <button v-if="simulazione"
                        type="button"
                        class="btn btn-outline-secondary"
                        :disabled="quiz.indice === 0"
                        @click="quiz.indietro">
                    <FontAwesome icon="arrow-left" /> Indietro
                </button>
                <span v-else></span>

                <button v-if="simulazione && (quiz.indice === quiz.domande.length - 1)"
                        type="button"
                        class="btn btn-primary"
                        @click="termina">
                    Termina e correggi
                </button>
                <button v-else
                        type="button"
                        class="btn btn-primary"
                        :disabled="!simulazione && (risposta === null)"
                        @click="quiz.avanti">
                    {{ quiz.indice === quiz.domande.length - 1 ? "Risultati" : "Avanti" }}
                    <FontAwesome icon="arrow-right" />
                </button>
            </nav>
            <p v-if="simulazione" class="text-center">
                <button type="button"
                        class="btn btn-link btn-sm"
                        @click="termina">
                    Termina ora ({{ risposteDate }} risposte date)
                </button>
            </p>
        </template>

        <template v-else-if="quiz.terminata">
            <section class="risultato card" :class="esitoClasse">
                <p v-if="simulazione" class="verdetto">
                    <FontAwesome :icon="quiz.superata ? 'circle-check' : 'circle-xmark'" />
                    {{ quiz.superata ? "Superata" : "Non superata" }}
                </p>
                <p class="punteggio">
                    <strong>{{ quiz.domande.length - quiz.sbagliate }}</strong> corrette su {{ quiz.domande.length }}
                    · {{ quiz.sbagliate }} {{ quiz.sbagliate === 1 ? "errore" : "errori" }}
                    <template v-if="simulazione">
                        (massimo {{ SIMULAZIONE.erroriMassimi }}) · {{ durata }}
                    </template>
                </p>
                <div class="azioni">
                    <RouterLink class="btn btn-primary"
                                :to="{ name: 'quiz' }"
                                @click="quiz.esci">
                        Torna ai quiz
                    </RouterLink>
                </div>
            </section>

            <section v-if="sbagliate.length" class="errori">
                <h2>Da ripassare</h2>
                <!-- eslint-disable vue/no-v-html -->
                <article v-for="{ domanda: value, index } in sbagliate"
                         :key="value.id"
                         class="card errore">
                    <p class="meta">
                        {{ value.argomento.titolo }}
                    </p>
                    <p class="testo" v-html="value.domanda"></p>
                    <p v-if="quiz.risposte[index] !== null" class="tua">
                        <FontAwesome icon="circle-xmark" />
                        <span v-html="value.opzioni[value.ordine[quiz.risposte[index]!]]"></span>
                    </p>
                    <p v-else class="tua">
                        <FontAwesome icon="circle-xmark" /> Nessuna risposta
                    </p>
                    <p class="giusta">
                        <FontAwesome icon="circle-check" />
                        <span v-html="value.opzioni[value.corretta]"></span>
                    </p>
                    <MarkdownContent :html="value.spiegazione" />
                    <RouterLink v-if="ripasso(value)"
                                class="ripasso"
                                :to="ripasso(value)!.to">
                        <FontAwesome icon="book-open" /> Ripassa: {{ ripasso(value)!.titolo }}
                    </RouterLink>
                </article>
                <!-- eslint-enable vue/no-v-html -->
            </section>
        </template>
    </div>
</template>

<style lang="scss" scoped>
    @use "@/assets/scss/variables";

    #quiz-sessione-page
    {
        max-width: 760px;
        padding-bottom: 3rem;
        padding-top: calc(var(--navigation-bar-height) + 1.5rem);

        .card
        {
            background-color: var(--app-surface);
            border: none;
            box-shadow: 0px 0.125em 0.5em var(--app-shadow);
            padding: 1.25rem;
        }

        .stato
        {
            align-items: center;
            display: flex;
            justify-content: space-between;
        }

        .progresso
        {
            background-color: var(--app-accent-soft);
            border-radius: 1rem;
            height: 0.35rem;
            margin: 0.5rem 0 1rem;
            overflow: hidden;

            div
            {
                background-color: var(--app-accent);
                height: 100%;
                transition: width variables.$transition-duration variables.$transition-timing-function;
            }
        }

        .meta
        {
            color: var(--app-muted);
            font-size: 0.8em;
            margin-bottom: 0.5rem;

            .livello
            {
                background-color: var(--app-accent-soft);
                border-radius: 0.25rem;
                color: var(--app-accent);
                font-weight: 700;
                margin-right: 0.35rem;
                padding: 0.1em 0.5em;
            }
        }

        .testo
        {
            font-size: 1.2rem;
            font-weight: 500;
            line-height: 1.4;
            margin-bottom: 1rem;
        }

        .opzioni
        {
            display: grid;
            gap: 0.5rem;
            list-style: none;
            margin: 0;
            padding: 0;
        }

        .opzione
        {
            align-items: flex-start;
            background-color: var(--app-page-bg);
            border: 2px solid transparent;
            border-radius: 0.5rem;
            color: var(--app-text);
            display: flex;
            gap: 0.75rem;
            padding: 0.65rem 0.85rem;
            text-align: left;
            width: 100%;

            // Solo sui dispositivi con puntatore: sul touch l'hover resta "attaccato" dopo il tocco.
            @media (hover: hover)
            {
                &:not(:disabled):not(.selezionata):hover
                {
                    border-color: var(--app-accent-soft);
                }
            }

            &:disabled
            {
                cursor: default;
            }

            .lettera
            {
                color: var(--app-muted);
                flex-shrink: 0;
                font-weight: 700;
            }

            &.selezionata
            {
                background-color: var(--app-accent-soft);
                border-color: var(--app-accent);
            }
            &.corretta
            {
                background-color: color-mix(in srgb, #{variables.$success} 15%, var(--app-surface));
                border-color: variables.$success;
            }
            &.sbagliata
            {
                background-color: color-mix(in srgb, #{variables.$danger} 15%, var(--app-surface));
                border-color: variables.$danger;
            }
        }

        .soluzione
        {
            border-top: 1px solid var(--app-accent-soft);
            margin-top: 1rem;
            padding-top: 1rem;

            .esito
            {
                font-weight: 700;

                &.ok { color: variables.$success; }
                &.ko { color: variables.$danger; }
            }
        }

        .ripasso
        {
            display: inline-block;
            font-size: 0.9em;
            margin-top: 0.25rem;
        }

        .navigazione
        {
            display: flex;
            justify-content: space-between;
            margin-top: 1rem;
        }

        .risultato
        {
            border-top: 4px solid var(--app-accent);
            margin-bottom: 1.5rem;

            &.ok { border-top-color: variables.$success; }
            &.ko { border-top-color: variables.$danger; }

            .verdetto
            {
                font-size: 1.6rem;
                font-weight: 700;
                margin-bottom: 0.25rem;
            }
            &.ok .verdetto { color: variables.$success; }
            &.ko .verdetto { color: variables.$danger; }
        }

        .errori
        {
            display: grid;
            gap: 1rem;

            h2
            {
                font-size: 1.2rem;
            }

            .testo
            {
                font-size: 1.05rem;
            }

            .tua,
            .giusta
            {
                display: flex;
                gap: 0.5rem;
                margin-bottom: 0.35rem;
            }
            .tua .fa { color: variables.$danger; margin-top: 0.25rem; }
            .giusta
            {
                font-weight: 500;

                .fa { color: variables.$success; margin-top: 0.25rem; }
            }
        }
    }
</style>

<script lang="ts" setup>
    import { computed } from "vue";
    import type { PropType } from "vue";

    import MarkdownContent from "@/components/content/MarkdownContent.vue";
    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { formatDurata, ripassoDomanda, SIMULAZIONE } from "@/content/quiz";
    import type { DomandaSessione, ModalitaQuiz, Sfida } from "@/stores/quiz";

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
        },
        sfida: {
            default: null,
            type: Object as PropType<Sfida | null>
        }
    });

    const simulazione = computed(() => props.modalita === "simulazione");

    const isCorretta = (index: number) =>
    {
        const risposta = props.risposte[index];

        return (risposta !== null) && (risposta !== undefined) &&
            (props.domande[index].ordine[risposta] === props.domande[index].corretta);
    };

    const sbagliate = computed(() => props.domande
        .map((value, index) => ({ domanda: value, index: index }))
        .filter(({ index }) => !isCorretta(index)));
    const corrette = computed(() => props.domande.filter((_, index) => isCorretta(index)));

    const superata = computed(() => sbagliate.value.length <= SIMULAZIONE.erroriMassimi);

    const esitoClasse = computed(() => ({
        ok: !simulazione.value || superata.value,
        ko: simulazione.value && !superata.value
    }));

    const confronto = computed(() =>
    {
        if (!props.sfida) { return undefined; }

        const differenza = corrette.value.length - props.sfida.corrette;
        if (differenza > 0) { return { testo: "Hai vinto la sfida!", classe: "vinta" }; }
        if (differenza < 0) { return { testo: "Sfida persa: riprova!", classe: "persa" }; }

        return { testo: "Pareggio!", classe: "pari" };
    });
</script>

<template>
    <div class="quiz-risultati">
        <section class="risultato card" :class="esitoClasse">
            <p v-if="simulazione" class="verdetto">
                <FontAwesome :icon="superata ? 'circle-check' : 'circle-xmark'" />
                {{ superata ? "Superata" : "Non superata" }}
            </p>
            <p class="punteggio">
                <strong>{{ corrette.length }}</strong> corrette su {{ domande.length }}
                · {{ sbagliate.length }} {{ sbagliate.length === 1 ? "errore" : "errori" }}
                <template v-if="simulazione">
                    (massimo {{ SIMULAZIONE.erroriMassimi }})
                </template>
                <template v-if="durata !== undefined">
                    · {{ formatDurata(durata) }}
                </template>
            </p>

            <div v-if="sfida && confronto"
                 class="sfida"
                 :class="confronto.classe">
                <p class="titolo">
                    <FontAwesome icon="flag-checkered" /> {{ confronto.testo }}
                </p>
                <p>
                    Tu <strong>{{ corrette.length }}</strong> · sfidante <strong>{{ sfida.corrette }}</strong>
                    su {{ sfida.totale }}
                    <template v-if="sfida.durata !== undefined">
                        (in {{ formatDurata(sfida.durata) }})
                    </template>
                </p>
            </div>

            <div class="azioni">
                <slot name="azioni"></slot>
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
                <p v-if="risposte[index] !== null" class="tua">
                    <FontAwesome icon="circle-xmark" />
                    <span v-html="value.opzioni[value.ordine[risposte[index]!]]"></span>
                </p>
                <p v-else class="tua">
                    <FontAwesome icon="circle-xmark" /> Nessuna risposta
                </p>
                <p class="giusta">
                    <FontAwesome icon="circle-check" />
                    <span v-html="value.opzioni[value.corretta]"></span>
                </p>
                <MarkdownContent :html="value.spiegazione" />
                <RouterLink v-if="ripassoDomanda(value)"
                            class="ripasso"
                            :to="ripassoDomanda(value)!.to">
                    <FontAwesome icon="book-open" /> Ripassa: {{ ripassoDomanda(value)!.titolo }}
                </RouterLink>
            </article>
            <!-- eslint-enable vue/no-v-html -->
        </section>

        <details v-if="corrette.length" class="corrette">
            <summary>
                <FontAwesome icon="circle-check" />
                Risposte corrette ({{ corrette.length }})
            </summary>
            <!-- eslint-disable vue/no-v-html -->
            <article v-for="value in corrette"
                     :key="value.id"
                     class="card corretta">
                <p class="meta">
                    {{ value.argomento.titolo }}
                </p>
                <p class="testo" v-html="value.domanda"></p>
                <p class="giusta">
                    <FontAwesome icon="circle-check" />
                    <span v-html="value.opzioni[value.corretta]"></span>
                </p>
                <details class="spiegazione">
                    <summary>Spiegazione</summary>
                    <MarkdownContent :html="value.spiegazione" />
                    <RouterLink v-if="ripassoDomanda(value)"
                                class="ripasso"
                                :to="ripassoDomanda(value)!.to">
                        <FontAwesome icon="book-open" /> Ripassa: {{ ripassoDomanda(value)!.titolo }}
                    </RouterLink>
                </details>
            </article>
            <!-- eslint-enable vue/no-v-html -->
        </details>
    </div>
</template>

<style lang="scss" scoped>
    @use "@/assets/scss/variables";

    .quiz-risultati
    {
        .card
        {
            background-color: var(--app-surface);
            border: none;
            box-shadow: 0px 0.125em 0.5em var(--app-shadow);
            padding: 1.25rem;
        }

        .meta
        {
            color: var(--app-muted);
            font-size: 0.8em;
            margin-bottom: 0.5rem;
        }

        .ripasso
        {
            display: inline-block;
            font-size: 0.9em;
            margin-top: 0.25rem;
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

            .azioni
            {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;

                &:empty
                {
                    display: none;
                }
            }
        }

        .sfida
        {
            --sfida-color: var(--app-accent);

            background-color: color-mix(in srgb, var(--sfida-color) 10%, var(--app-surface));
            border-left: 4px solid var(--sfida-color);
            border-radius: 0.375rem;
            margin-bottom: 1rem;
            padding: 0.6rem 1rem;

            &.vinta { --sfida-color: #{variables.$success}; }
            &.persa { --sfida-color: #{variables.$danger}; }

            p
            {
                margin: 0;
            }

            .titolo
            {
                color: var(--sfida-color);
                font-weight: 700;
            }
        }

        .errori,
        .corrette
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
                font-weight: 500;
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

        .corrette
        {
            margin-top: 1.5rem;

            & > summary
            {
                background-color: var(--app-surface);
                border-radius: 0.375rem;
                box-shadow: 0px 0.125em 0.5em var(--app-shadow);
                font-size: 1.1rem;
                font-weight: 500;
                padding: 0.75rem 1rem;

                .fa { color: variables.$success; }
            }

            .spiegazione summary
            {
                color: var(--app-accent);
                font-size: 0.9em;
            }
        }
    }
</style>

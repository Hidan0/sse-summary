<script lang="ts" setup>
    import { computed, onMounted, ref, shallowRef, watch } from "vue";
    import { useRoute, useRouter } from "vue-router";
    import type MiniSearch from "minisearch";

    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { cerca, creaIndice, evidenzia, frammento, paroleQuery } from "@/content/ricerca";
    import type { DocumentoRicerca, RisultatoRicerca, TipoDocumento } from "@/content/ricerca";

    const GRUPPI: { tipo: TipoDocumento, nome: string, icona: string, limite: number }[] = [
        { tipo: "glossario", nome: "Glossario", icona: "book", limite: 5 },
        { tipo: "riassunto", nome: "Riassunti", icona: "book-open", limite: 15 },
        { tipo: "abcde", nome: "Schede ABCDE", icona: "list-check", limite: 5 }
    ];
    const MODULI = ["SSE", "TSS"] as const;

    const route = useRoute();
    const router = useRouter();

    /*
     * La ricerca e il filtro stanno nella query dell'URL: si possono condividere e il tasto indietro li ritrova.
     */
    const query = computed(() => String(route.query.q ?? "").trim());
    const modulo = computed(() => String(route.query.modulo ?? "").toUpperCase());

    const testo = ref(query.value);
    let timer: ReturnType<typeof setTimeout> | undefined;
    watch(testo, (value) =>
    {
        clearTimeout(timer);
        timer = setTimeout(() =>
            router.replace({ query: { ...route.query, q: value.trim() || undefined } }), 200);
    });
    watch(query, (value) =>
    {
        if (value !== testo.value.trim()) { testo.value = value; }
    });

    const scegliModulo = (value: string) =>
    {
        const nuovo = (modulo.value === value) ? undefined : value.toLowerCase();

        return router.replace({ query: { ...route.query, modulo: nuovo } });
    };

    const indice = shallowRef<MiniSearch<DocumentoRicerca>>();
    const input = ref<HTMLInputElement>();
    onMounted(async () =>
    {
        if (!query.value) { input.value?.focus(); }

        const { default: documenti } = await import("virtual:indice-ricerca");
        indice.value = creaIndice(documenti);
    });

    const parole = computed(() => paroleQuery(query.value));
    const risultati = computed<RisultatoRicerca[]>(() =>
    {
        if (!indice.value || !parole.value.length) { return []; }

        return cerca(indice.value, query.value).filter((risultato) =>
            !modulo.value || (risultato.tipo === "glossario") || (risultato.modulo === modulo.value));
    });

    const espansi = ref(new Set<TipoDocumento>());
    watch(query, () => { espansi.value = new Set(); });

    const gruppi = computed(() => GRUPPI
        .map((gruppo) =>
        {
            const tutti = risultati.value.filter(({ tipo }) => tipo === gruppo.tipo);
            const visibili = espansi.value.has(gruppo.tipo) ? tutti : tutti.slice(0, gruppo.limite);

            return { ...gruppo, totale: tutti.length, visibili: visibili };
        })
        .filter(({ totale }) => totale > 0));

    const espandi = (tipo: TipoDocumento) => { espansi.value = new Set([...espansi.value, tipo]); };

    const destinazione = (link: string) =>
    {
        const [path, hash] = link.split("#");

        return { path: path, hash: hash ? `#${hash}` : "", query: { q: query.value } };
    };
    const estratto = (risultato: RisultatoRicerca) => evidenzia(frammento(risultato.testo, parole.value), parole.value);
</script>

<template>
    <div id="cerca-page" class="container page">
        <h1>Cerca</h1>
        <input ref="input"
               v-model="testo"
               type="search"
               class="form-control form-control-lg"
               placeholder="Parole, sigle, numeri…"
               aria-label="Cerca nei riassunti, nel glossario e nelle schede ABCDE"
               enterkeyhint="search" />

        <div class="chips"
             role="group"
             aria-label="Filtra riassunti e schede per modulo">
            <button v-for="value in MODULI"
                    :key="value"
                    type="button"
                    class="chip"
                    :class="{ attivo: modulo === value }"
                    :aria-pressed="modulo === value"
                    @click="scegliModulo(value)">
                Solo {{ value }}
            </button>
        </div>

        <div v-if="!indice && query" class="loading">
            <div class="spinner-border text-primary" role="status"></div>
        </div>
        <p v-else-if="!parole.length" class="text-secondary">
            Cerca nei riassunti SSE e TSS, nel glossario e nelle schede ABCDE. I risultati contengono tutte le parole
            cercate, anche solo come inizio di parola ("tachic" trova "tachicardia"). Il filtro per modulo vale per
            riassunti e schede ABCDE; il glossario è comune ai due corsi.
        </p>
        <p v-else-if="!risultati.length" class="text-secondary">
            Nessun risultato per <strong>{{ query }}</strong>.
        </p>

        <section v-for="gruppo in gruppi"
                 :key="gruppo.tipo"
                 class="gruppo">
            <h2>
                <FontAwesome :icon="gruppo.icona" />
                {{ gruppo.nome }}
                <small>{{ gruppo.totale }}</small>
            </h2>
            <RouterLink v-for="risultato in gruppo.visibili"
                        :key="risultato.id"
                        :to="destinazione(risultato.link)"
                        class="risultato">
                <span class="intestazione">
                    <strong>
                        <template v-for="(pezzo, index) in evidenzia(risultato.titolo, parole)" :key="index">
                            <mark v-if="pezzo.evidenziato">{{ pezzo.testo }}</mark>
                            <template v-else>{{ pezzo.testo }}</template>
                        </template>
                    </strong>
                    <span v-if="risultato.sezione" class="sezione">
                        <FontAwesome icon="chevron-right" />
                        <template v-for="(pezzo, index) in evidenzia(risultato.sezione, parole)" :key="index">
                            <mark v-if="pezzo.evidenziato">{{ pezzo.testo }}</mark>
                            <template v-else>{{ pezzo.testo }}</template>
                        </template>
                    </span>
                    <span v-if="risultato.capitolo" class="capitolo">{{ risultato.capitolo }}</span>
                </span>
                <span class="estratto">
                    <template v-for="(pezzo, index) in estratto(risultato)" :key="index">
                        <mark v-if="pezzo.evidenziato">{{ pezzo.testo }}</mark>
                        <template v-else>{{ pezzo.testo }}</template>
                    </template>
                </span>
            </RouterLink>
            <button v-if="gruppo.visibili.length < gruppo.totale"
                    type="button"
                    class="btn btn-link altri"
                    @click="espandi(gruppo.tipo)">
                Mostra tutti ({{ gruppo.totale }})
            </button>
        </section>
    </div>
</template>

<style lang="scss" scoped>
    #cerca-page
    {
        max-width: 800px;
        padding-bottom: 3rem;
        padding-top: calc(var(--navigation-bar-height) + 1.5rem);

        h1
        {
            font-weight: 700;
            margin-bottom: 1rem;
        }

        .chips
        {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin: 0.75rem 0 1.25rem;
        }

        .chip
        {
            background-color: transparent;
            border: 1px solid var(--app-accent-soft);
            border-radius: 1rem;
            color: var(--app-text);
            font-size: 0.9em;
            padding: 0.3rem 0.8rem;

            &.attivo
            {
                background-color: var(--app-accent-soft);
                border-color: var(--app-accent);
                color: var(--app-accent);
            }
        }

        .loading
        {
            display: flex;
            justify-content: center;
            padding: 2rem 0;
        }

        .gruppo
        {
            margin-bottom: 1.5rem;

            h2
            {
                align-items: center;
                color: var(--app-accent);
                display: flex;
                font-size: 1.15rem;
                gap: 0.5rem;

                small
                {
                    color: var(--app-muted);
                    font-size: 0.8em;
                }
            }
        }

        .risultato
        {
            background-color: var(--app-surface);
            border-radius: 0.375rem;
            color: inherit;
            display: block;
            margin-bottom: 0.5rem;
            padding: 0.75rem 1rem;
            text-decoration: none;

            &:hover
            {
                box-shadow: 0px 0.125em 0.5em var(--app-shadow);
            }

            .intestazione
            {
                align-items: baseline;
                display: flex;
                flex-wrap: wrap;
                gap: 0.25rem 0.5rem;

                strong
                {
                    color: var(--app-accent);
                }

                .sezione
                {
                    font-weight: 600;

                    .fa
                    {
                        color: var(--app-muted);
                        font-size: 0.7em;
                    }
                }

                .capitolo
                {
                    color: var(--app-muted);
                    font-size: 0.8em;
                    margin-left: auto;
                }
            }

            .estratto
            {
                color: var(--app-muted);
                display: block;
                font-size: 0.9em;
                margin-top: 0.25rem;
            }
        }

        mark
        {
            background-color: var(--app-mark);
            border-radius: 0.2em;
            color: var(--app-text);
            padding: 0 0.1em;
        }

        .altri
        {
            padding-left: 0;
        }
    }
</style>

<script lang="ts" setup>
    import { computed } from "vue";
    import { useRoute } from "vue-router";

    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { getCapitoliByModulo, getRiassuntiByCapitolo, moduli } from "@/content";
    import type { Modulo } from "@/content";

    const NOMI: Record<Modulo, string> = {
        SSE: "Soccorso Sanitario Extraospedaliero",
        TSS: "Trasporto Sanitario"
    };

    /*
     * Il modulo scelto sta nella query, così il link "Argomenti" di un riassunto TSS torna qui.
     */
    const route = useRoute();
    const modulo = computed<Modulo>(() => ((route.query.modulo === "tss") ? "TSS" : "SSE"));

    const sezioni = computed(() => getCapitoliByModulo(modulo.value)
        .map((capitolo) => ({ capitolo: capitolo, riassunti: getRiassuntiByCapitolo(capitolo) })));
</script>

<template>
    <div id="home-page" class="container page">
        <header class="hero">
            <h1>Riassunti SSE</h1>
            <p class="lead">
                Ripasso dei corsi di Trasporto Sanitario (TSS) e Soccorso Sanitario Extraospedaliero (SSE),
                argomento per argomento.
            </p>
            <p class="disclaimer">
                <FontAwesome icon="circle-info" />
                Riassunti non ufficiali scritti con l'intelligenza artificiale sul materiale del corso AREU
                (revisione 2017). Alcuni protocolli sono superati: i riassunti non sostituiscono le lezioni
                né i protocolli in vigore.
                <RouterLink :to="{ name: 'avvertenze' }">
                    Leggi le avvertenze
                </RouterLink>
            </p>
        </header>

        <nav class="moduli" aria-label="Modulo">
            <RouterLink v-for="value in moduli"
                        :key="value"
                        :to="{ name: 'home', query: (value === 'TSS') ? { modulo: 'tss' } : {} }"
                        class="modulo"
                        :class="{ attivo: value === modulo }"
                        :aria-current="(value === modulo) ? 'page' : undefined"
                        replace>
                <strong>{{ value }}</strong>
                <small>{{ NOMI[value] }}</small>
            </RouterLink>
        </nav>

        <div class="chapters">
            <section v-for="{ capitolo, riassunti } in sezioni"
                     :key="capitolo.codice"
                     class="chapter card">
                <div class="card-body">
                    <h2>
                        <span class="chapter-icon">
                            <FontAwesome :icon="capitolo.icona" />
                        </span>
                        <span>
                            <small>Capitolo {{ capitolo.codice }}</small>
                            {{ capitolo.titolo }}
                        </span>
                    </h2>
                    <ul v-if="riassunti.length">
                        <li v-for="riassunto in riassunti" :key="riassunto.slug">
                            <RouterLink :to="{ name: 'riassunto', params: { slug: riassunto.slug } }">
                                {{ riassunto.titolo }}
                            </RouterLink>
                        </li>
                    </ul>
                    <p v-else class="text-secondary small mb-0">
                        In preparazione.
                    </p>
                </div>
            </section>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @use "@/assets/scss/variables";

    #home-page
    {
        padding-bottom: 2rem;
        padding-top: calc(var(--navigation-bar-height) + 2rem);

        .hero
        {
            margin-bottom: 2rem;

            h1
            {
                font-weight: 700;
            }

            .disclaimer
            {
                color: var(--app-muted);
                font-size: 0.9em;
            }
        }

        .moduli
        {
            display: grid;
            gap: 0.5rem;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            margin-bottom: 1.5rem;
            max-width: 40rem;
        }

        .modulo
        {
            border: 1px solid var(--app-accent-soft);
            border-radius: 0.75rem;
            color: var(--app-text);
            display: flex;
            flex-direction: column;
            padding: 0.5rem 0.9rem;
            text-decoration: none;

            small
            {
                color: var(--app-muted);
                font-size: 0.8em;
                line-height: 1.2;
            }

            &.attivo
            {
                background-color: var(--app-accent-soft);
                border-color: var(--app-accent);

                strong
                {
                    color: var(--app-accent);
                }
            }
        }

        .chapters
        {
            display: grid;
            gap: 1rem;
            grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
        }

        .chapter
        {
            border: none;
            background-color: var(--app-surface);
            box-shadow: 0px 0.125em 0.5em var(--app-shadow);

            h2
            {
                align-items: center;
                display: flex;
                font-size: 1.15rem;
                gap: 0.75rem;
                margin-bottom: 0.75rem;

                small
                {
                    color: var(--app-muted);
                    display: block;
                    font-size: 0.7em;
                    text-transform: uppercase;
                }
            }

            .chapter-icon
            {
                align-items: center;
                background-color: var(--app-accent-soft);
                border-radius: 50%;
                color: var(--app-accent);
                display: flex;
                flex-shrink: 0;
                height: 2.5rem;
                justify-content: center;
                width: 2.5rem;
            }

            ul
            {
                margin-bottom: 0;
                padding-left: 1.25rem;

                li
                {
                    padding: 0.15rem 0;
                }
            }
        }
    }
</style>

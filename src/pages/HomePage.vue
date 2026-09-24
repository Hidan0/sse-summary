<script lang="ts" setup>
    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { capitoli, getRiassuntiByCapitolo } from "@/content";

    const sezioni = capitoli.map((capitolo) => ({ capitolo: capitolo, riassunti: getRiassuntiByCapitolo(capitolo) }));
</script>

<template>
    <div id="home-page" class="container page">
        <header class="hero">
            <h1>Riassunti SSE</h1>
            <p class="lead">
                Ripasso del corso di Soccorso Sanitario Extraospedaliero, argomento per argomento.
            </p>
            <p class="disclaimer">
                <FontAwesome icon="circle-info" />
                Riassunti non ufficiali basati sul materiale del corso AREU:
                non sostituiscono le lezioni né i protocolli.
            </p>
        </header>

        <div class="chapters">
            <section v-for="{ capitolo, riassunti } in sezioni"
                     :key="capitolo.numero"
                     class="chapter card">
                <div class="card-body">
                    <h2>
                        <span class="chapter-icon">
                            <FontAwesome :icon="capitolo.icona" />
                        </span>
                        <span>
                            <small>Capitolo {{ capitolo.numero }}</small>
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

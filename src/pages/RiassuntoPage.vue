<script lang="ts" setup>
    import { computed, nextTick, ref, watch } from "vue";
    import { useRoute } from "vue-router";

    import MarkdownContent from "@/components/content/MarkdownContent.vue";
    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { getCapitolo, getRiassuntiByCapitolo, riassuntiBySlug } from "@/content";
    import type { Riassunto } from "@/content";

    const props = defineProps({
        slug: {
            type: String,
            required: true
        }
    });

    const route = useRoute();

    const riassunto = computed(() => riassuntiBySlug.get(props.slug));
    const capitolo = computed(() => riassunto.value && getCapitolo(riassunto.value.capitolo));

    const html = ref("");
    watch(riassunto, async (value) =>
    {
        html.value = "";
        if (!value) { return; }

        const module = await value.load();
        html.value = module.html;

        if (route.hash)
        {
            await nextTick();
            document.getElementById(route.hash.slice(1))?.scrollIntoView();
        }

    }, { immediate: true });

    const toc = computed(() => riassunto.value?.toc ?? []);

    const correlati = computed(() => (riassunto.value?.correlati ?? [])
        .map((slug) => riassuntiBySlug.get(slug))
        .filter((value): value is Riassunto => value !== undefined));

    const vicini = computed(() =>
    {
        if (!capitolo.value) { return { precedente: undefined, successivo: undefined }; }

        const lista = getRiassuntiByCapitolo(capitolo.value);
        const index = lista.findIndex((value) => value.slug === props.slug);

        return { precedente: lista[index - 1], successivo: lista[index + 1] };
    });
</script>

<template>
    <div id="riassunto-page" class="container page">
        <template v-if="riassunto">
            <nav class="breadcrumbs">
                <RouterLink :to="{ name: 'home' }">
                    Argomenti
                </RouterLink>
                <FontAwesome icon="chevron-right" />
                <span v-if="capitolo">Cap. {{ capitolo.numero }} · {{ capitolo.titolo }}</span>
            </nav>

            <div class="layout">
                <article>
                    <details v-if="toc.length" class="toc toc-mobile">
                        <summary>Indice</summary>
                        <ul>
                            <li v-for="entry in toc"
                                :key="entry.id"
                                :class="`level-${entry.level}`">
                                <RouterLink :to="{ hash: `#${entry.id}` }">
                                    {{ entry.text }}
                                </RouterLink>
                            </li>
                        </ul>
                    </details>

                    <MarkdownContent v-if="html" :html="html" />
                    <div v-else class="loading">
                        <div class="spinner-border text-primary" role="status"></div>
                    </div>

                    <section v-if="correlati.length" class="correlati">
                        <h2>Argomenti correlati</h2>
                        <RouterLink v-for="correlato in correlati"
                                    :key="correlato.slug"
                                    class="badge"
                                    :to="{ name: 'riassunto', params: { slug: correlato.slug } }">
                            {{ correlato.titolo }}
                        </RouterLink>
                    </section>

                    <nav class="pager">
                        <RouterLink v-if="vicini.precedente"
                                    class="prev"
                                    :to="{ name: 'riassunto', params: { slug: vicini.precedente.slug } }">
                            <small><FontAwesome icon="arrow-left" /> Precedente</small>
                            {{ vicini.precedente.titolo }}
                        </RouterLink>
                        <RouterLink v-if="vicini.successivo"
                                    class="next"
                                    :to="{ name: 'riassunto', params: { slug: vicini.successivo.slug } }">
                            <small>Successivo <FontAwesome icon="arrow-right" /></small>
                            {{ vicini.successivo.titolo }}
                        </RouterLink>
                    </nav>
                </article>

                <aside v-if="toc.length" class="toc toc-desktop">
                    <p class="toc-title">
                        Indice
                    </p>
                    <ul>
                        <li v-for="entry in toc"
                            :key="entry.id"
                            :class="`level-${entry.level}`">
                            <RouterLink :to="{ hash: `#${entry.id}` }">
                                {{ entry.text }}
                            </RouterLink>
                        </li>
                    </ul>
                </aside>
            </div>
        </template>
        <template v-else>
            <h1>Argomento non trovato</h1>
            <RouterLink :to="{ name: 'home' }">
                Torna agli argomenti
            </RouterLink>
        </template>
    </div>
</template>

<style lang="scss" scoped>
    @use "@/assets/scss/variables";

    #riassunto-page
    {
        padding-bottom: 3rem;
        padding-top: calc(var(--navigation-bar-height) + 1.5rem);

        .breadcrumbs
        {
            color: variables.$secondary;
            display: flex;
            flex-wrap: wrap;
            font-size: 0.85em;
            gap: 0.5rem;
            align-items: center;
            margin-bottom: 1rem;

            .fa
            {
                font-size: 0.7em;
            }
        }

        .layout
        {
            display: grid;
            gap: 2rem;
            grid-template-columns: minmax(0, 1fr);

            @media (min-width: variables.$min-desktop-size)
            {
                grid-template-columns: minmax(0, 1fr) 240px;
            }
        }

        .loading
        {
            display: flex;
            justify-content: center;
            padding: 3rem 0;
        }

        .toc
        {
            ul
            {
                list-style: none;
                margin: 0;
                padding: 0;

                li
                {
                    padding: 0.2rem 0;

                    &.level-3
                    {
                        font-size: 0.9em;
                        padding-left: 1rem;
                    }
                }
            }
        }
        .toc-mobile
        {
            background-color: #FFF;
            border-radius: 0.375rem;
            margin-bottom: 1rem;
            padding: 0.5rem 1rem;

            summary
            {
                font-weight: 500;
            }

            ul
            {
                margin-top: 0.5rem;
            }

            @media (min-width: variables.$min-desktop-size)
            {
                display: none;
            }
        }
        .toc-desktop
        {
            align-self: start;
            display: none;
            font-size: 0.9em;
            max-height: calc(100dvh - var(--navigation-bar-height) - 3rem);
            overflow-y: auto;
            position: sticky;
            top: calc(var(--navigation-bar-height) + 1.5rem);

            .toc-title
            {
                color: variables.$secondary;
                font-size: 0.8em;
                font-weight: 700;
                letter-spacing: 0.05em;
                margin-bottom: 0.5rem;
                text-transform: uppercase;
            }

            @media (min-width: variables.$min-desktop-size)
            {
                display: block;
            }
        }

        .correlati
        {
            margin-top: 2.5rem;

            h2
            {
                font-size: 1.1rem;
            }

            .badge
            {
                background-color: rgba(variables.$primary, 0.1);
                color: variables.$primary;
                font-size: 0.85em;
                font-weight: 500;
                margin: 0 0.5rem 0.5rem 0;
                padding: 0.5em 0.75em;
                white-space: normal;
            }
        }

        .pager
        {
            display: grid;
            gap: 1rem;
            grid-template-columns: 1fr 1fr;
            margin-top: 2rem;

            a
            {
                background-color: #FFF;
                border-radius: 0.375rem;
                box-shadow: 0px 0.125em 0.5em rgba(0, 0, 0, 0.08);
                padding: 0.75rem 1rem;

                small
                {
                    color: variables.$secondary;
                    display: block;
                }
            }
            .next
            {
                grid-column: 2;
                text-align: right;
            }
        }
    }
</style>

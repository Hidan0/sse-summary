<script lang="ts" setup>
    import { computed, reactive, ref, watch } from "vue";

    import SezioneAbcde from "@/components/abcde/SezioneAbcde.vue";
    import MarkdownContent from "@/components/content/MarkdownContent.vue";
    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { riassuntiBySlug } from "@/content";
    import { CATEGORIE, getLettera, loadSchema, schedeBySlug, SEZIONI } from "@/content/abcde";
    import type {
        AbcdeModule,
        IdSezioneAbcde,
        Riassunto,
        SchedaAbcdeFrontmatter,
        SchemaAbcdeFrontmatter
    } from "@/content/types";

    const props = defineProps({
        slug: {
            type: String,
            required: true
        }
    });

    const scheda = computed(() => schedeBySlug.get(props.slug));
    const categoria = computed(() => CATEGORIE.find(({ id }) => id === scheda.value?.categoria));

    const contenuto = ref<AbcdeModule<SchedaAbcdeFrontmatter>>();
    const schema = ref<AbcdeModule<SchemaAbcdeFrontmatter>>();
    const espanse = reactive(new Set<IdSezioneAbcde>());

    watch(scheda, async (value) =>
    {
        contenuto.value = undefined;
        schema.value = undefined;
        espanse.clear();
        if (!value) { return; }

        [contenuto.value, schema.value] = await Promise.all([value.load(), loadSchema(value.schema)]);

    }, { immediate: true });

    const sezioni = computed(() => SEZIONI.map((info) => ({
        ...info,
        propria: contenuto.value?.sezioni.find(({ id }) => id === info.id),
        base: schema.value?.sezioni.find(({ id }) => id === info.id)
    })));

    const toggle = (id: IdSezioneAbcde) =>
    {
        if (espanse.has(id)) { espanse.delete(id); }
        else { espanse.add(id); }
    };

    const riassunti = computed(() => (scheda.value?.riassunti ?? [])
        .map((slug) => riassuntiBySlug.get(slug))
        .filter((value): value is Riassunto => value !== undefined));
</script>

<template>
    <div id="scheda-abcde-page" class="container page">
        <template v-if="scheda">
            <nav class="breadcrumbs">
                <RouterLink :to="{ name: 'abcde' }">
                    ABCDE
                </RouterLink>
                <FontAwesome icon="chevron-right" />
                <span v-if="categoria">{{ categoria.nome }}</span>
            </nav>

            <h1>{{ scheda.titolo }}</h1>
            <p class="schema">
                Variazioni rispetto allo
                <RouterLink :to="{ name: 'schema-abcde', params: { schema: scheda.schema } }">
                    schema {{ scheda.schema === "trauma" ? "AcBCDE del trauma" : "ABCDE del paziente medico" }}
                </RouterLink>
            </p>

            <div v-if="!contenuto" class="loading">
                <div class="spinner-border text-primary" role="status"></div>
            </div>
            <template v-else>
                <MarkdownContent v-if="contenuto.intro" :html="contenuto.intro" />

                <ol class="percorso">
                    <li v-for="sezione in sezioni" :key="sezione.id">
                        <SezioneAbcde v-if="sezione.propria"
                                      :sezione="sezione.propria"
                                      :schema="scheda.schema" />
                        <template v-else>
                            <button type="button"
                                    class="come-da-schema"
                                    :aria-expanded="espanse.has(sezione.id)"
                                    @click="toggle(sezione.id)">
                                <span class="lettera">
                                    <template v-if="getLettera(sezione.id, scheda.schema)">
                                        {{ getLettera(sezione.id, scheda.schema) }}
                                    </template>
                                    <FontAwesome v-else :icon="sezione.id === 'scena' ? 'eye' : 'truck-medical'" />
                                </span>
                                <span class="nome">{{ sezione.nome }}</span>
                                <span class="stato">
                                    come da schema
                                    <FontAwesome :icon="espanse.has(sezione.id) ? 'chevron-up' : 'chevron-down'" />
                                </span>
                            </button>
                            <SezioneAbcde v-if="espanse.has(sezione.id) && sezione.base"
                                          class="base"
                                          :sezione="sezione.base"
                                          :schema="scheda.schema"
                                          :titolo="`${sezione.nome} (schema base)`" />
                        </template>
                    </li>
                </ol>
            </template>

            <section v-if="riassunti.length" class="collegamenti">
                <h2>Per approfondire</h2>
                <RouterLink v-for="riassunto in riassunti"
                            :key="riassunto.slug"
                            class="badge"
                            :to="{ name: 'riassunto', params: { slug: riassunto.slug } }">
                    <FontAwesome icon="book-open" /> {{ riassunto.titolo }}
                </RouterLink>
            </section>
        </template>
        <template v-else>
            <h1>Scheda non trovata</h1>
            <RouterLink :to="{ name: 'abcde' }">
                Torna all'ABCDE
            </RouterLink>
        </template>
    </div>
</template>

<style lang="scss" scoped>
    @use "@/assets/scss/variables";

    #scheda-abcde-page
    {
        max-width: 860px;
        padding-bottom: 3rem;
        padding-top: calc(var(--navigation-bar-height) + 1.5rem);

        .breadcrumbs
        {
            align-items: center;
            color: var(--app-muted);
            display: flex;
            font-size: 0.85em;
            gap: 0.5rem;
            margin-bottom: 1rem;

            .fa
            {
                font-size: 0.7em;
            }
        }

        h1
        {
            font-weight: 700;
        }

        .schema
        {
            color: var(--app-muted);
        }

        .loading
        {
            display: flex;
            justify-content: center;
            padding: 3rem 0;
        }

        .percorso
        {
            display: grid;
            gap: 1.5rem;
            list-style: none;
            margin: 1.5rem 0 2rem;
            padding: 0;

            :deep(.markdown-content ul)
            {
                list-style-type: disc;
            }
        }

        .come-da-schema
        {
            align-items: center;
            background: none;
            border: none;
            color: var(--app-muted);
            display: flex;
            gap: 0.75rem;
            padding: 0;
            text-align: left;
            width: 100%;

            .lettera
            {
                align-items: center;
                background-color: var(--app-page-bg);
                border: 2px solid var(--app-accent-soft);
                border-radius: 0.5rem;
                display: flex;
                flex-shrink: 0;
                font-size: 1.25rem;
                font-weight: 700;
                height: 2.5rem;
                justify-content: center;
                min-width: 2.5rem;
            }

            .nome
            {
                flex: 1;
            }

            .stato
            {
                font-size: 0.8em;
                white-space: nowrap;
            }
        }

        .base
        {
            margin-top: 0.75rem;
            opacity: 0.85;

            :deep(header)
            {
                display: none;
            }
        }

        .collegamenti
        {
            margin-top: 1rem;

            h2
            {
                font-size: 1.1rem;
            }

            .badge
            {
                background-color: var(--app-accent-soft);
                color: var(--app-accent);
                font-size: 0.85em;
                font-weight: 500;
                margin: 0 0.5rem 0.5rem 0;
                padding: 0.5em 0.75em;
                white-space: normal;
            }
        }
    }
</style>

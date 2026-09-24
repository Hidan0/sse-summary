<script lang="ts" setup>
    import { computed, ref, watch } from "vue";
    import type { PropType } from "vue";

    import SezioneAbcde from "@/components/abcde/SezioneAbcde.vue";
    import MarkdownContent from "@/components/content/MarkdownContent.vue";
    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { loadSchema } from "@/content/abcde";
    import type { AbcdeModule, SchemaAbcdeFrontmatter, TipoSchema } from "@/content/types";

    const props = defineProps({
        schema: {
            type: String as PropType<TipoSchema>,
            required: true
        }
    });

    const valido = computed(() => (props.schema === "medico") || (props.schema === "trauma"));

    const contenuto = ref<AbcdeModule<SchemaAbcdeFrontmatter>>();
    watch(() => props.schema, async (value) =>
    {
        contenuto.value = undefined;
        if (!valido.value) { return; }

        contenuto.value = await loadSchema(value);

    }, { immediate: true });
</script>

<template>
    <div id="schema-abcde-page" class="container page">
        <nav class="breadcrumbs">
            <RouterLink :to="{ name: 'abcde' }">
                <FontAwesome icon="arrow-left" /> ABCDE
            </RouterLink>
        </nav>

        <h1 v-if="!valido">
            Schema non trovato
        </h1>
        <div v-else-if="!contenuto" class="loading">
            <div class="spinner-border text-primary" role="status"></div>
        </div>
        <template v-else>
            <h1>{{ contenuto.frontmatter.titolo }}</h1>
            <MarkdownContent v-if="contenuto.intro" :html="contenuto.intro" />

            <div class="sezioni">
                <SezioneAbcde v-for="sezione in contenuto.sezioni"
                              :key="sezione.id"
                              :sezione="sezione"
                              :schema="schema" />
            </div>
        </template>
    </div>
</template>

<style lang="scss" scoped>
    #schema-abcde-page
    {
        max-width: 860px;
        padding-bottom: 3rem;
        padding-top: calc(var(--navigation-bar-height) + 1.5rem);

        .breadcrumbs
        {
            font-size: 0.9em;
            margin-bottom: 1rem;
        }

        h1
        {
            font-weight: 700;
        }

        .loading
        {
            display: flex;
            justify-content: center;
            padding: 3rem 0;
        }

        .sezioni
        {
            display: grid;
            gap: 1.5rem;
            margin-top: 1.5rem;
        }
    }
</style>

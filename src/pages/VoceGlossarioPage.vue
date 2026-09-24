<script lang="ts" setup>
    import { computed, ref, watch } from "vue";

    import MarkdownContent from "@/components/content/MarkdownContent.vue";
    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { findVoceGlossario, getRiassuntiCheCitano } from "@/content";

    const props = defineProps({
        slug: {
            type: String,
            required: true
        }
    });

    const voce = computed(() => findVoceGlossario(props.slug));
    const citatoIn = computed(() => (voce.value ? getRiassuntiCheCitano(voce.value) : []));

    const html = ref("");
    watch(voce, async (value) =>
    {
        html.value = "";
        if (!value) { return; }

        html.value = (await value.load()).html;

    }, { immediate: true });
</script>

<template>
    <div id="voce-glossario-page" class="container page">
        <nav class="breadcrumbs">
            <RouterLink :to="{ name: 'glossario' }">
                <FontAwesome icon="arrow-left" /> Glossario
            </RouterLink>
        </nav>

        <template v-if="voce">
            <h1>{{ voce.termine }}</h1>
            <p v-if="voce.sinonimi?.length" class="sinonimi">
                Anche: {{ voce.sinonimi.join(", ") }}
            </p>
            <p class="lead">
                {{ voce.breve }}
            </p>

            <MarkdownContent v-if="html" :html="html" />

            <section v-if="citatoIn.length" class="citato-in">
                <h2>Citato in</h2>
                <ul>
                    <li v-for="riassunto in citatoIn" :key="riassunto.slug">
                        <RouterLink :to="{ name: 'riassunto', params: { slug: riassunto.slug } }">
                            {{ riassunto.titolo }}
                        </RouterLink>
                    </li>
                </ul>
            </section>
        </template>
        <h1 v-else>
            Voce non trovata
        </h1>
    </div>
</template>

<style lang="scss" scoped>
    @use "@/assets/scss/variables";

    #voce-glossario-page
    {
        max-width: 800px;
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

        .sinonimi
        {
            color: variables.$secondary;
            font-style: italic;
        }

        .citato-in
        {
            margin-top: 2rem;

            h2
            {
                font-size: 1.1rem;
            }
        }
    }
</style>

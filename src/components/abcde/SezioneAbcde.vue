<script lang="ts" setup>
    import { computed } from "vue";
    import type { PropType } from "vue";

    import MarkdownContent from "@/components/content/MarkdownContent.vue";
    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { getLettera, SEZIONI, VOCI } from "@/content/abcde";
    import type { SezioneAbcde, TipoSchema } from "@/content/types";

    const props = defineProps({
        sezione: {
            type: Object as PropType<SezioneAbcde>,
            required: true
        },
        schema: {
            type: String as PropType<TipoSchema>,
            required: true
        },
        titolo: {
            default: "",
            type: String
        }
    });

    const info = computed(() => SEZIONI.find(({ id }) => id === props.sezione.id));
    const lettera = computed(() => getLettera(props.sezione.id, props.schema));
    const icona = computed(() => (props.sezione.id === "scena" ? "eye" : "truck-medical"));
</script>

<template>
    <section class="sezione-abcde">
        <header>
            <span class="lettera">
                <template v-if="lettera">{{ lettera }}</template>
                <FontAwesome v-else :icon="icona" />
            </span>
            <h2>
                <slot name="titolo">
                    {{ titolo || info?.nome }}
                </slot>
            </h2>
        </header>

        <MarkdownContent v-if="sezione.intro" :html="sezione.intro" />

        <div class="voci">
            <div v-for="(voce, index) in sezione.voci"
                 :key="index"
                 class="voce"
                 :class="`voce-${voce.tipo}`">
                <p class="voce-titolo">
                    <FontAwesome :icon="VOCI[voce.tipo].icona" />
                    {{ VOCI[voce.tipo].nome }}
                </p>
                <MarkdownContent :html="voce.html" />
            </div>
        </div>
    </section>
</template>

<style lang="scss" scoped>
    @use "@/assets/scss/variables";

    .sezione-abcde
    {
        header
        {
            align-items: center;
            display: flex;
            gap: 0.75rem;
            margin-bottom: 0.75rem;

            h2
            {
                font-size: 1.25rem;
                margin: 0;
            }
        }

        .lettera
        {
            align-items: center;
            background-color: var(--app-accent);
            border-radius: 0.5rem;
            color: var(--app-surface);
            display: flex;
            flex-shrink: 0;
            font-size: 1.25rem;
            font-weight: 700;
            height: 2.5rem;
            justify-content: center;
            min-width: 2.5rem;
            padding: 0 0.5rem;
        }

        .voci
        {
            display: grid;
            gap: 0.75rem;
        }

        .voce
        {
            --voce-color: var(--app-accent);

            background-color: var(--app-surface);
            border-left: 4px solid var(--voce-color);
            border-radius: 0.375rem;
            box-shadow: 0px 0.125em 0.5em var(--app-shadow);
            padding: 0.75rem 1rem;

            &.voce-chiedi { --voce-color: #{variables.$success}; }
            &.voce-fai { --voce-color: #{variables.$accent}; }
            &.voce-attenzione { --voce-color: #{variables.$danger}; }

            .voce-titolo
            {
                color: var(--voce-color);
                font-size: 0.8em;
                font-weight: 700;
                letter-spacing: 0.05em;
                margin-bottom: 0.25rem;
                text-transform: uppercase;
            }

            :deep(.markdown-content) > :last-child
            {
                margin-bottom: 0;
            }
            :deep(.markdown-content ul)
            {
                margin-bottom: 0.5rem;
            }
        }
    }
</style>

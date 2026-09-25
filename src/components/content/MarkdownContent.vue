<script lang="ts" setup>
    import { computed, nextTick, onMounted, ref, watch } from "vue";
    import { useRoute } from "vue-router";

    import { evidenzia, paroleQuery } from "@/content/evidenzia";
    import { useInfoSheet } from "@/stores/info-sheet";

    const props = defineProps({
        html: {
            type: String,
            required: true
        }
    });

    const infoSheet = useInfoSheet();
    const route = useRoute();

    /*
     * Arrivando da una ricerca (`?q=…`) si evidenziano nel testo le parole cercate.
     */
    const root = ref<HTMLElement>();
    const parole = computed(() => paroleQuery(String(route.query.q ?? "")));

    const evidenziaParole = () =>
    {
        if (!root.value || !parole.value.length) { return; }

        const walker = document.createTreeWalker(root.value, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => (node.parentElement?.closest(".source-ref, mark") ?
                NodeFilter.FILTER_REJECT :
                NodeFilter.FILTER_ACCEPT)
        });

        const nodi: Text[] = [];
        while (walker.nextNode()) { nodi.push(walker.currentNode as Text); }

        for (const nodo of nodi)
        {
            const pezzi = evidenzia(nodo.data, parole.value);
            if (!pezzi.some(({ evidenziato }) => evidenziato)) { continue; }

            const fragment = document.createDocumentFragment();
            for (const { testo, evidenziato } of pezzi)
            {
                if (!evidenziato)
                {
                    fragment.append(testo);
                    continue;
                }

                const mark = document.createElement("mark");
                mark.className = "ricerca";
                mark.textContent = testo;
                fragment.append(mark);
            }
            nodo.replaceWith(fragment);
        }
    };

    onMounted(evidenziaParole);
    watch(() => props.html, () => nextTick(evidenziaParole));

    const onClick = (evt: MouseEvent) =>
    {
        const target = (evt.target as HTMLElement).closest<HTMLElement>(".glossary-term, .source-ref");
        if (!target) { return; }

        evt.preventDefault();

        if (target.classList.contains("glossary-term"))
        {
            infoSheet.open({ type: "glossario", term: target.dataset.term!, label: target.textContent ?? "" });
        }
        else
        {
            infoSheet.open({ type: "fonte", id: target.dataset.source!, title: target.title });
        }
    };
</script>

<template>
    <!-- L'HTML viene generato al build dai file Markdown del repository. -->
    <!-- eslint-disable vue/no-v-html -->
    <div ref="root"
         class="markdown-content"
         @click="onClick"
         v-html="html"></div>
    <!-- eslint-enable vue/no-v-html -->
</template>

<style lang="scss">
    @use "@/assets/scss/variables";

    .markdown-content
    {
        line-height: 1.6;

        h1
        {
            font-weight: 700;
            margin-bottom: 1rem;
        }
        h2
        {
            border-bottom: 2px solid var(--app-accent-soft);
            font-size: 1.5rem;
            margin-top: 2rem;
            padding-bottom: 0.25rem;
        }
        h3
        {
            font-size: 1.2rem;
            margin-top: 1.5rem;
        }
        h2, h3
        {
            scroll-margin-top: calc(var(--navigation-bar-height) + 1rem);
        }

        ul, ol
        {
            padding-left: 1.5rem;
        }

        .table-wrapper
        {
            margin-bottom: 1rem;
            overflow-x: auto;

            .table
            {
                font-size: 0.95em;
                margin-bottom: 0;
                min-width: 480px;
            }
        }

        mark.ricerca
        {
            background-color: var(--app-mark);
            border-radius: 0.2em;
            color: inherit;
            padding: 0 0.1em;
        }

        .glossary-term
        {
            color: inherit;
            cursor: pointer;
            text-decoration: underline dotted var(--app-accent);
            text-decoration-thickness: 2px;
            text-underline-offset: 3px;

            &:hover
            {
                color: var(--app-accent);
            }
        }

        .source-ref
        {
            background-color: color-mix(in srgb, var(--app-muted) 15%, transparent);
            border: none;
            border-radius: 0.5em;
            color: var(--app-muted);
            font-size: 0.7em;
            padding: 0.1em 0.5em;
            vertical-align: 0.15em;
            white-space: nowrap;

            &:hover
            {
                background-color: color-mix(in srgb, var(--app-muted) 30%, transparent);
            }
        }

        .callout
        {
            --callout-color: #{variables.$primary};

            background-color: color-mix(in srgb, var(--callout-color) var(--app-callout-mix), var(--app-surface));
            border-left: 4px solid var(--callout-color);
            border-radius: 0.375rem;
            margin: 1rem 0;
            padding: 0.75rem 1rem;

            & > :last-child
            {
                margin-bottom: 0;
            }

            .callout-title
            {
                color: color-mix(in srgb, var(--callout-color) var(--app-callout-text-mix), white);
                font-size: 0.8em;
                font-weight: 700;
                letter-spacing: 0.05em;
                margin-bottom: 0.25rem;
                text-transform: uppercase;
            }

            &.callout-esame { --callout-color: #{variables.$accent}; }
            &.callout-pericolo { --callout-color: #{variables.$danger}; }
            &.callout-nota { --callout-color: #{variables.$secondary}; }
            &.callout-dubbio
            {
                --callout-color: #8540F5;

                border-left-style: dashed;
            }
        }
    }
</style>

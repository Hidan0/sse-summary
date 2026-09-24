<script lang="ts" setup>
    import { useInfoSheet } from "@/stores/info-sheet";

    defineProps({
        html: {
            type: String,
            required: true
        }
    });

    const infoSheet = useInfoSheet();

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
    <div class="markdown-content"
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
            border-bottom: 2px solid rgba(variables.$primary, 0.2);
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

        .glossary-term
        {
            color: inherit;
            cursor: pointer;
            text-decoration: underline dotted variables.$primary;
            text-decoration-thickness: 2px;
            text-underline-offset: 3px;

            &:hover
            {
                color: variables.$primary;
            }
        }

        .source-ref
        {
            background-color: rgba(variables.$secondary, 0.12);
            border: none;
            border-radius: 0.5em;
            color: variables.$secondary;
            font-size: 0.7em;
            padding: 0.1em 0.5em;
            vertical-align: 0.15em;
            white-space: nowrap;

            &:hover
            {
                background-color: rgba(variables.$secondary, 0.25);
            }
        }

        .callout
        {
            --callout-color: #{variables.$primary};

            background-color: color-mix(in srgb, var(--callout-color) 8%, white);
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
                color: var(--callout-color);
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

<script lang="ts" setup>
    import { computed, watch } from "vue";
    import { useRoute } from "vue-router";

    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { findVoceGlossario } from "@/content";
    import { useInfoSheet } from "@/stores/info-sheet";

    const infoSheet = useInfoSheet();
    const route = useRoute();

    const voce = computed(() =>
    {
        const content = infoSheet.content;
        if (content?.type !== "glossario") { return undefined; }

        return findVoceGlossario(content.term);
    });

    watch(() => route.fullPath, () => infoSheet.close());
</script>

<template>
    <Transition name="sheet">
        <div v-if="infoSheet.content"
             class="info-sheet-backdrop"
             @click.self="infoSheet.close">
            <div class="info-sheet" role="dialog">
                <button type="button"
                        class="btn-close"
                        aria-label="Chiudi"
                        @click="infoSheet.close"></button>
                <template v-if="infoSheet.content.type === 'glossario'">
                    <template v-if="voce">
                        <p class="kind">
                            <FontAwesome icon="book" /> Glossario
                        </p>
                        <h2>{{ voce.termine }}</h2>
                        <p>{{ voce.breve }}</p>
                        <RouterLink :to="{ name: 'voce-glossario', params: { slug: voce.slug } }">
                            Scheda completa <FontAwesome icon="arrow-right" />
                        </RouterLink>
                    </template>
                    <template v-else>
                        <p class="kind">
                            <FontAwesome icon="book" /> Glossario
                        </p>
                        <h2>{{ infoSheet.content.label }}</h2>
                        <p class="text-secondary">
                            Questa voce non è ancora nel glossario.
                        </p>
                    </template>
                </template>
                <template v-else>
                    <p class="kind">
                        <FontAwesome icon="file-lines" /> Fonte
                    </p>
                    <h2>{{ infoSheet.content.title }}</h2>
                    <p class="text-secondary small">
                        Le pagine si riferiscono al PDF del materiale del corso.
                    </p>
                </template>
            </div>
        </div>
    </Transition>
</template>

<style lang="scss" scoped>
    @use "@/assets/scss/variables";

    .info-sheet-backdrop
    {
        background-color: var(--app-backdrop);
        inset: 0px;
        position: fixed;
        z-index: 10;
    }

    .info-sheet
    {
        background-color: var(--app-surface);
        border-radius: 1rem 1rem 0 0;
        bottom: 0px;
        box-shadow: 0px 0px 2em rgba(0, 0, 0, 0.25);
        left: 50%;
        max-height: 60dvh;
        max-width: 560px;
        overflow-y: auto;
        padding: 1.5rem 1.5rem calc(1.5rem + env(safe-area-inset-bottom));
        position: fixed;
        transform: translateX(-50%);
        width: 100%;

        .btn-close
        {
            float: right;
        }

        .kind
        {
            color: var(--app-muted);
            font-size: 0.8em;
            font-weight: 700;
            letter-spacing: 0.05em;
            margin-bottom: 0.25rem;
            text-transform: uppercase;
        }

        h2
        {
            font-size: 1.4rem;
        }
    }

    .sheet-enter-active,
    .sheet-leave-active
    {
        transition: opacity variables.$transition-duration variables.$transition-timing-function;

        .info-sheet
        {
            transition: transform variables.$transition-duration variables.$transition-timing-function;
        }
    }
    .sheet-enter-from,
    .sheet-leave-to
    {
        opacity: 0;

        .info-sheet
        {
            transform: translate(-50%, 100%);
        }
    }
</style>

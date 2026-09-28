<script lang="ts" setup>
    import { computed } from "vue";
    import { useRoute } from "vue-router";

    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { useTema } from "@/composables/tema";

    import { SEZIONI_APP } from "./sezioni";

    const route = useRoute();
    const { tema, automatico, cambia } = useTema();

    const etichettaTema = computed(() =>
    {
        const attuale = (tema.value === "dark") ? "scuro" : "chiaro";
        const altro = (tema.value === "dark") ? "chiaro" : "scuro";

        return `Tema ${attuale}${automatico.value ? " (automatico, come il sistema)" : ""}: passa al tema ${altro}`;
    });
</script>

<template>
    <nav class="navigation-bar">
        <div class="container">
            <RouterLink :to="{ name: 'home' }" class="link bold">
                <FontAwesome icon="truck-medical" />
                <span class="brand-text">SSE</span>
            </RouterLink>
            <div class="links">
                <RouterLink v-for="sezione in SEZIONI_APP"
                            :key="sezione.nome"
                            :to="sezione.to"
                            class="link link-sezione"
                            :class="{ attiva: sezione.attiva(route) }">
                    {{ sezione.nome }}
                </RouterLink>
                <RouterLink :to="{ name: 'cerca' }"
                            class="link"
                            :class="{ attiva: route.name === 'cerca' }"
                            aria-label="Cerca"
                            title="Cerca">
                    <FontAwesome icon="magnifying-glass" />
                </RouterLink>
                <button type="button"
                        class="link tema"
                        :aria-label="etichettaTema"
                        :title="etichettaTema"
                        @click="cambia">
                    <FontAwesome :icon="(tema === 'dark') ? 'sun' : 'moon'" />
                </button>
            </div>
        </div>
    </nav>

    <!-- Su telefono le sezioni stanno in basso, a portata di pollice. -->
    <nav class="tab-bar" aria-label="Sezioni">
        <RouterLink v-for="sezione in SEZIONI_APP"
                    :key="sezione.nome"
                    :to="sezione.to"
                    class="tab"
                    :class="{ attiva: sezione.attiva(route) }"
                    :aria-current="sezione.attiva(route) ? 'page' : undefined">
            <FontAwesome :icon="sezione.icona" />
            <span>{{ sezione.breve }}</span>
        </RouterLink>
    </nav>
</template>

<style lang="scss" scoped>
    @use "@/assets/scss/variables";

    .navigation-bar
    {
        background-color: var(--app-navigation-bg);
        box-shadow: 0px 0px 1em rgba(0, 0, 0, 0.25);
        backdrop-filter: blur(10px);
        position: fixed;
        top: 0px;
        width: 100%;
        z-index: 2;

        .links
        {
            display: flex;
        }

        .brand-text
        {
            margin-left: 0.35em;
        }

        .link
        {
            display: inline-block;
            padding: 0.75em 1.25em;
            white-space: nowrap;

            &.bold
            {
                font-weight: bold;
            }
            &.tema
            {
                background: none;
                border: none;
                color: var(--app-primary);
                font: inherit;
            }
            &.attiva
            {
                text-decoration: underline;
                text-decoration-thickness: 2px;
                text-underline-offset: 0.4em;
            }
        }

        & > .container
        {
            @media (max-width: variables.$max-mobile-size)
            {
                padding-left: 0.5rem;
                padding-right: 0.5rem;
            }

            align-items: center;
            display: flex;
            height: var(--navigation-bar-height);
            justify-content: space-between;
        }

        @media (max-width: variables.$max-tab-bar-size)
        {
            .link-sezione
            {
                display: none;
            }
        }
    }

    .tab-bar
    {
        // Opaca: sotto c'è il fondo scuro del footer nascosto, che altrimenti trasparirebbe.
        background-color: var(--app-surface);
        bottom: 0px;
        box-shadow: 0px 0px 1em rgba(0, 0, 0, 0.25);
        display: none;
        height: var(--tab-bar-height);
        left: 0px;
        padding-bottom: env(safe-area-inset-bottom);
        position: fixed;
        right: 0px;
        z-index: 2;

        @media (max-width: variables.$max-tab-bar-size)
        {
            display: flex;
        }

        .tab
        {
            align-items: center;
            color: var(--app-muted);
            display: flex;
            flex: 1 1 0;
            flex-direction: column;
            font-size: 0.7rem;
            gap: 0.2rem;
            justify-content: center;
            min-width: 0;
            text-decoration: none;

            .fa
            {
                font-size: 1.25rem;
            }

            span
            {
                max-width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            &.attiva
            {
                color: var(--app-accent);
                font-weight: 600;
            }
        }
    }
</style>

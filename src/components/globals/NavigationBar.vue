<script lang="ts" setup>
    import FontAwesome from "@/components/ui/FontAwesome.vue";
</script>

<template>
    <nav class="navigation-bar">
        <div class="container">
            <RouterLink :to="{ name: 'home' }" class="link bold">
                <FontAwesome icon="truck-medical" />
                <span class="brand-text">SSE</span>
            </RouterLink>
            <div class="links">
                <RouterLink :to="{ name: 'home' }" class="link link-home">
                    Argomenti
                </RouterLink>
                <RouterLink :to="{ name: 'abcde' }" class="link">
                    ABCDE
                </RouterLink>
                <RouterLink :to="{ name: 'glossario' }" class="link">
                    Glossario
                </RouterLink>
            </div>
        </div>
    </nav>
</template>

<style lang="scss" scoped>
    @use "@/assets/scss/variables";

    .navigation-bar
    {
        background-color: var(--app-navigation-bg);
        box-shadow: 0px 0px 1em rgba(0, 0, 0, 0.25);
        backdrop-filter: blur(10px);
        container-type: inline-size;
        position: fixed;
        top: 0px;
        width: 100%;
        z-index: 1;

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
            padding: 0.75em 1.5em;
            white-space: nowrap;

            @media (max-width: variables.$max-mobile-size)
            {
                padding: 0.75em 0.5em;
            }

            &.bold
            {
                font-weight: bold;
            }
        }

        /*
         * In `em`, così la soglia tiene conto anche del carattere ingrandito dalle impostazioni del telefono.
         */
        @container (max-width: 18em)
        {
            .brand-text
            {
                display: none;
            }
        }

        /*
         * Su schermi molto stretti "Argomenti" è ridondante: il logo porta alla stessa pagina.
         */
        @container (max-width: 17.5em)
        {
            .link-home
            {
                display: none;
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
    }
</style>

<script lang="ts" setup>
    import FontAwesome from "@/components/ui/FontAwesome.vue";
</script>

<template>
    <nav class="navigation-bar">
        <div class="container row">
            <div class="col">
                <RouterLink :to="{ name: 'home' }" class="link bold">
                    <FontAwesome icon="truck-medical" /> SSE
                </RouterLink>
            </div>
            <div class="col right">
                <RouterLink :to="{ name: 'home' }" class="link">
                    Argomenti
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
        position: fixed;
        top: 0px;
        width: 100%;
        z-index: 1;

        .col.right
        {
            text-align: right;
        }

        .link
        {
            display: inline-block;
            padding: 0.75em 1.5em;

            @media (max-width: variables.$max-mobile-size)
            {
                padding: 0.75em 0.75em;
            }

            &.bold
            {
                font-weight: bold;
            }
        }

        & > .container.row
        {
            align-items: center;
            height: var(--navigation-bar-height);
            margin-left: auto;
            margin-right: auto;
        }
    }
</style>

<script lang="ts" setup>
    import AlertHandler from "./components/handlers/AlertHandler.vue";
    import DefaultLayout from "./layouts/DefaultLayout.vue";
</script>

<template>
    <DefaultLayout>
        <RouterView v-slot="context">
            <Transition name="page" mode="out-in">
                <Component :is="context.Component" :key="context.route.path" />
            </Transition>
        </RouterView>
    </DefaultLayout>
    <AlertHandler />
</template>

<style lang="scss">
    @use "@/assets/scss/index" as *;

    #app
    {
        .page-enter-from,
        .page-leave-to
        {
            opacity: 0;
        }
        .page-enter-active,
        .page-leave-active
        {
            transition: opacity $app-transition-duration $app-transition-timing-function;
        }
        .page-enter-to,
        .page-leave-from
        {
            opacity: 1;
        }
    }
</style>

<script lang="ts" setup>
    import { computed } from "vue";
    import { useRoute } from "vue-router";
    import { useLocalStorage } from "@vueuse/core";

    import FontAwesome from "@/components/ui/FontAwesome.vue";

    /*
     * Cambiando la versione l'avviso viene mostrato di nuovo a tutti.
     */
    const VERSIONE = 1;

    const accettato = useLocalStorage("sse-avvertenze-accettate", 0);
    const route = useRoute();

    const visibile = computed(() => (accettato.value < VERSIONE) && (route.name !== "avvertenze"));

    const accetta = () => { accettato.value = VERSIONE; };
</script>

<template>
    <Transition name="avviso">
        <div v-if="visibile" class="avviso-backdrop">
            <div class="avviso"
                 role="dialog"
                 aria-labelledby="avviso-titolo">
                <h2 id="avviso-titolo">
                    <FontAwesome icon="triangle-exclamation" /> Prima di iniziare
                </h2>
                <ul>
                    <li>
                        Riassunti <strong>non ufficiali</strong> del corso SSE e TSS di AREU Lombardia,
                        basati sul materiale del corso (revisione <strong>2017</strong>).
                    </li>
                    <li>
                        Alcuni protocolli del materiale <strong>sono superati</strong>: in servizio valgono i protocolli
                        AREU in vigore e le indicazioni di SOREU e istruttori.
                    </li>
                    <li>
                        Riassunti, schede e quiz sono <strong>scritti con l'intelligenza artificiale</strong> e possono
                        contenere errori. I quiz non sono domande ufficiali d'esame.
                    </li>
                </ul>
                <div class="azioni">
                    <button type="button"
                            class="btn btn-primary"
                            @click="accetta">
                        Ho capito
                    </button>
                    <RouterLink :to="{ name: 'avvertenze' }" class="btn btn-link">
                        Leggi tutte le avvertenze
                    </RouterLink>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style lang="scss" scoped>
    @use "@/assets/scss/variables";

    .avviso-backdrop
    {
        align-items: center;
        background-color: var(--app-backdrop);
        display: flex;
        inset: 0px;
        justify-content: center;
        padding: 1rem;
        position: fixed;
        z-index: 20;
    }

    .avviso
    {
        background-color: var(--app-surface);
        border-radius: 0.75rem;
        border-top: 4px solid variables.$warning;
        box-shadow: 0px 0px 2em rgba(0, 0, 0, 0.3);
        max-height: calc(100dvh - 2rem);
        max-width: 520px;
        overflow-y: auto;
        padding: 1.25rem 1.5rem;
        width: 100%;

        h2
        {
            font-size: 1.3rem;
            font-weight: 700;

            .fa
            {
                color: variables.$warning;
            }
        }

        ul
        {
            padding-left: 1.25rem;

            li + li
            {
                margin-top: 0.5rem;
            }
        }

        .azioni
        {
            align-items: center;
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
    }

    .avviso-enter-active,
    .avviso-leave-active
    {
        transition: opacity variables.$transition-duration variables.$transition-timing-function;
    }
    .avviso-enter-from,
    .avviso-leave-to
    {
        opacity: 0;
    }
</style>

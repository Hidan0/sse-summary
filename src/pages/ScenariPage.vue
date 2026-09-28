<script lang="ts" setup>
    import { computed, ref } from "vue";
    import { useRouter } from "vue-router";

    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { getScenariByTipo, TIPI_SCENARIO } from "@/content/scenari";
    import type { TipoScenario } from "@/content/types";

    const router = useRouter();

    const MODI = [
        {
            id: "esaminatore",
            nome: "Esaminatore",
            icona: "user-group",
            descrizione: "Un compagno fa lo scenario, tu leggi il filtro, dici i reperti e spunti le azioni."
        },
        {
            id: "solo",
            nome: "Da solo",
            icona: "user",
            descrizione: "Leggi il filtro e scopri le fasi una alla volta, dopo averci pensato."
        }

    ] as const;
    const modo = ref<"esaminatore" | "solo">("esaminatore");
    const destinazione = (slug: string) => ({ name: "scenario", params: { slug: slug }, query: { modo: modo.value } });

    const tipo = ref<TipoScenario>("medico");
    const elenco = computed(() => getScenariByTipo(tipo.value));

    const casuale = () =>
    {
        const scelto = elenco.value[Math.floor(Math.random() * elenco.value.length)];
        if (scelto) { router.push(destinazione(scelto.slug)); }
    };
</script>

<template>
    <div id="scenari-page" class="container page">
        <h1>Scenari d'esame</h1>
        <p class="lead">
            Le griglie degli scenari del corso, per ripassare da soli o per fare da esaminatore a un compagno.
        </p>

        <aside class="istruttori">
            <p class="titolo">
                <FontAwesome icon="chalkboard-user" /> Dagli istruttori
            </p>
            <p>
                Gli esaminatori possono cambiare i parametri e lo scenario anche mentre lo state svolgendo:
                <strong>non impararli a memoria</strong>. Allenate il metodo, non le risposte.
            </p>
        </aside>

        <p class="punteggio">
            <FontAwesome icon="circle-info" />
            Alla fine c'è un punteggio indicativo:
            <RouterLink :to="{ name: 'scenari-punteggio' }">
                come si calcola
            </RouterLink>.
        </p>

        <p class="text-secondary demo">
            <FontAwesome icon="flask" />
            Anteprima: i filtri della SOREU sono d'esempio, ricostruiti da noi dalle griglie.
        </p>

        <h2>1. Modalità</h2>
        <div class="modi" role="radiogroup">
            <button v-for="value in MODI"
                    :key="value.id"
                    type="button"
                    role="radio"
                    class="modo"
                    :class="{ attivo: modo === value.id }"
                    :aria-checked="modo === value.id"
                    @click="modo = value.id">
                <strong><FontAwesome :icon="value.icona" /> {{ value.nome }}</strong>
                <small>{{ value.descrizione }}</small>
            </button>
        </div>

        <h2>2. Scenario</h2>
        <div class="tipi" role="tablist">
            <button v-for="value in TIPI_SCENARIO"
                    :key="value.id"
                    type="button"
                    role="tab"
                    class="tipo"
                    :class="{ attivo: tipo === value.id }"
                    :aria-selected="tipo === value.id"
                    @click="tipo = value.id">
                <FontAwesome :icon="value.icona" /> {{ value.nome }}
            </button>
        </div>

        <template v-if="elenco.length">
            <button type="button"
                    class="btn btn-primary casuale"
                    @click="casuale">
                <FontAwesome icon="shuffle" /> Scenario a caso
            </button>

            <div class="elenco">
                <RouterLink v-for="value in elenco"
                            :key="value.slug"
                            :to="destinazione(value.slug)"
                            class="scenario">
                    <strong>Scenario {{ value.numero }}</strong>
                    <span class="dettagli">{{ value.categoria }}</span>
                </RouterLink>
            </div>
        </template>
        <p v-else class="text-secondary">
            Nessuno scenario di questo tipo, per ora.
        </p>
    </div>
</template>

<style lang="scss" scoped>
    #scenari-page
    {
        padding-bottom: 2rem;
        padding-top: calc(var(--navigation-bar-height) + 1.5rem);

        h1
        {
            font-weight: 700;
        }

        .istruttori
        {
            background-color: color-mix(in srgb, var(--app-success) var(--app-callout-mix), var(--app-surface));
            border-left: 4px solid var(--app-success);
            border-radius: 0.375rem;
            margin: 1rem 0;
            padding: 0.75rem 1rem;

            .titolo
            {
                color: color-mix(in srgb, var(--app-success) var(--app-callout-text-mix), var(--app-text));
                font-size: 0.8em;
                font-weight: 700;
                letter-spacing: 0.05em;
                margin-bottom: 0.25rem;
                text-transform: uppercase;
            }

            p:last-child
            {
                margin-bottom: 0;
            }
        }

        .punteggio
        {
            font-size: 0.9em;

            .fa
            {
                color: var(--app-accent);
            }
        }

        .demo
        {
            font-size: 0.9em;
        }

        h2
        {
            font-size: 1.1rem;
            font-weight: 700;
            margin-top: 1.25rem;
        }

        .modi
        {
            display: grid;
            gap: 0.5rem;
            grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
            margin-bottom: 0.5rem;
        }

        .modo
        {
            background-color: var(--app-surface);
            border: 1px solid var(--app-border-soft);
            border-radius: 0.5rem;
            color: var(--app-text);
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
            padding: 0.75rem 1rem;
            text-align: left;

            small
            {
                color: var(--app-muted);
            }

            &.attivo
            {
                background-color: var(--app-accent-soft);
                border-color: var(--app-accent);

                strong
                {
                    color: var(--app-accent);
                }
            }
        }

        .tipi
        {
            display: grid;
            gap: 0.5rem;
            grid-template-columns: 1fr 1fr;
            margin-bottom: 1rem;
        }

        .tipo
        {
            background-color: var(--app-surface);
            border: 1px solid var(--app-border-soft);
            border-radius: 0.5rem;
            color: var(--app-text);
            font-weight: 500;
            padding: 0.6rem 1rem;

            &.attivo
            {
                background-color: var(--app-accent-soft);
                border-color: var(--app-accent);
                color: var(--app-accent);
            }
        }

        .casuale
        {
            margin-bottom: 1rem;
            width: 100%;
        }

        .elenco
        {
            display: grid;
            gap: 0.5rem;
            grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
        }

        .scenario
        {
            background-color: var(--app-surface);
            border-radius: 0.375rem;
            color: inherit;
            display: flex;
            flex-direction: column;
            gap: 0.15rem;
            padding: 0.75rem 1rem;
            text-decoration: none;

            &:hover
            {
                box-shadow: 0px 0.125em 0.5em var(--app-shadow);
            }

            strong
            {
                color: var(--app-accent);
            }

            .dettagli
            {
                color: var(--app-muted);
                font-size: 0.85em;
            }
        }
    }
</style>

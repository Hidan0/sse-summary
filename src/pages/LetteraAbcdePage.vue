<script lang="ts" setup>
    import { computed, ref, watch } from "vue";
    import type { PropType } from "vue";

    import SezioneAbcde from "@/components/abcde/SezioneAbcde.vue";
    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { CATEGORIE, loadSchema, schede, SEZIONI } from "@/content/abcde";
    import type { IdSezioneAbcde, SchedaAbcde, SezioneAbcde as Sezione } from "@/content/types";

    const props = defineProps({
        sezione: {
            type: String as PropType<IdSezioneAbcde>,
            required: true
        }
    });

    const info = computed(() => SEZIONI.find(({ id }) => id === props.sezione));

    interface Riga { scheda: SchedaAbcde, sezione: Sezione }

    const base = ref<{ medico?: Sezione, trauma?: Sezione }>({ });
    const righe = ref<Riga[]>();

    watch(() => props.sezione, async (id) =>
    {
        righe.value = undefined;
        if (!info.value) { return; }

        const [medico, trauma] = await Promise.all([loadSchema("medico"), loadSchema("trauma")]);
        base.value = {
            medico: medico.sezioni.find((sezione) => sezione.id === id),
            trauma: trauma.sezioni.find((sezione) => sezione.id === id)
        };

        const conSezione = schede.filter((scheda) => scheda.sezioni.includes(id));
        const moduli = await Promise.all(conSezione.map((scheda) => scheda.load()));

        righe.value = conSezione.map((scheda, index) => ({
            scheda: scheda,
            sezione: moduli[index].sezioni.find((sezione) => sezione.id === id)!
        }));

    }, { immediate: true });

    const gruppi = computed(() => CATEGORIE
        .map((categoria) => ({
            categoria: categoria,
            righe: (righe.value ?? []).filter(({ scheda }) => scheda.categoria === categoria.id)
        }))
        .filter((gruppo) => gruppo.righe.length));
</script>

<template>
    <div id="lettera-abcde-page" class="container page">
        <nav class="breadcrumbs">
            <RouterLink :to="{ name: 'abcde' }">
                <FontAwesome icon="arrow-left" /> ABCDE
            </RouterLink>
        </nav>

        <nav class="tabs">
            <RouterLink v-for="value in SEZIONI"
                        :key="value.id"
                        :to="{ name: 'lettera-abcde', params: { sezione: value.id } }">
                {{ value.lettera || (value.id === "scena" ? "Scena" : "Dopo") }}
            </RouterLink>
        </nav>

        <template v-if="info">
            <h1>{{ info.lettera ? `${info.lettera} · ` : "" }}{{ info.nome }}</h1>

            <div v-if="!righe" class="loading">
                <div class="spinner-border text-primary" role="status"></div>
            </div>
            <template v-else>
                <details class="base">
                    <summary>Schema base</summary>
                    <SezioneAbcde v-if="base.medico"
                                  :sezione="base.medico"
                                  schema="medico"
                                  titolo="Paziente medico" />
                    <SezioneAbcde v-if="base.trauma"
                                  :sezione="base.trauma"
                                  schema="trauma"
                                  titolo="Trauma" />
                </details>

                <p v-if="!gruppi.length" class="text-secondary">
                    Nessun argomento modifica questa fase.
                </p>
                <section v-for="{ categoria, righe: lista } in gruppi" :key="categoria.id">
                    <h2 class="categoria">
                        <FontAwesome :icon="categoria.icona" /> {{ categoria.nome }}
                    </h2>
                    <SezioneAbcde v-for="{ scheda, sezione: valore } in lista"
                                  :key="scheda.slug"
                                  :sezione="valore"
                                  :schema="scheda.schema">
                        <template #titolo>
                            <RouterLink :to="{ name: 'scheda-abcde', params: { slug: scheda.slug } }">
                                {{ scheda.titolo }}
                            </RouterLink>
                        </template>
                    </SezioneAbcde>
                </section>
            </template>
        </template>
        <h1 v-else>
            Fase non trovata
        </h1>
    </div>
</template>

<style lang="scss" scoped>
    #lettera-abcde-page
    {
        max-width: 860px;
        padding-bottom: 3rem;
        padding-top: calc(var(--navigation-bar-height) + 1.5rem);

        .breadcrumbs
        {
            font-size: 0.9em;
            margin-bottom: 1rem;
        }

        .tabs
        {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
            margin-bottom: 1.5rem;

            a
            {
                border-radius: 0.5rem;
                font-weight: 700;
                padding: 0.35rem 0.75rem;
                text-decoration: none;

                &.router-link-active
                {
                    background-color: var(--app-accent);
                    color: var(--app-surface);
                }
            }
        }

        h1
        {
            font-weight: 700;
        }

        .loading
        {
            display: flex;
            justify-content: center;
            padding: 3rem 0;
        }

        .base
        {
            background-color: var(--app-surface);
            border-radius: 0.375rem;
            margin: 1rem 0 1.5rem;
            padding: 0.75rem 1rem;

            summary
            {
                font-weight: 500;
            }

            .sezione-abcde
            {
                margin-top: 1rem;
            }
        }

        .categoria
        {
            color: var(--app-muted);
            font-size: 1rem;
            letter-spacing: 0.05em;
            margin: 2rem 0 1rem;
            text-transform: uppercase;
        }

        section > .sezione-abcde + .sezione-abcde
        {
            margin-top: 1.5rem;
        }
    }
</style>

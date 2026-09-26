<script lang="ts" setup>
    import { computed, ref, watch } from "vue";

    import MarkdownContent from "@/components/content/MarkdownContent.vue";
    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { riassuntiBySlug } from "@/content";
    import type { Riassunto } from "@/content";
    import { getSkillByGruppo, GRUPPI_SKILL, skillBySlug } from "@/content/skill";
    import type { SkillModule } from "@/content/types";

    const props = defineProps({
        slug: {
            type: String,
            required: true
        }
    });

    const skill = computed(() => skillBySlug.get(props.slug));
    const gruppo = computed(() => GRUPPI_SKILL.find(({ id }) => id === skill.value?.gruppo));

    const contenuto = ref<SkillModule>();
    watch(skill, async (value) =>
    {
        contenuto.value = undefined;
        if (value) { contenuto.value = await value.load(); }

    }, { immediate: true });

    /*
     * Errori gravi e indicazioni degli istruttori usano gli stessi riquadri dei riassunti.
     */
    const riquadro = (tipo: string, titolo: string, voci: string[]) =>
        `<aside class="callout callout-${tipo}"><p class="callout-title">${titolo}</p>` +
        `<ul>${voci.map((voce) => `<li>${voce}</li>`).join("")}</ul></aside>`;

    const errori = computed(() => (contenuto.value?.errori.length ?
        riquadro("pericolo", "Errori gravi", contenuto.value.errori) :
        ""));
    const consigli = computed(() => (contenuto.value?.consigli.length ?
        riquadro("istruttori", "Dagli istruttori", contenuto.value.consigli) :
        ""));

    const riassunti = computed(() => (skill.value?.riassunti ?? [])
        .map((slug) => riassuntiBySlug.get(slug))
        .filter((value): value is Riassunto => value !== undefined));

    const vicini = computed(() =>
    {
        if (!skill.value) { return { precedente: undefined, successivo: undefined }; }

        const lista = getSkillByGruppo(skill.value.gruppo);
        const index = lista.findIndex((value) => value.slug === props.slug);

        return { precedente: lista[index - 1], successivo: lista[index + 1] };
    });
</script>

<template>
    <div id="skill-dettaglio-page" class="container page">
        <template v-if="skill">
            <nav class="breadcrumbs">
                <RouterLink :to="{ name: 'skill' }">
                    Skill
                </RouterLink>
                <FontAwesome icon="chevron-right" />
                <span v-if="gruppo">{{ gruppo.modulo }} · {{ gruppo.nome }}</span>
            </nav>

            <header class="intestazione">
                <p class="originale">
                    {{ skill.intestazione }}
                </p>
                <h1>{{ skill.titolo }}</h1>
                <p v-if="skill.sottotitolo" class="sottotitolo">
                    {{ skill.sottotitolo }}
                </p>
            </header>

            <div v-if="!contenuto" class="loading">
                <div class="spinner-border text-primary" role="status"></div>
            </div>
            <template v-else>
                <MarkdownContent v-if="errori" :html="errori" />

                <section class="scheda">
                    <!-- eslint-disable vue/no-v-html -->
                    <p v-if="contenuto.avvertenza" class="avvertenza">
                        {{ contenuto.avvertenza }}
                    </p>
                    <table class="passi" :class="`colonne-${contenuto.colonne.length}`">
                        <thead>
                            <tr>
                                <th class="numero">
                                    #
                                </th>
                                <th v-for="colonna in contenuto.colonne" :key="colonna">
                                    {{ colonna }}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(passo, index) in contenuto.passi" :key="index">
                                <td class="numero">
                                    {{ index + 1 }}
                                </td>
                                <td v-for="(cella, colonna) in passo"
                                    :key="colonna"
                                    :class="{ secondaria: colonna > 0 }"
                                    v-html="cella"></td>
                            </tr>
                        </tbody>
                    </table>
                    <p v-if="contenuto.nota"
                       class="nota"
                       v-html="contenuto.nota"></p>
                    <!-- eslint-enable vue/no-v-html -->
                    <div class="fonte">
                        <MarkdownContent :html="`Scheda skill del corso, ${skill.revisione}. ${contenuto.citazione}`" />
                    </div>
                </section>

                <MarkdownContent v-if="consigli" :html="consigli" />

                <section v-if="contenuto.commento" class="commento">
                    <h2>Note</h2>
                    <MarkdownContent :html="contenuto.commento" />
                </section>
            </template>

            <section v-if="riassunti.length" class="riassunti">
                <h2>Da ripassare</h2>
                <RouterLink v-for="riassunto in riassunti"
                            :key="riassunto.slug"
                            :to="{ name: 'riassunto', params: { slug: riassunto.slug } }"
                            class="riassunto">
                    <FontAwesome icon="book-open" /> {{ riassunto.titolo }}
                </RouterLink>
            </section>

            <nav class="vicini">
                <RouterLink v-if="vicini.precedente"
                            :to="{ name: 'skill-dettaglio', params: { slug: vicini.precedente.slug } }"
                            class="precedente">
                    <small><FontAwesome icon="arrow-left" /> Precedente</small>
                    {{ vicini.precedente.titolo }}
                </RouterLink>
                <RouterLink v-if="vicini.successivo"
                            :to="{ name: 'skill-dettaglio', params: { slug: vicini.successivo.slug } }"
                            class="successivo">
                    <small>Successiva <FontAwesome icon="arrow-right" /></small>
                    {{ vicini.successivo.titolo }}
                </RouterLink>
            </nav>
        </template>
        <template v-else>
            <h1>Skill non trovata</h1>
            <RouterLink :to="{ name: 'skill' }">
                Torna alle skill
            </RouterLink>
        </template>
    </div>
</template>

<style lang="scss" scoped>
    @use "@/assets/scss/variables";

    #skill-dettaglio-page
    {
        max-width: 860px;
        padding-bottom: 2rem;
        padding-top: calc(var(--navigation-bar-height) + 1.5rem);

        .breadcrumbs
        {
            align-items: center;
            color: var(--app-muted);
            display: flex;
            font-size: 0.9em;
            gap: 0.5rem;
            margin-bottom: 1rem;

            .fa
            {
                font-size: 0.7em;
            }
        }

        .intestazione
        {
            margin-bottom: 1rem;

            .originale
            {
                color: var(--app-muted);
                white-space: pre-line;
                font-size: 0.8em;
                letter-spacing: 0.03em;
                margin-bottom: 0.25rem;
            }

            h1
            {
                font-weight: 700;
                margin-bottom: 0.25rem;
            }

            .sottotitolo
            {
                color: var(--app-muted);
                font-style: italic;
                margin-bottom: 0;
            }
        }

        .loading
        {
            display: flex;
            justify-content: center;
            padding: 2rem 0;
        }

        .scheda
        {
            background-color: var(--app-surface);
            border-radius: 0.5rem;
            box-shadow: 0px 0.125em 0.5em var(--app-shadow);
            margin: 1rem 0;
            padding: 1rem;

            .avvertenza
            {
                color: var(--app-muted);
                font-size: 0.9em;
                font-style: italic;
            }

            .nota
            {
                color: var(--app-muted);
                font-size: 0.85em;
                margin-top: 0.75rem;
            }

            .fonte
            {
                color: var(--app-muted);
                font-size: 0.85em;
                margin-top: 0.75rem;

                :deep(p)
                {
                    margin-bottom: 0;
                }
            }
        }

        .passi
        {
            border-collapse: collapse;
            width: 100%;

            th
            {
                background-color: var(--app-accent-soft);
                color: var(--app-accent);
                font-size: 0.8em;
                letter-spacing: 0.03em;
                padding: 0.5rem;
                text-transform: uppercase;
            }

            td
            {
                border-top: 1px solid var(--app-accent-soft);
                padding: 0.5rem;
                vertical-align: top;
            }

            .numero
            {
                color: var(--app-accent);
                font-weight: 700;
                text-align: right;
                width: 2.5rem;
            }

            /*
             * Nella scheda la colonna delle indicazioni per l'allievo è in grassetto corsivo.
             */
            .secondaria
            {
                color: var(--app-muted);
                font-style: italic;
            }

            /*
             * Su telefono le due colonne non ci stanno: ogni passo diventa un blocco,
             * con le indicazioni per l'allievo sotto l'azione.
             */
            &.colonne-2
            {
                @media (max-width: variables.$max-mobile-size)
                {
                    thead
                    {
                        display: none;
                    }

                    tr
                    {
                        border-top: 1px solid var(--app-accent-soft);
                        display: grid;
                        grid-template-columns: 2rem 1fr;
                        padding: 0.5rem 0;
                    }

                    td
                    {
                        border: none;
                        padding: 0 0.25rem;
                    }

                    .numero
                    {
                        grid-row: span 2;
                        text-align: left;
                        width: auto;
                    }

                    .secondaria
                    {
                        font-size: 0.9em;
                        grid-column: 2;
                        margin-top: 0.25rem;
                    }
                }
            }
        }

        h2
        {
            font-size: 1.2rem;
            margin-top: 1.5rem;
        }

        .riassunti
        {
            .riassunto
            {
                background-color: var(--app-surface);
                border-radius: 0.375rem;
                display: block;
                margin-bottom: 0.5rem;
                padding: 0.6rem 1rem;
                text-decoration: none;
            }
        }

        .vicini
        {
            display: flex;
            gap: 1rem;
            justify-content: space-between;
            margin-top: 2rem;

            a
            {
                background-color: var(--app-surface);
                border-radius: 0.375rem;
                display: flex;
                flex-direction: column;
                max-width: 48%;
                padding: 0.75rem 1rem;
                text-decoration: none;

                small
                {
                    color: var(--app-muted);
                }
            }

            .successivo
            {
                margin-left: auto;
                text-align: right;
            }
        }
    }
</style>

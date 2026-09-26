<script lang="ts" setup>
    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { getSkillByGruppo, GRUPPI_SKILL } from "@/content/skill";

    const gruppi = GRUPPI_SKILL.map((gruppo) => ({ ...gruppo, skill: getSkillByGruppo(gruppo.id) }))
        .filter(({ skill }) => skill.length);
</script>

<template>
    <div id="skill-page" class="container page">
        <h1>Skill</h1>
        <p class="lead">
            Le schede con cui gli istruttori valutano le manovre, riportate parola per parola, con gli errori gravi e i
            consigli degli istruttori.
        </p>

        <section v-for="gruppo in gruppi"
                 :key="gruppo.id"
                 class="gruppo">
            <h2>
                <span class="icona"><FontAwesome :icon="gruppo.icona" /></span>
                <span>
                    <small>{{ gruppo.modulo }}</small>
                    {{ gruppo.nome }}
                </span>
            </h2>
            <div class="elenco">
                <RouterLink v-for="value in gruppo.skill"
                            :key="value.slug"
                            :to="{ name: 'skill-dettaglio', params: { slug: value.slug } }"
                            class="skill">
                    <strong>{{ value.titolo }}</strong>
                    <span class="dettagli">
                        <template v-if="value.algoritmo">Diagramma di flusso</template>
                        <template v-else>{{ value.passi }} passi</template>
                        <template v-if="value.sottotitolo && !value.algoritmo"> · {{ value.sottotitolo }}</template>
                    </span>
                    <span v-if="value.errori || value.consigli" class="extra">
                        <span v-if="value.errori"><FontAwesome icon="triangle-exclamation" /> errori gravi</span>
                        <span v-if="value.consigli"><FontAwesome icon="chalkboard-user" /> istruttori</span>
                    </span>
                </RouterLink>
            </div>
        </section>
    </div>
</template>

<style lang="scss" scoped>
    #skill-page
    {
        padding-bottom: 2rem;
        padding-top: calc(var(--navigation-bar-height) + 1.5rem);

        h1
        {
            font-weight: 700;
        }

        .lead
        {
            margin-bottom: 1.5rem;
        }

        .gruppo
        {
            margin-bottom: 2rem;

            h2
            {
                align-items: center;
                display: flex;
                font-size: 1.2rem;
                gap: 0.75rem;
                margin-bottom: 0.75rem;

                small
                {
                    color: var(--app-muted);
                    display: block;
                    font-size: 0.65em;
                    text-transform: uppercase;
                }
            }

            .icona
            {
                align-items: center;
                background-color: var(--app-accent-soft);
                border-radius: 50%;
                color: var(--app-accent);
                display: flex;
                flex-shrink: 0;
                height: 2.5rem;
                justify-content: center;
                width: 2.5rem;
            }
        }

        .elenco
        {
            display: grid;
            gap: 0.5rem;
            grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
        }

        .skill
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

            .dettagli, .extra
            {
                color: var(--app-muted);
                font-size: 0.85em;
            }

            .extra
            {
                display: flex;
                gap: 0.75rem;
            }
        }
    }
</style>

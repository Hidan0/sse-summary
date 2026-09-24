<script lang="ts" setup>
    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { CATEGORIE, getLettera, schede, SEZIONI } from "@/content/abcde";

    const gruppi = CATEGORIE
        .map((categoria) => ({
            categoria: categoria,
            schede: schede.filter((scheda) => scheda.categoria === categoria.id)
        }))
        .filter((gruppo) => gruppo.schede.length);
</script>

<template>
    <div id="abcde-page" class="container page">
        <h1>ABCDE per argomento</h1>
        <p class="lead">
            Come cambia la valutazione a seconda del problema: cosa cercare, cosa chiedere,
            cosa fare e a cosa stare attenti, lettera per lettera.
        </p>

        <section class="schemi">
            <RouterLink class="schema card" :to="{ name: 'schema-abcde', params: { schema: 'medico' } }">
                <span class="icona"><FontAwesome icon="stethoscope" /></span>
                <span>
                    <small>Schema base</small>
                    Paziente medico · ABCDE
                </span>
            </RouterLink>
            <RouterLink class="schema card" :to="{ name: 'schema-abcde', params: { schema: 'trauma' } }">
                <span class="icona"><FontAwesome icon="car-burst" /></span>
                <span>
                    <small>Schema base</small>
                    Trauma · AcBCDE
                </span>
            </RouterLink>
        </section>

        <section class="confronta">
            <h2>Confronta per lettera</h2>
            <p class="text-secondary">
                Una lettera alla volta, in tutti gli argomenti.
            </p>
            <div class="lettere">
                <RouterLink v-for="sezione in SEZIONI"
                            :key="sezione.id"
                            class="lettera-link"
                            :to="{ name: 'lettera-abcde', params: { sezione: sezione.id } }">
                    <strong>{{ sezione.lettera || (sezione.id === "scena" ? "Scena" : "Dopo") }}</strong>
                    <small>{{ sezione.nome }}</small>
                </RouterLink>
            </div>
        </section>

        <section v-for="{ categoria, schede: lista } in gruppi"
                 :key="categoria.id"
                 class="categoria">
            <h2>
                <FontAwesome :icon="categoria.icona" /> {{ categoria.nome }}
            </h2>
            <div class="schede">
                <RouterLink v-for="scheda in lista"
                            :key="scheda.slug"
                            class="scheda card"
                            :to="{ name: 'scheda-abcde', params: { slug: scheda.slug } }">
                    <span class="titolo">{{ scheda.titolo }}</span>
                    <span class="chips">
                        <span v-for="id in scheda.sezioni.filter((value) => getLettera(value, scheda.schema))"
                              :key="id"
                              class="chip">{{ getLettera(id, scheda.schema) }}</span>
                    </span>
                </RouterLink>
            </div>
        </section>
    </div>
</template>

<style lang="scss" scoped>
    @use "@/assets/scss/variables";

    #abcde-page
    {
        padding-bottom: 3rem;
        padding-top: calc(var(--navigation-bar-height) + 2rem);

        h1
        {
            font-weight: 700;
        }

        h2
        {
            font-size: 1.25rem;
            margin: 2rem 0 0.75rem;
        }

        .card
        {
            background-color: var(--app-surface);
            border: none;
            box-shadow: 0px 0.125em 0.5em var(--app-shadow);
            color: inherit;
            text-decoration: none;

            &:hover
            {
                box-shadow: 0px 0.25em 1em var(--app-shadow);
            }
        }

        .schemi
        {
            display: grid;
            gap: 1rem;
            grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
            margin-top: 1.5rem;

            .schema
            {
                align-items: center;
                display: flex;
                flex-direction: row;
                font-size: 1.1rem;
                font-weight: 500;
                gap: 1rem;
                padding: 1rem;

                small
                {
                    color: var(--app-muted);
                    display: block;
                    font-size: 0.7em;
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
                height: 2.75rem;
                justify-content: center;
                width: 2.75rem;
            }
        }

        .lettere
        {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;

            .lettera-link
            {
                background-color: var(--app-surface);
                border-radius: 0.5rem;
                box-shadow: 0px 0.125em 0.5em var(--app-shadow);
                display: flex;
                flex-direction: column;
                min-width: 5.5rem;
                padding: 0.5rem 0.75rem;
                text-decoration: none;

                strong
                {
                    font-size: 1.2rem;
                }

                small
                {
                    color: var(--app-muted);
                    font-size: 0.7em;
                }
            }
        }

        .schede
        {
            display: grid;
            gap: 0.75rem;
            grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));

            .scheda
            {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                padding: 0.75rem 1rem;

                .titolo
                {
                    color: var(--app-accent);
                    font-weight: 500;
                }

                .chips
                {
                    display: flex;
                    gap: 0.25rem;
                }

                .chip
                {
                    background-color: var(--app-accent-soft);
                    border-radius: 0.25rem;
                    color: var(--app-accent);
                    font-size: 0.75em;
                    font-weight: 700;
                    padding: 0.1em 0.5em;
                }
            }
        }
    }
</style>

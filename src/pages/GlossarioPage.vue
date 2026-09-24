<script lang="ts" setup>
    import { computed, ref } from "vue";

    import { glossario } from "@/content";
    import { slugify } from "@/content/slug";

    const query = ref("");

    const risultati = computed(() =>
    {
        const needle = slugify(query.value);
        if (!needle) { return glossario; }

        return glossario.filter((voce) => [voce.termine, ...(voce.sinonimi ?? [])]
            .some((key) => slugify(key).includes(needle)));
    });

    const gruppi = computed(() =>
    {
        const result = new Map<string, typeof glossario>();
        for (const voce of risultati.value)
        {
            const lettera = voce.termine.charAt(0)
                .toUpperCase();
            if (!result.has(lettera)) { result.set(lettera, []); }

            result.get(lettera)!.push(voce);
        }

        return result;
    });
</script>

<template>
    <div id="glossario-page" class="container page">
        <h1>Glossario</h1>
        <input v-model="query"
               type="search"
               class="form-control form-control-lg"
               placeholder="Cerca un termine..."
               aria-label="Cerca un termine" />

        <p v-if="!risultati.length" class="text-secondary mt-3">
            Nessun termine trovato.
        </p>

        <section v-for="[lettera, voci] in gruppi" :key="lettera">
            <h2>{{ lettera }}</h2>
            <dl>
                <RouterLink v-for="voce in voci"
                            :key="voce.slug"
                            class="voce"
                            :to="{ name: 'voce-glossario', params: { slug: voce.slug } }">
                    <dt>{{ voce.termine }}</dt>
                    <dd>{{ voce.breve }}</dd>
                </RouterLink>
            </dl>
        </section>
    </div>
</template>

<style lang="scss" scoped>
    @use "@/assets/scss/variables";

    #glossario-page
    {
        max-width: 800px;
        padding-bottom: 3rem;
        padding-top: calc(var(--navigation-bar-height) + 1.5rem);

        h1
        {
            font-weight: 700;
            margin-bottom: 1rem;
        }

        h2
        {
            color: var(--app-accent);
            font-size: 1.2rem;
            margin-top: 1.5rem;
        }

        .voce
        {
            background-color: var(--app-surface);
            border-radius: 0.375rem;
            color: inherit;
            display: block;
            margin-bottom: 0.5rem;
            padding: 0.75rem 1rem;
            text-decoration: none;

            &:hover
            {
                box-shadow: 0px 0.125em 0.5em var(--app-shadow);
            }

            dt
            {
                color: var(--app-accent);
            }

            dd
            {
                margin: 0;
            }
        }
    }
</style>

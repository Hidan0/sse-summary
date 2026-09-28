<script lang="ts" setup>
    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { PENALITA_AUTOPROTEZIONE, PENALITA_ERRORE_GRAVE, SOGLIA } from "@/content/punteggio-scenario";

    const soglia = Math.round(SOGLIA * 100);
</script>

<template>
    <div id="scenari-punteggio-page" class="container page">
        <nav class="breadcrumbs">
            <RouterLink :to="{ name: 'scenari' }">
                Scenari
            </RouterLink>
            <FontAwesome icon="chevron-right" />
            <span>Punteggio</span>
        </nav>

        <h1>Come funziona il punteggio</h1>

        <aside class="avviso" role="note">
            <FontAwesome icon="triangle-exclamation" />
            <div>
                <strong>Non è il punteggio dell'esame.</strong>
                È una stima nostra, costruita sui numeri delle griglie del corso per capire se lo scenario sarebbe
                andato bene. All'esame contano anche la skill tecnica, la valutazione del soccorso e il giudizio degli
                esaminatori, che qui non ci sono.
            </div>
        </aside>

        <section>
            <h2>I punti dello scenario</h2>
            <ul>
                <li>
                    Ogni fase vale i punti della sua griglia (colonna "%"): prearrivo, scena e autoprotezione 5,
                    A, B e C 10-15, D 5-10, E 10, comunicazione alla SOREU 5. In tutto <strong>80 punti</strong>.
                </li>
                <li>
                    Una fase fatta a metà vale in proporzione alle azioni fatte, arrotondando per difetto: in una B da
                    15 punti con 6 azioni, 4 azioni fatte valgono 10 punti.
                </li>
                <li>
                    Rivalutazione e consegna non danno punti ma, se mancano, ne tolgono come nella griglia:
                    fino a <strong>−3</strong> la rivalutazione e fino a <strong>−2</strong> la consegna, in proporzione
                    a quello che manca.
                </li>
            </ul>
        </section>

        <section>
            <h2>Quando lo scenario non è superato</h2>
            <ul>
                <li>
                    Se il punteggio è sotto il <strong>{{ soglia }}%</strong> degli 80 punti, cioè sotto
                    <strong>{{ Math.ceil(80 * SOGLIA) }}</strong>: è la stessa soglia della prova pratica del corso.
                </li>
                <li>
                    Se manca l'<strong>allerta della SOREU</strong> davanti a segni che compromettono la sopravvivenza,
                    dove la griglia la prevede: lo scenario è invalidato, qualunque sia il punteggio.
                </li>
                <li>
                    Gli <strong>errori gravi</strong> tolgono {{ PENALITA_ERRORE_GRAVE }} punti ciascuno: da soli
                    bastano per restare sotto la soglia.
                </li>
                <li>
                    Un'<strong>autoprotezione incompleta</strong> toglie {{ PENALITA_AUTOPROTEZIONE }} punti oltre a
                    quelli della fase: da sola non basta a non superare lo scenario, ma pesa.
                </li>
            </ul>
        </section>

        <aside class="istruttori">
            <p class="titolo">
                <FontAwesome icon="chalkboard-user" /> Dagli istruttori
            </p>
            <p>
                Le griglie non lo scrivono, ma questi due errori dovrebbero bastare a non superare lo scenario:
            </p>
            <ul>
                <li><strong>Non chiedere se la scena è sicura</strong>, in qualunque scenario.</li>
                <li>
                    <strong>Non far immobilizzare il rachide cervicale</strong>, quando la griglia lo chiede (i
                    traumatici con una dinamica che coinvolge la colonna, e i medici con una caduta).
                </li>
            </ul>
            <p>
                Anche <strong>non fare l'autoprotezione</strong> è un errore: non da bocciatura, ma fa parte della
                sicurezza.
            </p>
        </aside>

        <section>
            <h2>Da solo</h2>
            <p>
                Le azioni che non spunti, o che non arrivi a vedere perché termini prima, contano come non fatte.
                Il punteggio dice se ti erano venute in mente, non se le avresti eseguite bene.
            </p>
        </section>
    </div>
</template>

<style lang="scss" scoped>
    #scenari-punteggio-page
    {
        padding-bottom: 2rem;
        padding-top: calc(var(--navigation-bar-height) + 1rem);

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

        h1
        {
            font-weight: 700;
        }

        h2
        {
            font-size: 1.15rem;
            font-weight: 700;
            margin-top: 1.5rem;
        }

        ul
        {
            padding-left: 1.25rem;

            li + li
            {
                margin-top: 0.4rem;
            }
        }

        .avviso
        {
            background-color: color-mix(in srgb, var(--app-warning) 15%, var(--app-surface));
            border-left: 4px solid var(--app-warning);
            border-radius: 0.375rem;
            display: flex;
            gap: 0.75rem;
            margin: 1rem 0;
            padding: 0.75rem 1rem;

            .fa
            {
                color: var(--app-warning);
                margin-top: 0.2rem;
            }
        }

        .istruttori
        {
            background-color: color-mix(in srgb, var(--app-success) var(--app-callout-mix), var(--app-surface));
            border-left: 4px solid var(--app-success);
            border-radius: 0.375rem;
            margin: 1.5rem 0 0;
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

            ul
            {
                margin-bottom: 0;
            }
        }
    }
</style>

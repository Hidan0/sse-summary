<script lang="ts" setup>
    import FontAwesome from "@/components/ui/FontAwesome.vue";
</script>

<template>
    <div id="avvertenze-page" class="container page">
        <h1>Avvertenze</h1>
        <p class="lead">
            Questo sito è uno strumento di ripasso personale, non materiale ufficiale.
            Leggi queste avvertenze prima di usarlo.
        </p>

        <section>
            <h2><FontAwesome icon="book" /> Da dove vengono i contenuti</h2>
            <ul>
                <li>
                    I contenuti riassumono il materiale del corso di <strong>Soccorso Sanitario Extraospedaliero
                        (SSE)</strong> e del corso di <strong>Trasporto Sanitario (TSS)</strong> di
                    <strong>AREU Lombardia</strong>: slide delle lezioni, manuali e schede di valutazione.
                </li>
                <li>
                    Il materiale di riferimento è in gran parte la <strong>revisione del 2017</strong>
                    (le schede degli scenari sono del 2018).
                </li>
                <li>
                    Il materiale originale <strong>non è pubblicato</strong> su questo sito e resta dei rispettivi
                    autori. Ogni affermazione indica la lezione e la pagina da cui è tratta, così puoi verificarla.
                </li>
                <li>
                    Il sito <strong>non è affiliato ad AREU</strong> né a nessun ente di soccorso.
                </li>
            </ul>
        </section>

        <section class="evidenza">
            <h2><FontAwesome icon="triangle-exclamation" /> Protocolli non aggiornati</h2>
            <p>
                Il materiale riflette i protocolli insegnati nel corso, alcuni dei quali <strong>sono superati</strong>:
                in servizio si applicano procedure diverse (per esempio sull'uso dell'ossigeno).
            </p>
            <p>
                <strong>In servizio valgono sempre i protocolli e le istruzioni operative AREU in vigore, le
                    indicazioni della SOREU e quelle dei tuoi istruttori e della tua associazione.</strong>
            </p>
        </section>

        <section>
            <h2><FontAwesome icon="robot" /> Riassunti scritti con l'intelligenza artificiale</h2>
            <ul>
                <li>
                    Riassunti, glossario e schede ABCDE sono stati
                    <strong>scritti con l'intelligenza artificiale</strong>
                    partendo dal materiale del corso, e poi controllati a campione e con verifiche automatiche.
                </li>
                <li>
                    <strong>Possono contenere errori o imprecisioni.</strong> Nel dubbio fa fede il materiale del corso.
                </li>
                <li>
                    I riquadri viola <strong>"Da verificare"</strong> segnalano punti in cui il materiale è ambiguo o
                    contraddittorio. Alcune integrazioni vengono dalle indicazioni degli istruttori: quando è così,
                    il testo lo dice.
                </li>
            </ul>
        </section>

        <section>
            <h2><FontAwesome icon="list-check" /> Quiz</h2>
            <ul>
                <li>
                    Le domande sono <strong>generate con l'intelligenza artificiale</strong>: non sono domande ufficiali
                    d'esame e non sono state controllate né validate da istruttori o esaminatori.
                </li>
                <li>
                    Ogni domanda è stata verificata in automatico sulla fonte citata, ma può contenere errori.
                    La simulazione riproduce il formato dell'esame, non le sue domande.
                </li>
            </ul>
        </section>

        <section>
            <h2><FontAwesome icon="circle-info" /> In sintesi</h2>
            <p>
                Usa il sito per <strong>ripassare</strong>, non per imparare procedure da applicare:
                non sostituisce il corso, gli istruttori né i protocolli.
                Se trovi un errore, <a href="https://github.com/Hidan0/sse-summary/issues"
                                       target="_blank"
                                       title="Segnala un problema su GitHub">segnalalo</a>.
            </p>
        </section>
    </div>
</template>

<style lang="scss" scoped>
    @use "@/assets/scss/variables";

    #avvertenze-page
    {
        max-width: 800px;
        padding-bottom: 3rem;
        padding-top: calc(var(--navigation-bar-height) + 1.5rem);

        h1
        {
            font-weight: 700;
        }

        section
        {
            background-color: var(--app-surface);
            border-radius: 0.375rem;
            box-shadow: 0px 0.125em 0.5em var(--app-shadow);
            margin-top: 1rem;
            padding: 1rem 1.25rem;

            h2
            {
                font-size: 1.15rem;
                margin-bottom: 0.75rem;

                .fa
                {
                    color: var(--app-accent);
                    margin-right: 0.25rem;
                }
            }

            ul
            {
                margin-bottom: 0;
                padding-left: 1.25rem;

                li + li
                {
                    margin-top: 0.4rem;
                }
            }

            p:last-child
            {
                margin-bottom: 0;
            }

            &.evidenza
            {
                border-left: 4px solid variables.$warning;

                h2 .fa
                {
                    color: variables.$warning;
                }
            }
        }
    }
</style>

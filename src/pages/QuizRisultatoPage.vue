<script lang="ts" setup>
    import { computed } from "vue";
    import { useRoute } from "vue-router";

    import QuizRisultati from "@/components/quiz/QuizRisultati.vue";
    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { useQuizDaLink } from "@/composables/quiz-da-link";

    const route = useRoute();
    const { stato, quiz } = useQuizDaLink();

    // "Prova anche tu": stesse domande, come sfida. Si toglie `r` per non passare le risposte.
    const querySfida = computed(() =>
    {
        const { r, ...resto } = route.query;

        return resto;
    });

    const titolo = computed(() => ((quiz.value?.dati.modalita === "simulazione") ?
        "Simulazione d'esame" :
        "Quiz di allenamento"));
</script>

<template>
    <div id="quiz-risultato-page" class="container page">
        <div v-if="stato === 'caricamento'" class="loading">
            <div class="spinner-border text-primary" role="status"></div>
        </div>

        <section v-else-if="stato === 'errore' || !quiz" class="card errore">
            <h1>Link non valido</h1>
            <p>Il link del risultato è incompleto o le sue domande non esistono più.</p>
            <RouterLink class="btn btn-primary" :to="{ name: 'quiz' }">
                Vai ai quiz
            </RouterLink>
        </section>

        <template v-else>
            <header class="intestazione">
                <p class="tipo">
                    <FontAwesome icon="share-nodes" /> Risultato condiviso · sola lettura
                </p>
                <h1>{{ titolo }}</h1>
                <p v-if="quiz.mancanti" class="avviso">
                    <FontAwesome icon="triangle-exclamation" />
                    {{ quiz.mancanti }}
                    {{ quiz.mancanti === 1 ? "domanda non esiste più" : "domande non esistono più" }}
                    nel sito e non {{ quiz.mancanti === 1 ? "è mostrata" : "sono mostrate" }}.
                </p>
            </header>

            <QuizRisultati :domande="quiz.domande"
                           :risposte="quiz.risposte"
                           :modalita="quiz.dati.modalita"
                           :durata="quiz.dati.durata">
                <template #azioni>
                    <RouterLink class="btn btn-primary" :to="{ name: 'quiz-sfida', query: querySfida }">
                        <FontAwesome icon="flag-checkered" /> Prova anche tu queste domande
                    </RouterLink>
                    <RouterLink class="btn btn-outline-secondary" :to="{ name: 'quiz' }">
                        Vai ai quiz
                    </RouterLink>
                </template>
            </QuizRisultati>
        </template>
    </div>
</template>

<style lang="scss" scoped>
    @use "@/assets/scss/variables";

    #quiz-risultato-page
    {
        max-width: 760px;
        padding-bottom: 3rem;
        padding-top: calc(var(--navigation-bar-height) + 1.5rem);

        .loading
        {
            display: flex;
            justify-content: center;
            padding: 3rem 0;
        }

        .errore
        {
            background-color: var(--app-surface);
            border: none;
            box-shadow: 0px 0.125em 0.5em var(--app-shadow);
            padding: 1.5rem;
        }

        .intestazione
        {
            margin-bottom: 1rem;

            .tipo
            {
                color: var(--app-muted);
                font-size: 0.8em;
                font-weight: 700;
                letter-spacing: 0.05em;
                margin-bottom: 0.25rem;
                text-transform: uppercase;
            }

            h1
            {
                font-weight: 700;
            }

            .avviso
            {
                color: variables.$warning;
            }
        }
    }
</style>

<script lang="ts" setup>
    import { computed, nextTick, reactive, ref, watch } from "vue";
    import { useRoute } from "vue-router";

    import MarkdownContent from "@/components/content/MarkdownContent.vue";
    import FontAwesome from "@/components/ui/FontAwesome.vue";
    import { scenarioBySlug, TIPI_SCENARIO } from "@/content/scenari";
    import type { FaseScenario, ScenarioModule } from "@/content/types";

    const props = defineProps({
        slug: {
            type: String,
            required: true
        }
    });

    const route = useRoute();

    const scenario = computed(() => scenarioBySlug.get(props.slug));
    const tipo = computed(() => TIPI_SCENARIO.find(({ id }) => id === scenario.value?.tipo));

    /*
     * La modalità si sceglie nella pagina degli scenari (predefinita: esaminatore).
     * Esaminatore: tutto aperto, perché il candidato può fare le cose in un ordine diverso;
     * si spunta ciò che fa e si leggono i reperti quando li chiede.
     * Da solo: si procede un passo alla volta (il titolo di una fase, poi una sua azione con il reperto),
     * perché all'esame i reperti arrivano uno per uno e le decisioni dipendono da quelli.
     */
    const esaminatore = computed(() => route.query.modo !== "solo");

    const contenuto = ref<ScenarioModule>();
    const spuntate = reactive(new Set<string>());
    const passo = ref(0);
    const terminato = ref(false);

    const ricomincia = () =>
    {
        spuntate.clear();
        passo.value = 0;
        terminato.value = false;
        window.scrollTo({ top: 0 });
    };

    watch(scenario, async (value) =>
    {
        contenuto.value = undefined;
        ricomincia();
        if (value) { contenuto.value = await value.load(); }

    }, { immediate: true });
    watch(esaminatore, ricomincia);

    const chiave = (fase: FaseScenario, indice: number) => `${fase.id}:${indice}`;

    // Sequenza dei passi da solo: per ogni fase prima il titolo (riga -1), poi le azioni.
    const passi = computed(() => (contenuto.value?.fasi ?? [])
        .flatMap((fase, indiceFase) => [-1, ...fase.righe.keys()].map((riga) => ({ fase: indiceFase, riga: riga }))));
    const posizione = (indiceFase: number, riga: number) =>
        passi.value.findIndex((value) => (value.fase === indiceFase) && (value.riga === riga));

    const isVisibile = (indiceFase: number, riga = -1) =>
        esaminatore.value || (posizione(indiceFase, riga) <= passo.value);
    const corrente = computed(() => passi.value[passo.value]);
    const finito = computed(() => esaminatore.value || (passo.value >= passi.value.length - 1));

    const mostra = async (nuovo: number) =>
    {
        passo.value = Math.min(nuovo, passi.value.length - 1);
        await nextTick();
        document.querySelector(".passo-corrente")?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    const avanti = () => mostra(passo.value + 1);
    const mostraFase = () =>
    {
        const fase = corrente.value?.fase ?? 0;

        return mostra(posizione(fase, (contenuto.value?.fasi[fase].righe.length ?? 1) - 1));
    };
    const faseCompleta = computed(() =>
    {
        const value = corrente.value;

        return !value || (value.riga === (contenuto.value?.fasi[value.fase].righe.length ?? 0) - 1);
    });
    const intestazione = (fase: FaseScenario) => (fase.lettera ? `${fase.lettera} · ${fase.titolo}` : fase.titolo);

    const alterna = (valore: string) =>
    {
        if (spuntate.has(valore)) { spuntate.delete(valore); }
        else { spuntate.add(valore); }
    };

    const resoconto = computed(() =>
    {
        const fasi = (contenuto.value?.fasi ?? []).map((fase) =>
        {
            const mancate = fase.righe.filter((_, indice) => !spuntate.has(chiave(fase, indice)));

            return { fase: fase, mancate: mancate, totale: fase.righe.length };
        });

        return {
            fasi: fasi.filter(({ mancate }) => mancate.length),
            fatte: fasi.reduce((somma, { mancate, totale }) => somma + totale - mancate.length, 0),
            totale: fasi.reduce((somma, { totale }) => somma + totale, 0),
            gravi: fasi.filter(({ fase, mancate }) => fase.grave && mancate.length)
        };
    });

    const fonte = computed(() => (contenuto.value ?
        `<p>Griglia del corso, ${contenuto.value.revisione}. ${contenuto.value.citazione}</p>` :
        ""));

    const termina = async () =>
    {
        terminato.value = true;
        await nextTick();
        document.getElementById("resoconto")?.scrollIntoView({ block: "start" });
    };
</script>

<template>
    <div id="scenario-page" class="container page">
        <!-- eslint-disable vue/no-v-html -->
        <template v-if="scenario">
            <nav class="breadcrumbs">
                <RouterLink :to="{ name: 'scenari' }">
                    Scenari
                </RouterLink>
                <FontAwesome icon="chevron-right" />
                <span v-if="tipo">{{ tipo.nome }}</span>
            </nav>

            <header class="intestazione">
                <p class="categoria">
                    {{ scenario.categoria }}
                </p>
                <h1>Scenario {{ scenario.numero }}</h1>
            </header>

            <p class="modo">
                <FontAwesome :icon="esaminatore ? 'user-group' : 'user'" />
                {{ esaminatore ? "Modalità esaminatore" : "Da solo" }}
            </p>
            <p class="spiegazione text-secondary">
                <template v-if="esaminatore">
                    Leggi il filtro al candidato. Spunta le azioni man mano che le fa e digli i reperti quando li
                    chiede o li cerca.
                </template>
                <template v-else>
                    Leggi il filtro. Poi, con «Avanti», compaiono una alla volta le fasi e le azioni con il loro
                    reperto: prima di andare avanti chiediti cosa faresti, e spunta le azioni che avevi pensato.
                </template>
            </p>

            <div v-if="!contenuto" class="loading">
                <div class="spinner-border text-primary" role="status"></div>
            </div>
            <template v-else>
                <section class="filtro">
                    <h2>
                        <FontAwesome icon="tower-broadcast" /> Informazioni dalla SOREU
                        <span v-if="contenuto.filtro.fittizio" class="esempio">esempio</span>
                    </h2>
                    <dl>
                        <template v-for="[etichetta, valore] in contenuto.filtro.voci" :key="etichetta">
                            <dt>{{ etichetta }}</dt>
                            <dd>{{ valore }}</dd>
                        </template>
                    </dl>
                </section>

                <section v-if="esaminatore" class="sintesi">
                    <h2><FontAwesome icon="user-doctor" /> Il caso, per l'esaminatore</h2>
                    <MarkdownContent :html="contenuto.sintesi" />
                    <p class="mezzi">
                        MSA: <strong>{{ contenuto.msa ? "sì" : "no" }}</strong> ·
                        Forze dell'ordine: <strong>{{ contenuto.forzeOrdine ? "sì" : "no" }}</strong>
                    </p>
                </section>

                <template v-for="(fase, indiceFase) in contenuto.fasi" :key="fase.id">
                    <section v-if="isVisibile(indiceFase)"
                             class="fase"
                             :class="{
                                 'grave': fase.grave,
                                 'passo-corrente': !esaminatore && corrente?.fase === indiceFase && corrente.riga === -1
                             }">
                        <h2>
                            <span>{{ intestazione(fase) }}</span>
                            <span v-if="fase.grave" class="etichetta-grave">errore grave</span>
                        </h2>

                        <p v-if="!isVisibile(indiceFase, 0)" class="pensaci text-secondary">
                            Cosa fai in questa fase?
                        </p>
                        <ul v-else class="righe">
                            <template v-for="(riga, indice) in fase.righe" :key="indice">
                                <li v-if="isVisibile(indiceFase, indice)"
                                    :class="{
                                        'passo-corrente': !esaminatore && corrente?.fase === indiceFase &&
                                            corrente.riga === indice
                                    }">
                                    <label>
                                        <input type="checkbox"
                                               :checked="spuntate.has(chiave(fase, indice))"
                                               :disabled="terminato"
                                               @change="alterna(chiave(fase, indice))" />
                                        <span class="azione" v-html="riga.azione"></span>
                                    </label>
                                    <p v-if="riga.reperto"
                                       class="reperto"
                                       v-html="riga.reperto"></p>
                                </li>
                            </template>
                        </ul>
                    </section>
                </template>

                <div v-if="!terminato && !finito" class="barra-avanti">
                    <span class="progresso">
                        Fase {{ (corrente?.fase ?? 0) + 1 }} di {{ contenuto.fasi.length }}
                        <button type="button"
                                class="btn btn-link termina-ora"
                                @click="termina">
                            Termina ora
                        </button>
                    </span>
                    <button v-if="!faseCompleta"
                            type="button"
                            class="btn btn-outline-primary btn-sm"
                            @click="mostraFase">
                        Tutta la fase
                    </button>
                    <button type="button"
                            class="btn btn-primary"
                            @click="avanti">
                        Avanti <FontAwesome icon="arrow-down" />
                    </button>
                </div>

                <div v-if="!terminato && finito" class="azioni-finali">
                    <button type="button"
                            class="btn btn-primary"
                            @click="termina">
                        <FontAwesome icon="flag-checkered" /> Termina e vedi il resoconto
                    </button>
                </div>

                <section v-if="terminato"
                         id="resoconto"
                         class="resoconto"
                         :class="resoconto.gravi.length ? 'ko' : 'ok'">
                    <h2>
                        <FontAwesome :icon="resoconto.gravi.length ? 'circle-xmark' : 'circle-check'" />
                        {{ resoconto.gravi.length ? "Scenario non superato" : "Scenario superato" }}
                    </h2>
                    <div v-if="resoconto.gravi.length" class="motivo">
                        <p>Manca un'azione obbligatoria, senza la quale lo scenario è invalidato:</p>
                        <ul>
                            <li v-for="riga in resoconto.gravi.flatMap(({ mancate }) => mancate)"
                                :key="riga.azione"
                                v-html="riga.azione"></li>
                        </ul>
                    </div>
                    <p>
                        {{ esaminatore ? "Azioni fatte" : "Azioni pensate" }}:
                        <strong>{{ resoconto.fatte }} su {{ resoconto.totale }}</strong>.
                    </p>

                    <template v-if="resoconto.fasi.length">
                        <h3>{{ esaminatore ? "Non fatte" : "Non pensate" }}</h3>
                        <div v-for="{ fase, mancate } in resoconto.fasi"
                             :key="fase.id"
                             class="mancate">
                            <p class="nome-fase">
                                {{ intestazione(fase) }}
                            </p>
                            <ul>
                                <li v-for="(riga, indice) in mancate"
                                    :key="indice"
                                    v-html="riga.azione"></li>
                            </ul>
                        </div>
                    </template>

                    <div class="bottoni">
                        <button type="button"
                                class="btn btn-primary"
                                @click="ricomincia">
                            <FontAwesome icon="rotate-left" /> Ricomincia
                        </button>
                        <RouterLink class="btn btn-outline-primary" :to="{ name: 'scenari' }">
                            Altri scenari
                        </RouterLink>
                    </div>
                </section>

                <div class="fonte">
                    <MarkdownContent :html="fonte" />
                </div>
            </template>
        </template>

        <template v-else>
            <h1>Scenario non trovato</h1>
            <RouterLink :to="{ name: 'scenari' }">
                Torna agli scenari
            </RouterLink>
        </template>
        <!-- eslint-enable vue/no-v-html -->
    </div>
</template>

<style lang="scss" scoped>
    #scenario-page
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

        .intestazione
        {
            .categoria
            {
                color: var(--app-muted);
                font-size: 0.85em;
                font-weight: 700;
                letter-spacing: 0.05em;
                margin-bottom: 0.25rem;
                text-transform: uppercase;
            }

            h1
            {
                font-weight: 700;
            }
        }

        .modo
        {
            color: var(--app-accent);
            font-weight: 700;
            margin: 0.75rem 0 0.25rem;
        }

        .spiegazione
        {
            font-size: 0.9em;
        }

        .loading
        {
            padding: 2rem 0;
            text-align: center;
        }

        section
        {
            background-color: var(--app-surface);
            border-radius: 0.375rem;
            box-shadow: 0px 0.125em 0.5em var(--app-shadow);
            margin-bottom: 0.75rem;
            padding: 0.75rem 1rem;

            h2
            {
                align-items: center;
                display: flex;
                font-size: 1.05rem;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
            }
        }

        .filtro
        {
            border-left: 4px solid var(--app-primary);

            .esempio
            {
                background-color: var(--app-accent-soft);
                border-radius: 0.375rem;
                color: var(--app-accent);
                font-size: 0.7em;
                font-weight: 700;
                padding: 0.15em 0.5em;
                text-transform: uppercase;
            }

            dl
            {
                display: grid;
                gap: 0.25rem 1rem;
                grid-template-columns: max-content 1fr;
                margin-bottom: 0;
            }
            dt
            {
                color: var(--app-muted);
                font-weight: 400;
            }
            dd
            {
                font-weight: 500;
                margin-bottom: 0;
            }
        }

        .sintesi
        {
            background-color: color-mix(in srgb, var(--app-mauve) var(--app-callout-mix), var(--app-surface));
            border-left: 4px solid var(--app-mauve);

            .mezzi
            {
                color: var(--app-muted);
                font-size: 0.9em;
                margin-bottom: 0;
            }
            :deep(.markdown-content) > :last-child
            {
                margin-bottom: 0.5rem;
            }
        }

        .fase
        {
            &.grave
            {
                border-left: 4px solid var(--app-danger);

                .etichetta-grave
                {
                    color: var(--app-danger);
                    font-size: 0.7em;
                    font-weight: 700;
                    text-transform: uppercase;
                }
            }
        }

        .righe
        {
            list-style: none;
            margin: 0;
            padding: 0;

            li + li
            {
                border-top: 1px solid var(--app-border-soft);
            }
            li
            {
                padding: 0.4rem 0;
            }

            label
            {
                align-items: flex-start;
                cursor: pointer;
                display: flex;
                gap: 0.6rem;
            }
            input
            {
                accent-color: var(--app-primary);
                flex-shrink: 0;
                height: 1.15rem;
                margin-top: 0.2rem;
                width: 1.15rem;
            }
            .reperto
            {
                background-color: var(--app-accent-soft);
                border-radius: 0.375rem;
                font-size: 0.92em;
                margin: 0.3rem 0 0 1.75rem;
                padding: 0.25rem 0.6rem;
            }
        }

        .pensaci
        {
            font-style: italic;
            margin-bottom: 0;
        }

        .passo-corrente
        {
            scroll-margin-bottom: 5rem;
        }

        // Da solo: «Avanti» sempre nello stesso punto, sopra la barra delle sezioni.
        .barra-avanti
        {
            align-items: center;
            background-color: var(--app-surface);
            border-radius: 0.5rem;
            bottom: calc(var(--tab-bar-height) + 0.75rem);
            box-shadow: 0px 0.25em 1em var(--app-shadow);
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;
            padding: 0.5rem 0.5rem 0.5rem 1rem;
            position: sticky;
            z-index: 1;

            .progresso
            {
                color: var(--app-muted);
                display: flex;
                flex: 1 1 auto;
                flex-direction: column;
                font-size: 0.85em;
                line-height: 1.3;
            }
            .termina-ora
            {
                align-self: flex-start;
                font-size: 1em;
                padding: 0;
            }
            .btn
            {
                white-space: nowrap;
            }
        }

        .azioni-finali
        {
            margin: 1.25rem 0;
            text-align: center;
        }

        .resoconto
        {
            border-top: 4px solid var(--esito-color);
            margin-top: 1.25rem;

            &.ok { --esito-color: var(--app-success); }
            &.ko { --esito-color: var(--app-danger); }

            h2
            {
                color: var(--esito-color);
                font-size: 1.3rem;
            }
            h3
            {
                font-size: 1.05rem;
                margin-top: 1rem;
            }
            .nome-fase
            {
                font-weight: 700;
                margin-bottom: 0.25rem;
            }
            .mancate ul
            {
                margin-bottom: 0.5rem;
                padding-left: 1.25rem;
            }
            .bottoni
            {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-top: 1rem;
            }
        }

        .fonte
        {
            color: var(--app-muted);
            font-size: 0.85em;
            margin-top: 1rem;
        }
    }
</style>

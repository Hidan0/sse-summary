import { compareOrdine, parseOrdineSlug } from "./ordine";
import type { Scenario, ScenarioMeta, ScenarioModule, TipoScenario } from "./types";

export const TIPI_SCENARIO: { id: TipoScenario, nome: string, icona: string }[] = [
    { id: "trauma", nome: "Trauma", icona: "car-burst" },
    { id: "medico", nome: "Medico", icona: "stethoscope" }
];

const scenariMeta = import.meta.glob<ScenarioMeta>("./scenari/*.yaml", {
    query: "?meta", import: "default", eager: true
});
const scenariFull = import.meta.glob<ScenarioModule>("./scenari/*.yaml", { import: "default" });

/*
 * I file si chiamano `<numero>-<slug>.yaml`, con il numero dello scenario nel PDF del corso.
 */
export const scenari: Scenario[] = Object.entries(scenariMeta)
    .map(([path, meta]) => ({
        ...meta,
        ...parseOrdineSlug(path.replace(/\.yaml$/, ".md")),
        load: scenariFull[path]
    }))
    .sort((a, b) => compareOrdine(a.ordine, b.ordine));

export const scenarioBySlug = new Map(scenari.map((value) => [value.slug, value]));

export function getScenariByTipo(tipo: TipoScenario): Scenario[]
{
    return scenari.filter((value) => value.tipo === tipo);
}

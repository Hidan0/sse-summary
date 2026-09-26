import { compareOrdine, parseOrdineSlug } from "./ordine";
import type { GruppoSkill, Skill, SkillMeta, SkillModule } from "./types";

export const GRUPPI_SKILL: { id: GruppoSkill, nome: string, modulo: string, icona: string }[] = [
    { id: "blsd", nome: "BLSD", modulo: "SSE", icona: "heart-pulse" },
    { id: "trauma", nome: "Trauma", modulo: "SSE", icona: "car-burst" },
    { id: "tss", nome: "BLSD e disostruzione", modulo: "TSS", icona: "heart-circle-bolt" }
];

const skillMeta = import.meta.glob<SkillMeta>("./skill/*.yaml", { query: "?meta", import: "default", eager: true });
const skillFull = import.meta.glob<SkillModule>("./skill/*.yaml", { import: "default" });

/*
 * I file si chiamano `<ordine>-<slug>.yaml`, come i riassunti.
 */
export const skill: Skill[] = Object.entries(skillMeta)
    .map(([path, meta]) => ({
        ...meta,
        ...parseOrdineSlug(path.replace(/\.yaml$/, ".md")),
        load: skillFull[path]
    }))
    .sort((a, b) => compareOrdine(a.ordine, b.ordine));

export const skillBySlug = new Map(skill.map((value) => [value.slug, value]));

export function getSkillByGruppo(gruppo: GruppoSkill): Skill[]
{
    return skill.filter((value) => value.gruppo === gruppo);
}

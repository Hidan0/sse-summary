import { capitoli } from "./capitoli";
import type { Capitolo } from "./capitoli";
import { compareOrdine, parseOrdineSlug } from "./ordine";
import { slugify } from "./slug";
import type {
    MarkdownMeta,
    MarkdownModule,
    Riassunto,
    RiassuntoFrontmatter,
    VoceGlossario,
    VoceGlossarioFrontmatter
} from "./types";

export { capitoli } from "./capitoli";
export { fonti } from "./fonti";
export type * from "./types";

const riassuntiMeta = import.meta.glob<MarkdownMeta<RiassuntoFrontmatter>>("./riassunti/**/*.md", {
    query: "?meta",
    import: "default",
    eager: true
});
const riassuntiFull = import.meta.glob<MarkdownModule<RiassuntoFrontmatter>>("./riassunti/**/*.md", {
    import: "default"
});

const glossarioMeta = import.meta.glob<MarkdownMeta<VoceGlossarioFrontmatter>>("./glossario/*.md", {
    query: "?meta",
    import: "default",
    eager: true
});
const glossarioFull = import.meta.glob<MarkdownModule<VoceGlossarioFrontmatter>>("./glossario/*.md", {
    import: "default"
});

function basename(path: string): string
{
    return path.slice(path.lastIndexOf("/") + 1, -".md".length);
}

export const riassunti: Riassunto[] = Object.entries(riassuntiMeta)
    .map(([path, { frontmatter, toc, glossario: terms }]) => ({
        ...frontmatter,
        ...parseOrdineSlug(path),
        toc: toc,
        glossario: terms,
        load: riassuntiFull[path]
    }))
    .sort((a, b) => (a.capitolo - b.capitolo) || compareOrdine(a.ordine, b.ordine));

export const riassuntiBySlug = new Map(riassunti.map((riassunto) => [riassunto.slug, riassunto]));

export function getRiassuntiByCapitolo(capitolo: Capitolo): Riassunto[]
{
    return riassunti.filter((riassunto) => riassunto.capitolo === capitolo.numero);
}
export function getCapitolo(numero: number): Capitolo | undefined
{
    return capitoli.find((capitolo) => capitolo.numero === numero);
}

export const glossario: VoceGlossario[] = Object.entries(glossarioMeta)
    .map(([path, { frontmatter }]) => ({
        ...frontmatter,
        slug: basename(path),
        load: glossarioFull[path]
    }))
    .sort((a, b) => a.termine.localeCompare(b.termine, "it"));

/*
 * Ogni voce è raggiungibile dal suo slug, dal termine e da ciascun sinonimo.
 */
const glossarioByKey = new Map<string, VoceGlossario>();
for (const voce of glossario)
{
    for (const key of [voce.slug, voce.termine, ...(voce.sinonimi ?? [])])
    {
        glossarioByKey.set(slugify(key), voce);
    }
}

export function findVoceGlossario(term: string): VoceGlossario | undefined
{
    return glossarioByKey.get(slugify(term));
}

export function getRiassuntiCheCitano(voce: VoceGlossario): Riassunto[]
{
    return riassunti.filter((riassunto) => riassunto.glossario.some((term) => findVoceGlossario(term) === voce));
}

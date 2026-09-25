import { CATEGORIE } from "./abcde-sezioni";
import { compareOrdine, parseOrdineSlug } from "./ordine";
import type {
    AbcdeMeta,
    AbcdeModule,
    SchedaAbcde,
    SchedaAbcdeFrontmatter,
    SchemaAbcdeFrontmatter,
    TipoSchema
} from "./types";

export { CATEGORIE, getLettera, SEZIONI, VOCI } from "./abcde-sezioni";

const schemiFull = import.meta.glob<AbcdeModule<SchemaAbcdeFrontmatter>>("./abcde/schemi/*.md", { import: "default" });

export function loadSchema(schema: TipoSchema): Promise<AbcdeModule<SchemaAbcdeFrontmatter>>
{
    return schemiFull[`./abcde/schemi/${schema}.md`]();
}

const schedeMeta = import.meta.glob<AbcdeMeta<SchedaAbcdeFrontmatter>>("./abcde/schede/*.md", {
    query: "?meta",
    import: "default",
    eager: true
});
const schedeFull = import.meta.glob<AbcdeModule<SchedaAbcdeFrontmatter>>("./abcde/schede/*.md", {
    import: "default"
});

const ordineCategorie = CATEGORIE.map(({ id }) => id);

export const schede: SchedaAbcde[] = Object.entries(schedeMeta)
    .map(([path, { frontmatter, sezioni }]) => ({
        ...frontmatter,
        ...parseOrdineSlug(path),
        sezioni: sezioni,
        load: schedeFull[path]
    }))
    .sort((a, b) => (ordineCategorie.indexOf(a.categoria) - ordineCategorie.indexOf(b.categoria)) ||
        compareOrdine(a.ordine, b.ordine));

export const schedeBySlug = new Map(schede.map((scheda) => [scheda.slug, scheda]));

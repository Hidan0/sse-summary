import type {
    AbcdeMeta,
    AbcdeModule,
    CategoriaAbcde,
    IdSezioneAbcde,
    SchedaAbcde,
    SchedaAbcdeFrontmatter,
    SchemaAbcdeFrontmatter,
    TipoSchema,
    TipoVoceAbcde
} from "./types";
import { compareOrdine, parseOrdineSlug } from "./ordine";

export const SEZIONI: { id: IdSezioneAbcde, lettera: string, nome: string }[] = [
    { id: "scena", lettera: "", nome: "Scena e colpo d'occhio" },
    { id: "a", lettera: "A", nome: "Vie aeree e coscienza" },
    { id: "b", lettera: "B", nome: "Respiro" },
    { id: "c", lettera: "C", nome: "Circolo" },
    { id: "d", lettera: "D", nome: "Stato neurologico" },
    { id: "e", lettera: "E", nome: "Esposizione e anamnesi" },
    { id: "dopo", lettera: "", nome: "SOREU, trasporto e rivalutazione" }
];

export const VOCI: Record<TipoVoceAbcde, { nome: string, icona: string }> = {
    cerca: { nome: "Cosa cercare", icona: "magnifying-glass" },
    chiedi: { nome: "Cosa chiedere", icona: "comments" },
    fai: { nome: "Cosa fare", icona: "hand-holding-medical" },
    attenzione: { nome: "Attenzione", icona: "triangle-exclamation" }
};

export const CATEGORIE: { id: CategoriaAbcde, nome: string, icona: string }[] = [
    { id: "trauma", nome: "Trauma", icona: "car-burst" },
    { id: "medico", nome: "Emergenze mediche", icona: "heart-pulse" },
    { id: "ostetrico", nome: "Ostetricia e neonato", icona: "person-pregnant" },
    { id: "ambientale", nome: "Emergenze ambientali", icona: "temperature-half" }
];

export function getLettera(sezione: IdSezioneAbcde, schema: TipoSchema): string
{
    if ((sezione === "a") && (schema === "trauma")) { return "Ac"; }

    return SEZIONI.find(({ id }) => id === sezione)?.lettera ?? "";
}

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

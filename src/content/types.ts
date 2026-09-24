export interface TocEntry
{
    id: string;
    level: number;
    text: string;
}

export interface MarkdownMeta<T>
{
    frontmatter: T;
    toc: TocEntry[];
    glossario: string[];
}
export interface MarkdownModule<T>
{
    frontmatter: T;
    toc: TocEntry[];
    html: string;
}

export type LetteraAbcde = "A" | "B" | "C" | "D" | "E";

export interface RiassuntoFrontmatter
{
    titolo: string;
    capitolo: number;
    abcde?: LetteraAbcde[];
    correlati?: string[];
}
export interface Riassunto extends RiassuntoFrontmatter
{
    slug: string;
    ordine: number[];
    toc: TocEntry[];
    glossario: string[];
    load: () => Promise<MarkdownModule<RiassuntoFrontmatter>>;
}

export interface VoceGlossarioFrontmatter
{
    termine: string;
    sinonimi?: string[];
    breve: string;
}
export interface VoceGlossario extends VoceGlossarioFrontmatter
{
    slug: string;
    load: () => Promise<MarkdownModule<VoceGlossarioFrontmatter>>;
}

export type IdSezioneAbcde = "scena" | "a" | "b" | "c" | "d" | "e" | "dopo";
export type TipoVoceAbcde = "cerca" | "chiedi" | "fai" | "attenzione";
export type TipoSchema = "medico" | "trauma";
export type CategoriaAbcde = "trauma" | "medico" | "ostetrico" | "ambientale";

export interface SezioneAbcde
{
    id: IdSezioneAbcde;
    intro: string;
    voci: { tipo: TipoVoceAbcde, html: string }[];
}
export interface AbcdeModule<T>
{
    frontmatter: T;
    intro: string;
    sezioni: SezioneAbcde[];
}
export interface AbcdeMeta<T>
{
    frontmatter: T;
    sezioni: IdSezioneAbcde[];
}

export interface SchemaAbcdeFrontmatter
{
    titolo: string;
}
export interface SchedaAbcdeFrontmatter
{
    titolo: string;
    categoria: CategoriaAbcde;
    schema: TipoSchema;
    riassunti?: string[];
}
export interface SchedaAbcde extends SchedaAbcdeFrontmatter
{
    slug: string;
    ordine: number[];
    sezioni: IdSezioneAbcde[];
    load: () => Promise<AbcdeModule<SchedaAbcdeFrontmatter>>;
}

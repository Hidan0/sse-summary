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

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
    capitolo: number | string;
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
    chiusura: string;
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

export type LivelloQuiz = "base" | "esame" | "numeri";
export type ModuloQuiz = "TSS" | "SSE";

export interface Domanda
{
    id: string;
    livello: LivelloQuiz;
    domanda: string;
    opzioni: string[];
    corretta: number;
    spiegazione: string;
    ripasso?: string;
    fissa: boolean;
}
export interface QuizModule
{
    titolo: string;
    modulo: ModuloQuiz;
    ordine: number;
    domande: Domanda[];
}
export interface QuizMeta
{
    titolo: string;
    modulo: ModuloQuiz;
    ordine: number;
    livelli: Record<LivelloQuiz, number>;
    totale: number;
}
export interface ArgomentoQuiz extends QuizMeta
{
    slug: string;
    load: () => Promise<QuizModule>;
}

export type GruppoSkill = "blsd" | "trauma" | "neonato" | "tss";

export interface SkillMeta
{
    titolo: string;
    intestazione: string;
    sottotitolo?: string;
    gruppo: GruppoSkill;
    fonte: string;
    revisione: string;
    riassunti: string[];
    passi: number;
    diagramma: boolean;
    errori: number;
    consigli: number;
}
export interface SkillModule extends Omit<SkillMeta, "passi" | "diagramma" | "errori" | "consigli">
{
    diagramma?: string;
    disegno?: { svg: string, testo: string };
    colonne: string[];
    avvertenza?: string;
    passi: string[][];
    nota?: string;
    commento?: string;
    errori: string[];
    consigli: string[];
    citazione: string;
}
export interface Skill extends SkillMeta
{
    slug: string;
    ordine: number[];
    load: () => Promise<SkillModule>;
}

export type TipoScenario = "trauma" | "medico";

export interface ScenarioMeta
{
    numero: number;
    titolo: string;
    tipo: TipoScenario;
    categoria: string;
    grave: boolean;
}
export interface RigaScenario
{
    azione: string;
    reperto?: string;
    // Se manca: errore grave (penalità fissa, vedi `punteggio-scenario.ts`).
    grave?: boolean;
    // Riga aggiunta da noi su indicazione degli istruttori: non conta nei punti della fase.
    istruttori?: boolean;
}
export interface FaseScenario
{
    id: string;
    titolo: string;
    lettera?: string;
    // Se manca un'azione di questa fase lo scenario è invalidato (allerta della SOREU).
    grave?: boolean;
    // Se non è completa: penalità in più (autoprotezione), senza invalidare.
    sicurezza?: boolean;
    punti?: number;
    penalita?: number;
    righe: RigaScenario[];
}
export interface ScenarioModule extends Omit<ScenarioMeta, "grave">
{
    revisione: string;
    msa: boolean | null;
    forzeOrdine: boolean | null;
    filtro: { fittizio: boolean, voci: [string, string][] };
    sintesi: string;
    fasi: FaseScenario[];
    citazione: string;
}
export interface Scenario extends ScenarioMeta
{
    slug: string;
    ordine: number[];
    load: () => Promise<ScenarioModule>;
}

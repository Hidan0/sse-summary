import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import container from "markdown-it-container";
import type { Plugin } from "vite";
import { parse as parseYaml } from "yaml";

import { fonti } from "../src/content/fonti";
import { slugify } from "../src/content/slug";

import { caricaDiagrammi, listDiagrammi, versioneTestuale } from "./diagrammi";

export const CALLOUTS: Record<string, string> = {
    essenziale: "In breve",
    esame: "Da ricordare per l'esame",
    pericolo: "Attenzione",
    nota: "Nota",
    dubbio: "Da verificare",
    istruttori: "Dagli istruttori"
};

export interface TocEntry
{
    id: string;
    level: number;
    text: string;
}
export interface CompiledMarkdown
{
    frontmatter: Record<string, unknown>;
    html: string;
    toc: TocEntry[];
    glossario: string[];
    fonti: string[];
    diagrammi: string[];
}

/*
 * I diagrammi già disegnati (vedi `vite/diagrammi.ts`), passati al parser nell'`env` di markdown-it.
 */
export type DiagrammiDisegnati = Map<string, { svg: string, testo: string }>;
interface EnvMarkdown
{
    [key: string]: unknown;
    diagrammi?: DiagrammiDisegnati;
    usati?: string[];
    aperti?: string[];
}

const GLOSSARY_RE = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;
const SOURCE_RE = /\[@([^:\]\s]+):([^\]]+)\]/g;
/*
 * Citazioni di fila nello stesso punto (`[@a:1] [@b:2]`), con gli spazi che le precedono:
 * diventano un'unica icona, attaccata alla parola prima con uno spazio che non va a capo.
 */
const SOURCE_GROUP_RE = /[ \t]*\[@[^:\]\s]+:[^\]]+\](?:[ \t]*\[@[^:\]\s]+:[^\]]+\])*/g;

function escapeHtml(text: string): string
{
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/*
 * Icona di una o più fonti citate nello stesso punto; il dettaglio si apre al tocco.
 */
function fonteHtml(citazioni: string[]): string
{
    const attributes = [
        "class=\"source-ref\"",
        "role=\"button\"",
        "tabindex=\"0\"",
        `data-fonti="${escapeHtml(JSON.stringify(citazioni))}"`,
        `title="${citazioni.map(escapeHtml).join("&#10;")}"`,
        `aria-label="${citazioni.length > 1 ? "Fonti" : "Fonte"}: ${escapeHtml(citazioni.join("; "))}"`
    ];

    return `<a ${attributes.join(" ")}></a>`;
}
function citazioniDaHtml(html: string): string[]
{
    const json = html.match(/data-fonti="([^"]*)"/)?.[1] ?? "[]";

    return JSON.parse(json.replace(/&quot;/g, "\"").replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")) as string[];
}

type Token = ReturnType<InstanceType<typeof MarkdownIt>["parse"]>[number];

const isFonte = (token: Token) => (token.type === "html_inline") && token.content.startsWith("<a class=\"source-ref\"");
const isSoloFonti = (inline: Token) => (inline.children ?? []).some(isFonte) && (inline.children ?? [])
    .every((child) => isFonte(child) || (child.type === "html_inline" && child.content === "</a>") ||
        (child.type === "text" && !child.content.trim()));

/*
 * Le fonti scritte su una riga a sé sotto un elenco o una tabella finirebbero da sole a capo:
 * si spostano sulla frase che introduce l'elenco, sul titolo della sezione o, dentro un riquadro,
 * alla fine dell'ultima voce (unendole a un'eventuale icona già presente alla fine).
 */
type StateCore = Parameters<Parameters<InstanceType<typeof MarkdownIt>["core"]["ruler"]["push"]>[1]>[0];

function spostaFontiIsolate({ tokens, Token: Costruttore }: StateCore): void
{
    const CHIUSURE = new Map([
        ["bullet_list_close", "bullet_list_open"],
        ["ordered_list_close", "ordered_list_open"],
        ["table_close", "table_open"]
    ]);

    for (let index = tokens.length - 3; index > 0; index -= 1)
    {
        const [open, inline, close] = tokens.slice(index, index + 3);
        if (open.type !== "paragraph_open" || close?.type !== "paragraph_close" || !isSoloFonti(inline)) { continue; }

        const prima = tokens[index - 1];
        const apertura = CHIUSURE.get(prima.type);
        if (!apertura) { continue; }

        let inizio = index - 2;
        const isApertura = (token: Token) => (token.type === apertura) && (token.level === prima.level);
        while (inizio >= 0 && !isApertura(tokens[inizio])) { inizio -= 1; }

        // Di solito subito prima c'è il titolo o la frase che introduce; altrimenti si usa il titolo della sezione.
        let precedente = inizio - 1;
        if (!["heading_close", "paragraph_close"].includes(tokens[precedente]?.type))
        {
            const isTitolo = (token: Token, i: number) => (i < inizio) && (token.type === "heading_close") &&
                (token.tag !== "h1");
            precedente = (prima.level === 0) ? tokens.findLastIndex(isTitolo) : -1;
        }
        // Dentro un riquadro, in ultima battuta, l'icona va alla fine dell'ultima voce.
        const ultimaVoce = tokens.findLastIndex((token, i) => (i > inizio) && (i < index) && (token.type === "inline"));
        const destinazione = (precedente > 0) ? tokens[precedente - 1].children : tokens[ultimaVoce]?.children;
        if (!destinazione) { continue; }

        const citazioni = inline.children!.filter(isFonte).flatMap((child) => citazioniDaHtml(child.content));

        const ultima = destinazione.at(-2);
        if (ultima && isFonte(ultima) && destinazione.at(-1)?.content === "</a>")
        {
            ultima.content = fonteHtml([...citazioniDaHtml(ultima.content), ...citazioni]);
        }
        else
        {
            const spazio = new Costruttore("text", "", 0);
            spazio.content = "\u00A0";
            const fonte = new Costruttore("html_inline", "", 0);
            fonte.content = fonteHtml(citazioni);
            const fine = new Costruttore("html_inline", "", 0);
            fine.content = "</a>";

            destinazione.push(spazio, fonte, fine);
        }

        tokens.splice(index, 3);
    }
}

function createRenderer(): InstanceType<typeof MarkdownIt>
{
    const md = new MarkdownIt({ html: true, typographer: false });

    for (const [name, title] of Object.entries(CALLOUTS))
    {
        md.use(container, name, {
            render: (tokens: { nesting: number }[], index: number) =>
            {
                if (tokens[index].nesting === 1)
                {
                    return `<aside class="callout callout-${name}"><p class="callout-title">${title}</p>\n`;
                }

                return "</aside>\n";
            }
        });
    }

    /*
     * `::: diagramma <slug>` inserisce il diagramma di flusso; il contenuto del blocco è la didascalia.
     */
    md.use(container, "diagramma", {
        validate: (params: string) => (/^diagramma\s+[a-z0-9-]+\s*$/).test(params.trim()),
        render: (tokens: { nesting: number, info: string }[], index: number, options: unknown, env: EnvMarkdown) =>
        {
            env.aperti ??= [];
            if (tokens[index].nesting === 1)
            {
                const slug = tokens[index].info.trim().split(/\s+/)[1];
                env.aperti.push(slug);
                (env.usati ??= []).push(slug);

                const disegno = env.diagrammi?.get(slug);

                return `<figure class="diagramma" data-diagramma="${slug}">` +
                    `<div class="diagramma-scroll">${disegno?.svg ?? ""}</div><figcaption>\n`;
            }

            const disegno = env.diagrammi?.get(env.aperti.pop() ?? "");
            const testo = disegno ?
                `<details class="diagramma-testo"><summary>Versione testuale</summary>${disegno.testo}</details>` :
                "";

            return `</figcaption>${testo}</figure>\n`;
        }
    });

    /*
     * I link interni (`/riassunti/<slug>`, `/glossario/<slug>`) diventano link
     * dell'hash router; quelli esterni si aprono in una nuova scheda.
     */
    const defaultLinkOpen = md.renderer.rules.link_open ?? ((tokens, index, options, env, self) =>
        self.renderToken(tokens, index, options));

    /* eslint-disable camelcase */
    md.renderer.rules.link_open = (tokens, index, options, env, self) =>
    {
        const href = String(tokens[index].attrGet("href") ?? "");
        if (href.startsWith("/")) { tokens[index].attrSet("href", `#${href}`); }
        else if ((/^https?:/).test(href)) { tokens[index].attrSet("target", "_blank"); }

        return defaultLinkOpen(tokens, index, options, env, self);
    };
    md.renderer.rules.table_open = () => "<div class=\"table-wrapper\"><table class=\"table\">\n";
    md.renderer.rules.table_close = () => "</table></div>\n";
    /* eslint-enable camelcase */

    md.core.ruler.push("fonti_isolate", spostaFontiIsolate);

    return md;
}

const renderer = createRenderer();

/*
 * La sintassi `[[...]]` e `[@...]` viene sostituita con HTML prima del parsing
 * così che la `|` degli alias non venga scambiata per un separatore di tabella.
 */
function replaceCustomSyntax(source: string, glossario: Set<string>, sources: Set<string>): string
{
    return source
        .replace(GLOSSARY_RE, (_, term: string, label?: string) =>
        {
            const slug = slugify(term);
            glossario.add(slug);

            return `<a class="glossary-term" data-term="${slug}">${escapeHtml((label ?? term).trim())}</a>`;
        })
        .replace(SOURCE_GROUP_RE, (group: string, offset: number, testo: string) =>
        {
            const citazioni = [...group.matchAll(SOURCE_RE)].map(([, id, pages]) =>
            {
                sources.add(id!);

                const fonte = fonti[id!];
                const pagine = pages!.split(",").map((page) => page.trim())
                    .join(", ");

                return fonte ? `${fonte.modulo} · ${fonte.titolo} · p. ${pagine}` : `Fonte sconosciuta: ${id}`;
            });

            // A inizio riga (per esempio sotto una tabella) si tiene il rientro, che conta per il Markdown.
            const rientro = group.match(/^[ \t]*/)![0];
            const spazio = (offset === 0 || testo[offset - 1] === "\n") ? rientro : (rientro ? "\u00A0" : "");

            return `${spazio}${fonteHtml(citazioni)}`;
        });
}

export function compileMarkdown(source: string, diagrammi?: DiagrammiDisegnati): CompiledMarkdown
{
    const { data, content } = matter(source);

    const glossario = new Set<string>();
    const sources = new Set<string>();
    const env: EnvMarkdown = { diagrammi: diagrammi, usati: [] };

    const envParser = env as unknown as Parameters<typeof renderer.parse>[1];
    const tokens = renderer.parse(replaceCustomSyntax(content, glossario, sources), envParser);

    const toc: TocEntry[] = [];
    const usedIds = new Set<string>();
    for (let index = 0; index < tokens.length; index += 1)
    {
        const token = tokens[index];
        if (token.type !== "heading_open") { continue; }

        const level = Number(token.tag.slice(1));
        const inline = tokens[index + 1];
        const text = (inline.children ?? [])
            .filter((child) => child.type === "text" || child.type === "code_inline")
            .map((child) => child.content)
            .join("")
            .trim();

        let id = slugify(text) || "sezione";
        for (let suffix = 2; usedIds.has(id); suffix += 1) { id = `${slugify(text)}-${suffix}`; }
        usedIds.add(id);

        token.attrSet("id", id);
        if (level === 2 || level === 3) { toc.push({ id, level, text }); }
    }

    return {
        frontmatter: data,
        html: renderer.renderer.render(tokens, renderer.options, envParser),
        toc: toc,
        glossario: [...glossario],
        fonti: [...sources],
        diagrammi: env.usati ?? []
    };
}

export const SEZIONI_ABCDE: Record<string, string> = {
    "Scena": "scena",
    "A": "a",
    "B": "b",
    "C": "c",
    "D": "d",
    "E": "e",
    "Dopo": "dopo"
};
export const CHIUSURA_ABCDE = "Negli scenari d'esame";
export const VOCI_ABCDE: Record<string, string> = {
    "Cerca": "cerca",
    "Chiedi": "chiedi",
    "Fai": "fai",
    "Attenzione": "attenzione"
};

export interface VoceAbcde
{
    tipo: string;
    html: string;
}
export interface SezioneAbcde
{
    id: string;
    intro: string;
    voci: VoceAbcde[];
}
export interface CompiledAbcde
{
    frontmatter: Record<string, unknown>;
    intro: string;
    sezioni: SezioneAbcde[];
    chiusura: string;
    errori: string[];
}

function renderFragment(source: string): string
{
    return renderer.render(replaceCustomSyntax(source, new Set(), new Set()));
}

/*
 * Le schede ABCDE hanno una struttura fissa: sezioni `## Scena`, `## A` … `## E`, `## Dopo`,
 * ognuna con sottosezioni `### Cerca`, `### Chiedi`, `### Fai`, `### Attenzione`.
 * Il testo prima della prima sezione (o della prima sottosezione) è un'introduzione.
 * Una sezione finale `## Negli scenari d'esame` (senza sottosezioni) chiude la pagina.
 */
export function compileAbcde(source: string): CompiledAbcde
{
    const { data, content } = matter(source);

    const errori: string[] = [];
    const sezioni: SezioneAbcde[] = [];
    const intro: string[] = [];
    let chiusura: string[] | undefined;

    let sezione: { id: string, intro: string[], voci: { tipo: string, righe: string[] }[] } | undefined;
    const chiudiSezione = () =>
    {
        if (!sezione) { return; }

        sezioni.push({
            id: sezione.id,
            intro: renderFragment(sezione.intro.join("\n")),
            voci: sezione.voci.map(({ tipo, righe }) => ({ tipo: tipo, html: renderFragment(righe.join("\n")) }))
        });
    };

    for (const riga of content.split("\n"))
    {
        const h2 = (/^## (.+)$/).exec(riga);
        const h3 = (/^### (.+)$/).exec(riga);

        if (h2 && (h2[1].trim() === CHIUSURA_ABCDE))
        {
            chiudiSezione();
            sezione = undefined;
            chiusura = [];
        }
        else if (chiusura)
        {
            if (h2 || h3) { errori.push(`Titolo dopo "${CHIUSURA_ABCDE}": ${riga}`); }
            chiusura.push(riga);
        }
        else if (h2)
        {
            chiudiSezione();

            const id = SEZIONI_ABCDE[h2[1].trim()];
            if (!id) { errori.push(`Sezione sconosciuta: ${h2[1]}`); }

            sezione = { id: id ?? slugify(h2[1]), intro: [], voci: [] };
        }
        else if (h3 && sezione)
        {
            const tipo = VOCI_ABCDE[h3[1].trim()];
            if (!tipo) { errori.push(`Sottosezione sconosciuta: ${h3[1]}`); }

            sezione.voci.push({ tipo: tipo ?? slugify(h3[1]), righe: [] });
        }
        else if (sezione)
        {
            const voce = sezione.voci.at(-1);
            if (voce) { voce.righe.push(riga); }
            else { sezione.intro.push(riga); }
        }
        else if (!(/^# /).test(riga))
        {
            intro.push(riga);
        }
    }
    chiudiSezione();

    return {
        frontmatter: data,
        intro: renderFragment(intro.join("\n")),
        sezioni: sezioni,
        chiusura: chiusura ? renderFragment(chiusura.join("\n")) : "",
        errori: errori
    };
}

export const LIVELLI_QUIZ = ["base", "esame", "numeri"];

export interface DomandaQuiz
{
    id: string;
    livello: string;
    domanda: string;
    opzioni: string[];
    corretta: number;
    spiegazione: string;
    ripasso?: string;
    fissa: boolean;
}
export interface CompiledQuiz
{
    meta: { titolo: string, modulo: string, ordine: number };
    domande: DomandaQuiz[];
    errori: string[];
    glossario: string[];
    fonti: string[];
}

/*
 * I quiz sono file YAML (`src/content/quiz/<argomento>.yaml`) con `titolo`, `modulo`, `ordine`
 * e una lista `domande`. Testi, opzioni e spiegazioni supportano la sintassi dei contenuti.
 */
export function compileQuiz(source: string): CompiledQuiz
{
    const data = parseYaml(source) as Record<string, unknown>;

    const errori: string[] = [];
    const glossario = new Set<string>();
    const sources = new Set<string>();

    const prepare = (text: unknown) => replaceCustomSyntax(String(text ?? ""), glossario, sources);
    const inline = (text: unknown) => renderer.renderInline(prepare(text));
    const block = (text: unknown) => renderer.render(prepare(text));

    const domande = ((data.domande ?? []) as Record<string, unknown>[]).map((domanda, index) =>
    {
        const id = String(domanda.id ?? `#${index + 1}`);
        const opzioni = (domanda.opzioni ?? []) as unknown[];
        const corretta = Number(domanda.corretta);

        if (!LIVELLI_QUIZ.includes(String(domanda.livello))) { errori.push(`${id}: livello non valido`); }
        if (!domanda.domanda) { errori.push(`${id}: testo mancante`); }
        if ((opzioni.length < 3) || (opzioni.length > 4)) { errori.push(`${id}: servono 3 o 4 opzioni`); }
        if (new Set(opzioni.map(String)).size !== opzioni.length) { errori.push(`${id}: opzioni duplicate`); }
        if (!Number.isInteger(corretta) || (corretta < 0) || (corretta >= opzioni.length))
        {
            errori.push(`${id}: indice della risposta corretta non valido`);
        }
        if (!domanda.spiegazione) { errori.push(`${id}: spiegazione mancante`); }
        const testi = [["domanda", domanda.domanda], ["spiegazione", domanda.spiegazione]]
            .concat(opzioni.map((opzione) => ["opzione", opzione]));

        for (const [campo, valore] of testi)
        {
            // In YAML `- Non cambia: …` senza virgolette diventa un oggetto e `- 30` un numero: servono le virgolette.
            if ((valore !== undefined) && (typeof valore !== "string"))
            {
                errori.push(`${id}: ${campo} non è testo (mancano le virgolette attorno a un ":"?)`);
            }
        }
        if (opzioni.some((opzione) => (/precedent/i).test(String(opzione))) && (domanda.fissa !== true))
        {
            errori.push(`${id}: le opzioni che citano "le precedenti" richiedono \`fissa: true\``);
        }
        if (!String(domanda.spiegazione ?? "").includes("[@"))
        {
            errori.push(`${id}: la spiegazione non cita una fonte`);
        }

        return {
            id: id,
            livello: String(domanda.livello),
            domanda: inline(domanda.domanda),
            opzioni: opzioni.map(inline),
            corretta: corretta,
            spiegazione: block(domanda.spiegazione),
            ripasso: domanda.ripasso ? String(domanda.ripasso) : undefined,
            fissa: domanda.fissa === true
        };
    });

    return {
        meta: {
            titolo: String(data.titolo ?? ""),
            modulo: String(data.modulo ?? ""),
            ordine: Number(data.ordine ?? 0)
        },
        domande: domande,
        errori: errori,
        glossario: [...glossario],
        fonti: [...sources]
    };
}

export const GRUPPI_SKILL = ["blsd", "trauma", "neonato", "tss"];

export interface CompiledSkill
{
    meta: Record<string, unknown>;
    skill: Record<string, unknown>;
    errori: string[];
    glossario: string[];
    fonti: string[];
    diagrammi: string[];
}

/*
 * Le schede skill (`src/content/skill/<ordine>-<slug>.yaml`) riportano parola per parola la griglia
 * del corso: `passi` è una lista di righe, ognuna con una cella per colonna (una stringa se la colonna è una).
 * `commento` (Markdown, con fonti) è testo nostro; `errori` e `consigli` vengono dagli istruttori.
 */
export function compileSkill(source: string, disegni?: DiagrammiDisegnati): CompiledSkill
{
    const data = parseYaml(source) as Record<string, unknown>;

    const errori: string[] = [];
    const glossario = new Set<string>();
    const sources = new Set<string>();

    const prepare = (text: unknown) => replaceCustomSyntax(String(text ?? ""), glossario, sources);
    const inline = (text: unknown) => renderer.renderInline(prepare(text));
    const block = (text: unknown) => renderer.render(prepare(text));

    for (const campo of ["titolo", "intestazione", "gruppo", "fonte", "revisione"])
    {
        if (typeof data[campo] !== "string" || !data[campo]) { errori.push(`campo \`${campo}\` mancante`); }
    }
    if (!GRUPPI_SKILL.includes(String(data.gruppo))) { errori.push("gruppo non valido"); }

    const colonne = ((data.colonne ?? []) as unknown[]).map(String);
    const diagramma = data.diagramma ? String(data.diagramma) : undefined;
    if (!diagramma && (!colonne.length || colonne.length > 2)) { errori.push("servono 1 o 2 colonne"); }

    const righe = ((data.passi ?? []) as unknown[]).map((riga) => (Array.isArray(riga) ? riga : [riga]));
    if (!righe.length && !diagramma) { errori.push("nessun passo"); }
    righe.forEach((riga, index) =>
    {
        const passo = `passo ${index + 1}`;
        if (riga.length !== colonne.length)
        {
            errori.push(`${passo}: ${riga.length} celle invece di ${colonne.length}`);
        }
        if (riga.some((cella) => typeof cella !== "string")) { errori.push(`${passo}: una cella non è testo`); }
    });

    const lista = (campo: string) => ((data[campo] ?? []) as unknown[]).map(block);
    const skill = {
        titolo: String(data.titolo ?? ""),
        intestazione: String(data.intestazione ?? ""),
        sottotitolo: data.sottotitolo ? String(data.sottotitolo) : undefined,
        gruppo: String(data.gruppo ?? ""),
        fonte: String(data.fonte ?? ""),
        revisione: String(data.revisione ?? ""),
        riassunti: ((data.riassunti ?? []) as unknown[]).map(String),
        colonne: colonne,
        avvertenza: data.avvertenza ? String(data.avvertenza) : undefined,
        passi: righe.map((riga) => riga.map(inline)),
        diagramma: diagramma,
        disegno: diagramma ? disegni?.get(diagramma) : undefined,
        nota: data.nota ? inline(data.nota) : undefined,
        commento: data.commento ? block(data.commento) : undefined,
        errori: lista("errori"),
        consigli: lista("consigli"),
        citazione: inline(`[@${String(data.fonte ?? "")}:1]`)
    };
    sources.add(skill.fonte);

    const meta = {
        titolo: skill.titolo,
        intestazione: skill.intestazione,
        sottotitolo: skill.sottotitolo,
        gruppo: skill.gruppo,
        fonte: skill.fonte,
        revisione: skill.revisione,
        riassunti: skill.riassunti,
        passi: righe.length,
        diagramma: !!diagramma,
        errori: skill.errori.length,
        consigli: skill.consigli.length
    };

    return {
        meta: meta,
        skill: skill,
        errori: errori,
        glossario: [...glossario],
        fonti: [...sources],
        diagrammi: diagramma ? [diagramma] : []
    };
}

/*
 * Importare un file `.md` restituisce `{ frontmatter, html, toc }`; per le schede ABCDE
 * (`src/content/abcde/`) restituisce invece `{ frontmatter, intro, sezioni }` e per i quiz
 * (`src/content/quiz/*.yaml`) `{ titolo, modulo, ordine, domande }`.
 * Con il suffisso `?meta` restituisce solo i metadati (frontmatter, TOC, termini citati o sezioni presenti),
 * così gli indici non includono l'HTML di tutti i contenuti nel bundle principale.
 */
export default function markdown(): Plugin
{
    return {
        name: "sse-markdown",
        enforce: "pre",

        load: async function(id: string)
        {
            const [path, query] = id.split("?");
            const isQuiz = path.includes("/content/quiz/") && path.endsWith(".yaml");
            const isSkill = path.includes("/content/skill/") && path.endsWith(".yaml");
            if (!path.endsWith(".md") && !isQuiz && !isSkill) { return null; }

            this.addWatchFile(path);

            const source = readFileSync(path, "utf-8");
            const isMeta = new URLSearchParams(query).has("meta");

            /*
             * I diagrammi servono ai riassunti e alle skill: si disegnano una volta e si ridisegnano
             * quando cambia uno dei file YAML (che diventano dipendenze del modulo).
             */
            const contentDir = fileURLToPath(new URL("../src/content", import.meta.url));
            const disegnati = async (): Promise<DiagrammiDisegnati> =>
            {
                for (const file of listDiagrammi(contentDir)) { this.addWatchFile(file); }

                const diagrammi = await caricaDiagrammi(contentDir, this.meta.watchMode);

                return new Map([...diagrammi].map(([slug, { diagramma, svg }]) =>
                    [slug, { svg: svg, testo: versioneTestuale(diagramma) }]));
            };

            if (isSkill)
            {
                const { meta, skill } = compileSkill(source, isMeta ? undefined : await disegnati());

                return `export default ${JSON.stringify(isMeta ? meta : skill)};`;
            }
            if (isQuiz)
            {
                const { meta, domande } = compileQuiz(source);
                if (isMeta)
                {
                    const livelli = Object.fromEntries(LIVELLI_QUIZ
                        .map((livello) => [livello, domande.filter((domanda) => domanda.livello === livello).length]));

                    return `export default ${JSON.stringify({ ...meta, livelli: livelli, totale: domande.length })};`;
                }

                return `export default ${JSON.stringify({ ...meta, domande })};`;
            }

            if (path.includes("/content/abcde/"))
            {
                const { frontmatter, intro, sezioni, chiusura } = compileAbcde(source);
                if (isMeta)
                {
                    const presenti = sezioni.map((sezione) => sezione.id);

                    return `export default ${JSON.stringify({ frontmatter: frontmatter, sezioni: presenti })};`;
                }

                return `export default ${JSON.stringify({ frontmatter, intro, sezioni, chiusura })};`;
            }

            const disegni = isMeta ? undefined : await disegnati();
            const { frontmatter, html, toc, glossario } = compileMarkdown(source, disegni);
            if (isMeta)
            {
                return `export default ${JSON.stringify({ frontmatter, toc, glossario })};`;
            }

            return `export default ${JSON.stringify({ frontmatter, html, toc })};`;
        }
    };
}

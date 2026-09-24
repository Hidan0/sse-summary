import { readFileSync } from "node:fs";

import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import container from "markdown-it-container";
import type { Plugin } from "vite";
import { parse as parseYaml } from "yaml";

import { fonti } from "../src/content/fonti";
import { slugify } from "../src/content/slug";

export const CALLOUTS: Record<string, string> = {
    essenziale: "In breve",
    esame: "Da ricordare per l'esame",
    pericolo: "Attenzione",
    nota: "Nota",
    dubbio: "Da verificare"
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
}

const GLOSSARY_RE = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;
const SOURCE_RE = /\[@([^:\]\s]+):([^\]]+)\]/g;

function escapeHtml(text: string): string
{
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
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
        .replace(SOURCE_RE, (_, id: string, pages: string) =>
        {
            sources.add(id);

            const fonte = fonti[id];
            const pagine = pages.split(",").map((page) => page.trim())
                .join(", ");
            const label = id === "scenari" ? `Scenari p. ${pagine}` : `${id} · p. ${pagine}`;
            const title = fonte ? `${fonte.modulo} · ${fonte.titolo} · p. ${pagine}` : `Fonte sconosciuta: ${id}`;

            const attributes = [
                "type=\"button\"",
                "class=\"source-ref\"",
                `data-source="${escapeHtml(id)}"`,
                `title="${escapeHtml(title)}"`
            ];

            return `<button ${attributes.join(" ")}>${escapeHtml(label)}</button>`;
        });
}

export function compileMarkdown(source: string): CompiledMarkdown
{
    const { data, content } = matter(source);

    const glossario = new Set<string>();
    const sources = new Set<string>();

    const tokens = renderer.parse(replaceCustomSyntax(content, glossario, sources), { });

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
        html: renderer.renderer.render(tokens, renderer.options, { }),
        toc: toc,
        glossario: [...glossario],
        fonti: [...sources]
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
 */
export function compileAbcde(source: string): CompiledAbcde
{
    const { data, content } = matter(source);

    const errori: string[] = [];
    const sezioni: SezioneAbcde[] = [];
    const intro: string[] = [];

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

        if (h2)
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
            ripasso: domanda.ripasso ? String(domanda.ripasso) : undefined
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

        load: function(id: string)
        {
            const [path, query] = id.split("?");
            const isQuiz = path.includes("/content/quiz/") && path.endsWith(".yaml");
            if (!path.endsWith(".md") && !isQuiz) { return null; }

            this.addWatchFile(path);

            const source = readFileSync(path, "utf-8");
            const isMeta = new URLSearchParams(query).has("meta");

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
                const { frontmatter, intro, sezioni } = compileAbcde(source);
                if (isMeta)
                {
                    const presenti = sezioni.map((sezione) => sezione.id);

                    return `export default ${JSON.stringify({ frontmatter: frontmatter, sezioni: presenti })};`;
                }

                return `export default ${JSON.stringify({ frontmatter, intro, sezioni })};`;
            }

            const { frontmatter, html, toc, glossario } = compileMarkdown(source);
            if (isMeta)
            {
                return `export default ${JSON.stringify({ frontmatter, toc, glossario })};`;
            }

            return `export default ${JSON.stringify({ frontmatter, html, toc })};`;
        }
    };
}

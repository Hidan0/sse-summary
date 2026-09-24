import { readFileSync } from "node:fs";

import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import container from "markdown-it-container";
import type { Plugin } from "vite";

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

/*
 * Importare un file `.md` restituisce `{ frontmatter, html, toc }`.
 * Con il suffisso `?meta` restituisce solo frontmatter, TOC e termini del glossario citati,
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
            if (!path.endsWith(".md")) { return null; }

            this.addWatchFile(path);

            const { frontmatter, html, toc, glossario } = compileMarkdown(readFileSync(path, "utf-8"));
            if (new URLSearchParams(query).has("meta"))
            {
                return `export default ${JSON.stringify({ frontmatter, toc, glossario })};`;
            }

            return `export default ${JSON.stringify({ frontmatter, html, toc })};`;
        }
    };
}

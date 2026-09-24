import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

import { capitoli } from "@/content/capitoli";
import { fonti } from "@/content/fonti";
import { slugify } from "@/content/slug";

import { compileMarkdown } from "../vite/markdown";

const CONTENT_DIR = join(__dirname, "..", "src", "content");

function listMarkdown(dir: string): string[]
{
    return readdirSync(dir, { recursive: true, encoding: "utf-8" })
        .filter((file) => file.endsWith(".md"))
        .map((file) => join(dir, file));
}

const riassunti = listMarkdown(join(CONTENT_DIR, "riassunti")).map((path) => ({
    path: path,
    cartella: basename(dirname(path)),
    slug: basename(path, ".md").replace(/^[\d.]+-/, ""),
    ...compileMarkdown(readFileSync(path, "utf-8"))
}));
const glossario = listMarkdown(join(CONTENT_DIR, "glossario")).map((path) => ({
    path: path,
    slug: basename(path, ".md"),
    ...compileMarkdown(readFileSync(path, "utf-8"))
}));

const glossarioKeys = new Set(glossario.flatMap(({ slug, frontmatter }) => [
    slug,
    slugify(String(frontmatter.termine)),
    ...((frontmatter.sinonimi as string[] | undefined) ?? []).map(slugify)
]));
const riassuntiSlugs = new Set(riassunti.map(({ slug }) => slug));

const documenti = [...riassunti, ...glossario];

describe("Riassunti", () =>
{
    it("hanno nomi file nel formato `<ordine>-<slug>.md`", () =>
    {
        const invalid = riassunti.filter(({ path }) => !(/^[\d.]+-[a-z0-9-]+\.md$/).test(basename(path)));

        expect(invalid.map(({ path }) => path)).toEqual([]);
    });
    it("hanno slug unici", () =>
    {
        expect(riassuntiSlugs.size).toBe(riassunti.length);
    });
    it("hanno titolo e capitolo coerente con la cartella", () =>
    {
        const invalid = riassunti.filter(({ cartella, frontmatter }) =>
        {
            const capitolo = capitoli.find(({ numero }) => numero === frontmatter.capitolo);

            return (typeof frontmatter.titolo !== "string") || (capitolo?.cartella !== cartella);
        });

        expect(invalid.map(({ path }) => path)).toEqual([]);
    });
    it("hanno correlati esistenti", () =>
    {
        const missing = riassunti.flatMap(({ slug, frontmatter }) =>
        {
            const correlati = (frontmatter.correlati as string[] | undefined) ?? [];

            return correlati.filter((correlato) => !riassuntiSlugs.has(correlato))
                .map((correlato) => `${slug} → ${correlato}`);
        });

        expect(missing).toEqual([]);
    });
    it("hanno link interni validi", () =>
    {
        const broken = riassunti.flatMap(({ path }) =>
        {
            const links = readFileSync(path, "utf-8").matchAll(/\]\(\/(riassunti|glossario)\/([a-z0-9-]+)/g);

            const exists = (tipo: string, slug: string) =>
                ((tipo === "riassunti") ? riassuntiSlugs.has(slug) : glossarioKeys.has(slug));

            return [...links]
                .filter(([, tipo, slug]) => !exists(tipo, slug))
                .map(([link]) => `${basename(path)} → ${link}`);
        });

        expect(broken).toEqual([]);
    });
});

describe("Glossario", () =>
{
    it("ha voci con termine e definizione breve", () =>
    {
        const invalid = glossario.filter(({ frontmatter }) =>
            (typeof frontmatter.termine !== "string") || (typeof frontmatter.breve !== "string"));

        expect(invalid.map(({ path }) => path)).toEqual([]);
    });
    it("copre tutti i termini citati", () =>
    {
        const missing = new Set(documenti.flatMap(({ glossario: terms }) => terms)
            .filter((term) => !glossarioKeys.has(term)));

        expect([...missing].sort()).toEqual([]);
    });
});

describe("Fonti", () =>
{
    it("citano solo documenti registrati", () =>
    {
        const unknown = documenti.flatMap(({ path, fonti: ids }) => ids
            .filter((id) => !(id in fonti))
            .map((id) => `${basename(path)} → ${id}`));

        expect(unknown).toEqual([]);
    });
});

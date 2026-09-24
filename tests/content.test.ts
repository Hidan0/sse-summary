import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

import { capitoli } from "@/content/capitoli";
import { fonti } from "@/content/fonti";
import { slugify } from "@/content/slug";

import { compileAbcde, compileMarkdown, compileQuiz } from "../vite/markdown";

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

const abcde = listMarkdown(join(CONTENT_DIR, "abcde")).map((path) =>
{
    const source = readFileSync(path, "utf-8");

    return {
        path: path,
        slug: basename(path, ".md").replace(/^[\d.]+-/, ""),
        scheda: basename(dirname(path)) === "schede",
        ...compileMarkdown(source),
        struttura: compileAbcde(source)
    };
});

const quiz = readdirSync(join(CONTENT_DIR, "quiz"))
    .filter((file) => file.endsWith(".yaml"))
    .map((file) =>
    {
        const path = join(CONTENT_DIR, "quiz", file);

        return { path: path, ...compileQuiz(readFileSync(path, "utf-8")) };
    });

const glossarioKeys = new Set(glossario.flatMap(({ slug, frontmatter }) => [
    slug,
    slugify(String(frontmatter.termine)),
    ...((frontmatter.sinonimi as string[] | undefined) ?? []).map(slugify)
]));
const riassuntiSlugs = new Set(riassunti.map(({ slug }) => slug));

const documenti = [...riassunti, ...glossario, ...abcde, ...quiz];

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

describe("Schede ABCDE", () =>
{
    const schede = abcde.filter(({ scheda }) => scheda);

    it("esistono i due schemi di base", () =>
    {
        const schemi = abcde.filter(({ scheda }) => !scheda).map(({ path }) => basename(path, ".md"));

        expect(schemi.sort()).toEqual(["medico", "trauma"]);
    });
    it("usano solo le sezioni e le sottosezioni previste", () =>
    {
        const errori = abcde.flatMap(({ path, struttura }) => struttura.errori
            .map((errore) => `${basename(path)}: ${errore}`));

        expect(errori).toEqual([]);
    });
    it("hanno frontmatter valido", () =>
    {
        const invalid = schede.filter(({ path, frontmatter }) =>
            !(/^[\d.]+-[a-z0-9-]+\.md$/).test(basename(path)) ||
            (typeof frontmatter.titolo !== "string") ||
            !["trauma", "medico", "ostetrico", "ambientale"].includes(frontmatter.categoria as string) ||
            !["trauma", "medico"].includes(frontmatter.schema as string));

        expect(invalid.map(({ path }) => path)).toEqual([]);
    });
    it("hanno slug unici e riassunti collegati esistenti", () =>
    {
        const missing = schede.flatMap(({ slug, frontmatter }) =>
        {
            const collegati = (frontmatter.riassunti as string[] | undefined) ?? [];

            return collegati.filter((riassunto) => !riassuntiSlugs.has(riassunto))
                .map((riassunto) => `${slug} → ${riassunto}`);
        });

        expect(new Set(schede.map(({ slug }) => slug)).size).toBe(schede.length);
        expect(missing).toEqual([]);
    });
});

describe("Quiz", () =>
{
    const domande = quiz.flatMap(({ domande: lista }) => lista);
    const ancore = new Map(riassunti.map(({ slug, toc }) => [slug, new Set(toc.map(({ id }) => id))]));

    it("hanno titolo, modulo e domande", () =>
    {
        const invalid = quiz.filter(({ meta, domande: lista }) =>
            !meta.titolo || !["TSS", "SSE"].includes(meta.modulo) || !lista.length);

        expect(invalid.map(({ path }) => basename(path))).toEqual([]);
    });
    it("hanno domande ben formate, con fonte e una sola risposta corretta", () =>
    {
        const errori = quiz.flatMap(({ path, errori: lista }) => lista.map((errore) => `${basename(path)}: ${errore}`));

        expect(errori).toEqual([]);
    });
    it("hanno id unici", () =>
    {
        const ids = domande.map(({ id }) => id);

        expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
    });
    it("rimandano a sezioni di riassunti esistenti", () =>
    {
        const broken = domande
            .filter(({ ripasso }) => ripasso)
            .filter(({ ripasso }) =>
            {
                const [slug, sezione] = ripasso!.split("#");

                return !ancore.has(slug) || (sezione !== undefined && !ancore.get(slug)!.has(sezione));
            })
            .map(({ id, ripasso }) => `${id} → ${ripasso}`);

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

import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

import { capitoli } from "@/content/capitoli";
import { fonti } from "@/content/fonti";
import { slugify } from "@/content/slug";

import { disegnaDiagramma, leggiDiagramma, listDiagrammi } from "../vite/diagrammi";
import { compileAbcde, compileMarkdown, compileQuiz, compileScenario, compileSkill } from "../vite/markdown";

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
    modulo: basename(dirname(dirname(path))).toUpperCase(),
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
        const invalid = riassunti.filter(({ cartella, modulo, frontmatter }) =>
        {
            const capitolo = capitoli.find(({ codice }) => codice === frontmatter.capitolo);

            return (typeof frontmatter.titolo !== "string") ||
                (capitolo?.cartella !== cartella) ||
                (capitolo.modulo !== modulo);
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
        const skillSlugs = new Set(readdirSync(join(CONTENT_DIR, "skill"))
            .map((file) => file.replace(/^[\d.]+-/, "").replace(/\.yaml$/, "")));
        const file = [...riassunti.map(({ path }) => path), ...readdirSync(join(CONTENT_DIR, "skill"))
            .map((nome) => join(CONTENT_DIR, "skill", nome))];

        const broken = file.flatMap((path) =>
        {
            const links = readFileSync(path, "utf-8").matchAll(/\]\(\/(riassunti|glossario|skill)\/([a-z0-9-]+)/g);

            const exists = (tipo: string, slug: string) =>
            {
                if (tipo === "skill") { return skillSlugs.has(slug); }

                return (tipo === "riassunti") ? riassuntiSlugs.has(slug) : glossarioKeys.has(slug);
            };

            return [...links]
                .filter(([, tipo, slug]) => !exists(tipo, slug))
                .map(([link]) => `${basename(path)} → ${link}`);
        });

        expect(broken).toEqual([]);
    });
    it("hanno link interni con ancore esistenti", () =>
    {
        const ids = new Map(riassunti.map(({ slug, html }) =>
            [slug, new Set([...html.matchAll(/ id="([^"]+)"/g)].map(([, id]) => id))]));

        const file = [...riassunti, ...glossario, ...abcde].map(({ path }) => path)
            .concat(readdirSync(join(CONTENT_DIR, "skill")).map((nome) => join(CONTENT_DIR, "skill", nome)));

        const broken = file.flatMap((path) =>
        {
            const links = readFileSync(path, "utf-8").matchAll(/\]\(\/riassunti\/([a-z0-9-]+)#([^)\s]+)\)/g);

            return [...links]
                .filter(([, slug, ancora]) => ids.has(slug) && !ids.get(slug)!.has(ancora))
                .map(([link]) => `${basename(path)} → ${link}`);
        });

        expect(broken).toEqual([]);
    });
});

const skill = readdirSync(join(CONTENT_DIR, "skill"))
    .filter((file) => file.endsWith(".yaml"))
    .map((file) => ({ file: file, ...compileSkill(readFileSync(join(CONTENT_DIR, "skill", file), "utf-8")) }));

describe("Skill", () =>
{
    it("hanno nomi file nel formato `<ordine>-<slug>.yaml` e slug unici", () =>
    {
        const slugs = skill.map(({ file }) => file.replace(/^[\d.]+-/, "").replace(/\.yaml$/, ""));

        const invalid = skill.filter(({ file }) => !(/^[\d.]+-[a-z0-9-]+\.yaml$/).test(file));

        expect(invalid.map(({ file }) => file)).toEqual([]);
        expect(new Set(slugs).size).toBe(slugs.length);
    });
    it("hanno una struttura valida", () =>
    {
        const errori = skill.flatMap(({ file, errori: lista }) => lista.map((errore) => `${file}: ${errore}`));

        expect(errori).toEqual([]);
    });
    it("citano fonti e riassunti esistenti", () =>
    {
        const invalid = skill.flatMap(({ file, fonti: ids, meta }) => [
            ...ids.filter((id) => !(id in fonti)).map((id) => `${file} → fonte ${id}`),
            ...(meta.riassunti as string[]).filter((slug) => !riassuntiSlugs.has(slug))
                .map((slug) => `${file} → ${slug}`)
        ]);

        expect(invalid).toEqual([]);
    });
});

const diagrammi = listDiagrammi(CONTENT_DIR).map(leggiDiagramma);

const scenari = readdirSync(join(CONTENT_DIR, "scenari"))
    .filter((file) => file.endsWith(".yaml"))
    .map((file) => ({ file: file, ...compileScenario(readFileSync(join(CONTENT_DIR, "scenari", file), "utf-8")) }));

describe("Scenari", () =>
{
    it("hanno nomi file `<numero>-<slug>.yaml` coerenti con il numero", () =>
    {
        const invalid = scenari.filter(({ file, meta }) =>
            !(/^\d+-[a-z0-9-]+\.yaml$/).test(file) || (Number.parseInt(file, 10) !== meta.numero));

        expect(invalid.map(({ file }) => file)).toEqual([]);
    });
    it("hanno una struttura valida", () =>
    {
        const errori = scenari.flatMap(({ file, errori: lista }) => lista.map((errore) => `${file}: ${errore}`));

        expect(errori).toEqual([]);
    });
    it("citano le pagine dello scenario nel PDF (2n-1 e 2n)", () =>
    {
        const invalid = scenari.filter(({ file, meta, fonti: ids }) =>
        {
            const pagine = readFileSync(join(CONTENT_DIR, "scenari", file), "utf-8")
                .match(/fonte: "scenari:(\d+)-(\d+)"/);
            const numero = Number(meta.numero);

            return !ids.includes("scenari") || !pagine ||
                (Number(pagine[1]) !== (2 * numero) - 1) || (Number(pagine[2]) !== 2 * numero);
        });

        expect(invalid.map(({ file }) => file)).toEqual([]);
    });
});

describe("Diagrammi", () =>
{
    it("hanno una struttura valida e fonti esistenti", () =>
    {
        const errori = diagrammi.flatMap(({ slug, errori: lista, fonte }) => [
            ...lista.map((errore) => `${slug}: ${errore}`),
            ...((fonte.split(":")[0] in fonti) ? [] : [`${slug}: fonte ${fonte} sconosciuta`])
        ]);

        expect(errori).toEqual([]);
    });
    it("sono usati solo se esistono", () =>
    {
        const slugs = new Set(diagrammi.map(({ slug }) => slug));
        const usati = [...riassunti.map(({ path, diagrammi: lista }) => ({ path: path, lista: lista })),
            ...skill.map(({ file, diagrammi: lista }) => ({ path: file, lista: lista }))];

        const mancanti = usati.flatMap(({ path, lista }) => lista.filter((slug) => !slugs.has(slug))
            .map((slug) => `${basename(path)} → ${slug}`));

        expect(mancanti).toEqual([]);
    });
    it("si possono disporre con ELK", async () =>
    {
        const svg = await Promise.all(diagrammi.map(disegnaDiagramma));

        expect(svg.every((value) => value.startsWith("<svg"))).toBe(true);
    });
});

describe("Riquadri", () =>
{
    it("le indicazioni degli istruttori non citano fonti del materiale", () =>
    {
        const invalid = [...riassunti, ...glossario, ...abcde].filter(({ path }) =>
            [...readFileSync(path, "utf-8").matchAll(/^::: istruttori\n([\s\S]*?)^:::$/gm)]
                .some(([, testo]) => testo.includes("[@")));

        expect(invalid.map(({ path }) => basename(path))).toEqual([]);
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

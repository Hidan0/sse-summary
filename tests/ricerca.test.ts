import { readdirSync } from "node:fs";
import { basename, join } from "node:path";

import { describe, expect, it } from "vitest";

import { cerca, creaIndice, evidenzia, frammento, normalizza, paroleQuery } from "@/content/ricerca";

import { creaDocumenti, testoDaHtml } from "../vite/ricerca";

const CONTENT_DIR = join(__dirname, "..", "src", "content");

const documenti = creaDocumenti(CONTENT_DIR);
const indice = creaIndice(documenti);

const primo = (query: string) => cerca(indice, query)[0];

describe("Indice di ricerca", () =>
{
    it("contiene tutti i riassunti e tutte le voci del glossario", () =>
    {
        const slugs = readdirSync(join(CONTENT_DIR, "riassunti"), { recursive: true, encoding: "utf-8" })
            .filter((file) => file.endsWith(".md"))
            .map((file) => basename(file, ".md").replace(/^[\d.]+-/, ""));
        const voci = readdirSync(join(CONTENT_DIR, "glossario")).filter((file) => file.endsWith(".md"));

        const links = new Set(documenti.map(({ link }) => link));

        expect(slugs.filter((slug) => !links.has(`/riassunti/${slug}`))).toEqual([]);
        expect(voci.filter((voce) => !links.has(`/glossario/${basename(voce, ".md")}`))).toEqual([]);
    });
    it("ha id unici", () =>
    {
        const ids = documenti.map(({ id }) => id);

        expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
    });
    it("non include fonti, tag e titoli dei riquadri nel testo", () =>
    {
        const html = "<aside><p class=\"callout-title\">In breve</p><p>CTE <strong>30:2</strong>" +
            "<button type=\"button\" class=\"source-ref\" data-source=\"5.1\">5.1 · p. 46</button>.</p></aside>";

        expect(testoDaHtml(html)).toBe("CTE 30:2.");
        expect(documenti.filter(({ testo }) => (/<\/?[a-z]+[ >]| · p\. \d/).test(testo))).toEqual([]);
    });
});

describe("Ricerca", () =>
{
    it("trova per sigla o sinonimo la voce del glossario", () =>
    {
        expect(primo("PLS")?.link).toBe("/glossario/posizione-laterale-di-sicurezza");
        expect(primo("SOREU")?.link).toBe("/glossario/soreu");
    });
    it("ignora accenti e maiuscole", () =>
    {
        expect(cerca(indice, "perche").length).toBeGreaterThan(0);
        expect(cerca(indice, "PERCHÉ").map(({ id }) => id)).toEqual(cerca(indice, "perche").map(({ id }) => id));
    });
    it("cerca per prefisso e richiede tutte le parole", () =>
    {
        expect(primo("tachicard")?.link).toBe("/glossario/tachicardia");
        expect(cerca(indice, "dializzato fistola").every(({ testo, sezione }) =>
            (/dializz/i).test(`${sezione} ${testo}`) && (/fistol/i).test(`${sezione} ${testo}`))).toBe(true);
    });
    it("porta alla sezione del riassunto", () =>
    {
        expect(cerca(indice, "sorpasso").map(({ link }) => link))
            .toContain("/riassunti/sicurezza-nella-guida#sorpasso");
    });
});

describe("Evidenziazione", () =>
{
    it("normalizza le parole della query e toglie quelle vuote", () =>
    {
        expect(paroleQuery("La posizione nell'Anziano")).toEqual(["posizione", "nell", "anziano"]);
        expect(normalizza("Perché più")).toBe("perche piu");
    });
    it("evidenzia le parole che iniziano con quelle cercate", () =>
    {
        const pezzi = evidenzia("La tachicardia è un'alterazione.", ["tachic"]);

        expect(pezzi.filter(({ evidenziato }) => evidenziato).map(({ testo }) => testo)).toEqual(["tachicardia"]);
        expect(pezzi.map(({ testo }) => testo).join("")).toBe("La tachicardia è un'alterazione.");
    });
    it("estrae un frammento attorno alla parola trovata", () =>
    {
        const testo = `${"parola ".repeat(60)}dializzato ${"altro ".repeat(60)}`;

        expect(frammento(testo, ["dializz"], 120)).toMatch(/^… .*dializzato.* …$/);
    });
});

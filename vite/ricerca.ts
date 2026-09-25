import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath, URL } from "node:url";

import type { Plugin } from "vite";

import { getLettera, SEZIONI } from "../src/content/abcde-sezioni";
import { capitoli } from "../src/content/capitoli";
import { parseOrdineSlug } from "../src/content/ordine";
import type { DocumentoRicerca } from "../src/content/ricerca";
import type { IdSezioneAbcde, TipoSchema } from "../src/content/types";

import { compileAbcde, compileMarkdown } from "./markdown";

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": "\"", "&#39;": "'" };

/*
 * Il testo leggibile di un frammento HTML: senza fonti, titoli dei riquadri e tag.
 */
export function testoDaHtml(html: string): string
{
    return html
        .replace(/<button [^>]*class="source-ref"[\s\S]*?<\/button>/g, "")
        .replace(/<p class="callout-title">[\s\S]*?<\/p>/g, "")
        .replace(/<thead>[\s\S]*?<\/thead>/g, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&(amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity])
        .replace(/\s+/g, " ")
        .replace(/\s+([.,;:!?)])/g, "$1")
        .trim();
}

function listMarkdown(dir: string): string[]
{
    return readdirSync(dir, { recursive: true, encoding: "utf-8" })
        .filter((file) => file.endsWith(".md"))
        .map((file) => join(dir, file));
}

/*
 * Un documento per ogni sezione `##`/`###` del riassunto; il testo prima della prima sezione
 * (titolo e riquadro "In breve") porta all'inizio della pagina.
 */
function documentiRiassunto(path: string): DocumentoRicerca[]
{
    const { frontmatter, html } = compileMarkdown(readFileSync(path, "utf-8"));
    const { slug } = parseOrdineSlug(path);
    const capitolo = capitoli.find(({ codice }) => codice === frontmatter.capitolo);

    const titolo = String(frontmatter.titolo);
    const comune = {
        tipo: "riassunto" as const,
        titolo: titolo,
        termini: "",
        modulo: capitolo?.modulo ?? "",
        capitolo: capitolo ? `${capitolo.modulo} · Cap. ${capitolo.codice}` : ""
    };

    const corpo = html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/, "");
    const parti = corpo.split(/<h[23] id="([^"]+)">([\s\S]*?)<\/h[23]>/);

    const documenti: DocumentoRicerca[] = [{
        ...comune,
        id: `riassunto:${slug}`,
        sezione: "",
        testo: testoDaHtml(parti[0]),
        link: `/riassunti/${slug}`
    }];
    for (let index = 1; index < parti.length; index += 3)
    {
        documenti.push({
            ...comune,
            id: `riassunto:${slug}#${parti[index]}`,
            sezione: testoDaHtml(parti[index + 1]),
            testo: testoDaHtml(parti[index + 2]),
            link: `/riassunti/${slug}#${parti[index]}`
        });
    }

    return documenti;
}

function documentoGlossario(path: string): DocumentoRicerca
{
    const { frontmatter, html } = compileMarkdown(readFileSync(path, "utf-8"));
    const slug = basename(path, ".md");
    const sinonimi = ((frontmatter.sinonimi as string[] | undefined) ?? []).map(String);

    return {
        id: `glossario:${slug}`,
        tipo: "glossario",
        titolo: String(frontmatter.termine),
        sezione: "",
        termini: [frontmatter.termine, ...sinonimi].join(" · "),
        testo: `${String(frontmatter.breve ?? "")} ${testoDaHtml(html)}`.trim(),
        modulo: "",
        capitolo: "",
        link: `/glossario/${slug}`
    };
}

/*
 * Schemi e schede ABCDE: un documento per l'introduzione e uno per ogni fase.
 */
function documentiAbcde(path: string): DocumentoRicerca[]
{
    const { frontmatter, intro, sezioni } = compileAbcde(readFileSync(path, "utf-8"));

    const isSchema = basename(dirname(path)) === "schemi";
    const slug = isSchema ? basename(path, ".md") : parseOrdineSlug(path).slug;
    const schema = (isSchema ? slug : String(frontmatter.schema)) as TipoSchema;
    const link = isSchema ? `/abcde/schema/${slug}` : `/abcde/${slug}`;

    const comune = {
        tipo: "abcde" as const,
        titolo: String(frontmatter.titolo),
        termini: "",
        modulo: "SSE",
        capitolo: isSchema ? "Schema di base" : "Scheda ABCDE",
        link: link
    };

    return [
        { ...comune, id: `abcde:${slug}`, sezione: "", testo: testoDaHtml(intro) },
        ...sezioni.map(({ id, intro: introSezione, voci }) =>
        {
            const info = SEZIONI.find((sezione) => sezione.id === id);
            const lettera = getLettera(id as IdSezioneAbcde, schema);

            return {
                ...comune,
                id: `abcde:${slug}:${id}`,
                sezione: [lettera, info?.nome].filter(Boolean).join(" · "),
                testo: testoDaHtml([introSezione, ...voci.map(({ html }) => html)].join(" "))
            };
        })

    ].filter(({ testo, sezione }) => testo || sezione);
}

export function creaDocumenti(contentDir: string): DocumentoRicerca[]
{
    return [
        ...listMarkdown(join(contentDir, "glossario")).map(documentoGlossario),
        ...listMarkdown(join(contentDir, "riassunti")).flatMap(documentiRiassunto),
        ...listMarkdown(join(contentDir, "abcde")).flatMap(documentiAbcde)
    ];
}

export function fileContenuti(contentDir: string): string[]
{
    return ["glossario", "riassunti", "abcde"].flatMap((dir) => listMarkdown(join(contentDir, dir)));
}

const VIRTUAL_ID = "virtual:indice-ricerca";

/*
 * `import("virtual:indice-ricerca")` restituisce i documenti dell'indice di ricerca, generati al build.
 * Si importa in modo dinamico, così chi non usa la ricerca non li scarica.
 */
export default function ricerca(): Plugin
{
    const contentDir = fileURLToPath(new URL("../src/content", import.meta.url));

    return {
        name: "sse-ricerca",

        resolveId: (id: string) => ((id === VIRTUAL_ID) ? `\0${VIRTUAL_ID}` : null),
        load: function(id: string)
        {
            if (id !== `\0${VIRTUAL_ID}`) { return null; }

            for (const file of fileContenuti(contentDir)) { this.addWatchFile(file); }

            return `export default ${JSON.stringify(creaDocumenti(contentDir))};`;
        }
    };
}

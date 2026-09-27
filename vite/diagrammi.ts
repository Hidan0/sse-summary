import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

import ELK from "elkjs/lib/elk.bundled.js";
import type { ElkExtendedEdge, ElkNode } from "elkjs/lib/elk.bundled.js";
import { parse as parseYaml } from "yaml";

/*
 * I diagrammi di flusso (`src/content/diagrammi/<slug>.yaml`) sono nodi e archi:
 * il layout lo calcola ELK durante la build e l'SVG lo disegniamo noi, con classi CSS
 * (`src/assets/scss/_diagrammi.scss`) che seguono il tema chiaro e scuro.
 */

export const TIPI_NODO = ["inizio", "azione", "decisione", "fine", "esito", "nota", "giunzione"];
export const COLORI_ESITO = ["verde", "giallo", "rosso", "nero"];
const LATI: Record<string, string> = { sotto: "SOUTH", sopra: "NORTH", destra: "EAST", sinistra: "WEST" };

export interface NodoDiagramma
{
    id: string;
    tipo: string;
    colore?: string;
    righe: string[];
    elenco: boolean;
    vicino?: string;
}
export interface ArcoDiagramma
{
    da: string;
    a: string;
    etichetta?: string;
    uscita?: string;
    entrata?: string;
}
export interface Diagramma
{
    slug: string;
    titolo: string;
    fonte: string;
    nodi: NodoDiagramma[];
    archi: ArcoDiagramma[];
    errori: string[];
}

const CARATTERE = 7.1;
const RIGA = 17;

/*
 * Va a capo sulle parole: le righe scritte nel YAML restano righe, quelle lunghe si spezzano.
 */
function aCapo(testo: string, massimo: number): string[]
{
    const righe: string[] = [];
    for (const paragrafo of testo.split("\n"))
    {
        let riga = "";
        for (const parola of paragrafo.split(" "))
        {
            if (riga && (riga.length + parola.length + 1 > massimo))
            {
                righe.push(riga);
                riga = parola;
            }
            else { riga = riga ? `${riga} ${parola}` : parola; }
        }
        righe.push(riga);
    }

    return righe;
}

export function leggiDiagramma(path: string): Diagramma
{
    const data = parseYaml(readFileSync(path, "utf-8")) as Record<string, unknown>;
    const errori: string[] = [];

    const nodi = ((data.nodi ?? []) as Record<string, unknown>[]).map((nodo) =>
    {
        const tipo = String(nodo.tipo ?? "azione");
        if (!TIPI_NODO.includes(tipo)) { errori.push(`nodo ${String(nodo.id)}: tipo ${tipo} non valido`); }
        if (nodo.colore && !COLORI_ESITO.includes(String(nodo.colore)))
        {
            errori.push(`nodo ${String(nodo.id)}: colore non valido`);
        }

        /*
         * Più voci nello stesso blocco diventano un elenco puntato allineato a sinistra.
         */
        const voci = (Array.isArray(nodo.testo) ? nodo.testo : [nodo.testo ?? ""]).map(String);
        const elenco = (voci.length > 1) && (tipo === "azione" || tipo === "fine");
        const massimo = (tipo === "decisione") ? 20 : 40;
        const righe = elenco ?
            voci.flatMap((voce) => aCapo(voce, massimo - 2).map((riga, index) => (index ? `  ${riga}` : `• ${riga}`))) :
            voci.flatMap((voce) => aCapo(voce, massimo));

        return {
            id: String(nodo.id),
            tipo: tipo,
            colore: nodo.colore ? String(nodo.colore) : undefined,
            righe: righe,
            elenco: elenco,
            vicino: nodo.vicino ? String(nodo.vicino) : undefined
        };
    });

    const ids = new Set(nodi.map(({ id }) => id));
    if (ids.size !== nodi.length) { errori.push("id dei nodi duplicati"); }
    for (const nodo of nodi)
    {
        if (nodo.vicino && !ids.has(nodo.vicino)) { errori.push(`nodo ${nodo.id}: \`vicino\` sconosciuto`); }
    }

    const archi = ((data.archi ?? []) as unknown[]).map((arco) =>
    {
        const opzioni = Array.isArray(arco) ? {} : (arco as Record<string, unknown>);
        const campi = Array.isArray(arco) ? arco : [opzioni.da, opzioni.a, opzioni.etichetta];
        const [da, a, etichetta] = campi.map((value) => ((value === undefined) ? undefined : String(value)));

        for (const id of [da, a])
        {
            if (!id || !ids.has(id)) { errori.push(`arco ${da} → ${a}: nodo ${id} inesistente`); }
        }

        return {
            da: da!,
            a: a!,
            etichetta: etichetta,
            uscita: opzioni.uscita ? String(opzioni.uscita) : undefined,
            entrata: opzioni.entrata ? String(opzioni.entrata) : undefined
        };
    });

    for (const arco of archi)
    {
        for (const lato of [arco.uscita, arco.entrata])
        {
            if (lato && !LATI[lato]) { errori.push(`arco ${arco.da} → ${arco.a}: lato ${lato} non valido`); }
        }
    }
    if (typeof data.titolo !== "string") { errori.push("titolo mancante"); }
    if (typeof data.fonte !== "string") { errori.push("fonte mancante (es. \"8:55\")"); }

    return {
        slug: basename(path, ".yaml"),
        titolo: String(data.titolo ?? ""),
        fonte: String(data.fonte ?? ""),
        nodi: nodi,
        archi: archi,
        errori: errori
    };
}

function dimensioni(nodo: NodoDiagramma): { width: number, height: number }
{
    if (nodo.tipo === "giunzione") { return { width: 2, height: 2 }; }

    const larghezza = Math.max(...nodo.righe.map((riga) => riga.length)) * CARATTERE;
    const altezza = nodo.righe.length * RIGA;

    if (nodo.tipo === "decisione") { return { width: (larghezza * 1.45) + 44, height: (altezza * 1.6) + 38 }; }
    if (nodo.tipo === "inizio" || nodo.tipo === "fine" || nodo.tipo === "esito")
    {
        return { width: larghezza + 40, height: altezza + 18 };
    }

    return { width: larghezza + 28, height: altezza + 18 };
}

/*
 * Lati di uscita e di entrata degli archi: di norma si esce dal basso e si entra dall'alto.
 * Dal secondo ramo di una decisione si esce di lato; un arco che torna indietro esce a destra e rientra di lato.
 * Nel YAML si possono forzare con `uscita` ed `entrata` (sotto, sopra, destra, sinistra).
 */
function lati(diagramma: Diagramma): { uscita: string, entrata: string }[]
{
    const posizione = new Map(diagramma.nodi.map(({ id }, index) => [id, index]));
    const usciti = new Map<string, number>();

    const uscite = diagramma.archi.map((arco) =>
    {
        const indietro = posizione.get(arco.a)! < posizione.get(arco.da)!;
        const numero = usciti.get(arco.da) ?? 0;
        usciti.set(arco.da, numero + 1);

        return arco.uscita ?? ((indietro || numero > 0) ? "destra" : "sotto");
    });

    /*
     * Chi ha già un ramo che esce a destra riceve i ritorni da sinistra: le due frecce non si sovrappongono.
     */
    const esconoADestra = new Set(diagramma.archi.filter((_, index) => uscite[index] === "destra").map(({ da }) => da));

    return diagramma.archi.map((arco, index) =>
    {
        const indietro = posizione.get(arco.a)! < posizione.get(arco.da)!;
        const ritorno = esconoADestra.has(arco.a) ? "sinistra" : "destra";
        const entrata = arco.entrata ?? (indietro ? ritorno : "sopra");

        return { uscita: LATI[uscite[index]], entrata: LATI[entrata] };
    });
}

/*
 * Per il layout conta l'ordine dei nodi: una nota con `vicino` va subito dopo il suo nodo,
 * altrimenti il suo arco invisibile verrebbe preso per un ritorno indietro.
 */
function ordineLayout(nodi: NodoDiagramma[]): NodoDiagramma[]
{
    const ordinati = nodi.filter(({ vicino }) => !vicino);
    for (const nota of nodi.filter(({ vicino }) => vicino))
    {
        const index = ordinati.findIndex(({ id }) => id === nota.vicino);
        ordinati.splice(index + 1, 0, nota);
    }

    return ordinati;
}

function escape(text: string): string
{
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

interface Punto { x: number, y: number }

function etichette(testo?: string): ElkExtendedEdge["labels"]
{
    if (!testo) { return []; }

    const layoutOptions = { "elk.edgeLabels.placement": "TAIL" };

    return [{ text: testo, width: (testo.length * 6.4) + 10, height: 16, layoutOptions: layoutOptions }];
}

export async function disegnaDiagramma(diagramma: Diagramma): Promise<string>
{
    const direzioni = lati(diagramma);
    const porte = new Map<string, Set<string>>();
    direzioni.forEach(({ uscita, entrata }, index) =>
    {
        const { da, a } = diagramma.archi[index];
        porte.set(da, (porte.get(da) ?? new Set()).add(uscita));
        porte.set(a, (porte.get(a) ?? new Set()).add(entrata));
    });

    const grafo: ElkNode = {
        id: "root",
        layoutOptions: {
            "elk.algorithm": "layered",
            "elk.direction": "DOWN",
            "elk.edgeRouting": "ORTHOGONAL",
            "elk.spacing.nodeNode": "28",
            "elk.layered.spacing.nodeNodeBetweenLayers": "34",
            "elk.layered.spacing.edgeNodeBetweenLayers": "16",
            "elk.spacing.edgeLabel": "3",
            "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
            "elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED",
            "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
            "elk.layered.cycleBreaking.strategy": "MODEL_ORDER"
        },
        children: ordineLayout(diagramma.nodi).map((nodo) => ({
            id: nodo.id,
            ...dimensioni(nodo),
            layoutOptions: { "elk.portConstraints": "FIXED_SIDE", "elk.portAlignment.default": "CENTER" },
            ports: [...(porte.get(nodo.id) ?? [])].map((lato) => ({
                id: `${nodo.id}:${lato}`,
                layoutOptions: { "elk.port.side": lato }
            }))
        })),
        /*
         * Una nota con `vicino` è legata al suo nodo da un arco invisibile, che serve solo al layout.
         */
        edges: [...diagramma.nodi.filter(({ vicino }) => vicino).map((nodo): ElkExtendedEdge => ({
            id: `vicino-${nodo.id}`,
            sources: [nodo.vicino!],
            targets: [nodo.id]
        })), ...diagramma.archi.map((arco, index): ElkExtendedEdge => ({
            id: `arco-${index}`,
            sources: [`${arco.da}:${direzioni[index].uscita}`],
            targets: [`${arco.a}:${direzioni[index].entrata}`],
            layoutOptions: {
                "elk.layered.priority.straightness": (direzioni[index].uscita === "SOUTH") ? "20" : "0",
                "elk.layered.priority.shortness": (direzioni[index].uscita === "SOUTH") ? "20" : "0"
            },
            labels: etichette(arco.etichetta)
        }))]
    };

    const layout = await new ELK().layout(grafo);
    const margine = 6;
    const larghezza = Math.ceil((layout.width ?? 0) + (margine * 2));
    const altezza = Math.ceil((layout.height ?? 0) + (margine * 2));
    const freccia = `freccia-${diagramma.slug}`;

    const parti: string[] = [];
    parti.push(`<svg class="diagramma-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${larghezza} ${altezza}" ` +
        `width="${larghezza}" height="${altezza}" role="img" aria-label="${escape(diagramma.titolo)}">`);
    /*
     * Due punte: quella normale e una arretrata per le frecce che finiscono su una giunzione,
     * così la punta si ferma sul bordo del pallino invece di finirci sotto.
     */
    const punta = (id: string, arretra: number) =>
        `<marker id="${id}" viewBox="0 0 10 10" refX="${9 + arretra}" refY="5" markerWidth="7" markerHeight="7" ` +
        "orient=\"auto-start-reverse\"><path class=\"d-punta\" d=\"M0,0L10,5L0,10z\"/></marker>";
    parti.push(`<defs>${punta(freccia, 0)}${punta(`${freccia}-giunzione`, 5)}</defs>`);
    parti.push(`<g transform="translate(${margine} ${margine})">`);

    for (const arco of (layout.edges ?? []).filter(({ id }) => !id.startsWith("vicino-")))
    {
        for (const sezione of arco.sections ?? [])
        {
            const punti: Punto[] = [sezione.startPoint, ...(sezione.bendPoints ?? []), sezione.endPoint];
            const d = punti.map((punto, index) => `${index ? "L" : "M"}${punto.x},${punto.y}`).join("");
            const destinazione = arco.targets?.[0]?.split(":")[0];
            const giunzione = diagramma.nodi.find(({ id }) => id === destinazione)?.tipo === "giunzione";
            parti.push(`<path class="d-arco" d="${d}" marker-end="url(#${freccia}${giunzione ? "-giunzione" : ""})"/>`);
        }
        for (const etichetta of arco.labels ?? [])
        {
            const testo = etichetta.text ?? "";
            const classe = (/^s[iì]$/i).test(testo) ? "si" : ((/^no$/i).test(testo) ? "no" : "");
            parti.push(`<text class="d-etichetta ${classe}" x="${(etichetta.x ?? 0) + 5}" ` +
                `y="${(etichetta.y ?? 0) + 12}">${escape(testo)}</text>`);
        }
    }

    for (const figlio of layout.children ?? [])
    {
        const nodo = diagramma.nodi.find(({ id }) => id === figlio.id)!;
        if (nodo.tipo === "giunzione")
        {
            const centro = `cx="${(figlio.x ?? 0) + 1}" cy="${(figlio.y ?? 0) + 1}"`;
            parti.push(`<circle class="d-giunzione" ${centro} r="4"/>`);
            continue;
        }
        const { x = 0, y = 0, width = 0, height = 0 } = figlio;
        const cx = x + (width / 2);
        const cy = y + (height / 2);
        const classi = ["d-nodo", `d-${nodo.tipo}`, nodo.colore ? `d-${nodo.colore}` : ""].join(" ").trim();

        parti.push(`<g class="${classi}">`);
        if (nodo.tipo === "decisione")
        {
            parti.push(`<path d="M${cx},${y}L${x + width},${cy}L${cx},${y + height}L${x},${cy}z"/>`);
        }
        else
        {
            const pillola = !nodo.elenco && (nodo.tipo !== "azione") && (nodo.tipo !== "nota");
            const raggio = pillola ? height / 2 : ((nodo.tipo === "fine") ? 16 : 8);
            parti.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${raggio}"/>`);
        }

        const inizio = cy - (((nodo.righe.length - 1) * RIGA) / 2) + 4.5;
        const testoX = nodo.elenco ? `x="${x + 12}" class="sinistra" xml:space="preserve"` : `x="${cx}"`;
        nodo.righe.forEach((riga, index) =>
        {
            parti.push(`<text ${testoX} y="${inizio + (index * RIGA)}">${escape(riga)}</text>`);
        });
        parti.push("</g>");
    }
    parti.push("</g></svg>");

    return parti.join("");
}

/*
 * La versione testuale del diagramma: un elenco dei blocchi con i rami, per lettori di schermo e telefoni.
 */
export function versioneTestuale(diagramma: Diagramma): string
{
    /*
     * Una giunzione non ha testo: si nomina il nodo a cui porta.
     */
    const nome = (id: string): string =>
    {
        const nodo = diagramma.nodi.find((value) => value.id === id);
        if (nodo?.tipo === "giunzione")
        {
            return nome(diagramma.archi.find(({ da }) => da === id)?.a ?? id);
        }

        return nodo?.righe.join(" ") ?? id;
    };

    const voci = diagramma.nodi.filter(({ tipo }) => tipo !== "nota" && tipo !== "giunzione").map((nodo) =>
    {
        const uscite = diagramma.archi.filter(({ da }) => da === nodo.id).map((arco) =>
        {
            const ramo = arco.etichetta ? `<strong>${escape(arco.etichetta)}</strong> → ` : "→ ";

            return `${ramo}${escape(nome(arco.a))}`;
        });
        const rami = uscite.length ? `<br><small>${uscite.join(" · ")}</small>` : "";

        return `<li>${escape(nodo.righe.join(" "))}${rami}</li>`;
    });

    return `<ol>${voci.join("")}</ol>`;
}

export function listDiagrammi(contentDir: string): string[]
{
    const dir = join(contentDir, "diagrammi");

    return readdirSync(dir).filter((file) => file.endsWith(".yaml"))
        .map((file) => join(dir, file));
}

/*
 * Tutti i diagrammi, già disegnati. Il layout di ELK è asincrono: si calcola una volta sola per build.
 */
let cache: Promise<Map<string, { diagramma: Diagramma, svg: string }>> | undefined;
export function caricaDiagrammi(contentDir: string, ricarica = false)
{
    if (!cache || ricarica)
    {
        cache = Promise.all(listDiagrammi(contentDir).map(async (path) =>
        {
            const diagramma = leggiDiagramma(path);

            return [diagramma.slug, { diagramma: diagramma, svg: await disegnaDiagramma(diagramma) }] as const;
        })).then((voci) => new Map(voci));
    }

    return cache;
}

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { calcolaPunteggio, PENALITA_AUTOPROTEZIONE, PENALITA_ERRORE_GRAVE } from "../src/content/punteggio-scenario";
import type { FaseScenario } from "../src/content/types";
import { compileScenario } from "../vite/markdown";

const { scenario } = compileScenario(readFileSync(
    join(import.meta.dirname, "../src/content/scenari/14-bambino-difficolta-respiratoria.yaml"),
    "utf-8"
));
const fasi = scenario.fasi as FaseScenario[];

describe("Punteggio degli scenari", () =>
{
    it("dà 80 su 80 se tutto è fatto", () =>
    {
        const punteggio = calcolaPunteggio(fasi, () => true);

        expect(punteggio).toMatchObject({ totale: 80, massimo: 80, soglia: 60, superato: true, invalidato: false });
    });
    it("invalida lo scenario se manca l'allerta della SOREU", () =>
    {
        const punteggio = calcolaPunteggio(fasi, (fase) => fase.id !== "sopravvivenza");

        expect(punteggio.invalidato).toBe(true);
        expect(punteggio.superato).toBe(false);
    });
    it("toglie punti fissi per la sicurezza della scena, senza invalidare", () =>
    {
        const punteggio = calcolaPunteggio(fasi, (fase, indice) => !((fase.id === "scena") && (indice === 0)));

        expect(punteggio.totale).toBe(80 - PENALITA_ERRORE_GRAVE);
        expect(punteggio.errori).toHaveLength(1);
        expect(punteggio.superato).toBe(false);
    });
    it("toglie punti in più per l'autoprotezione mancante, senza bocciare da sola", () =>
    {
        const punteggio = calcolaPunteggio(fasi, (fase) => fase.id !== "autoprotezione");

        expect(punteggio.totale).toBe(80 - 5 - PENALITA_AUTOPROTEZIONE);
        expect(punteggio.avvertimenti).toHaveLength(1);
        expect(punteggio.superato).toBe(true);
    });
    it("conta le fasi a metà in proporzione e applica le penalità", () =>
    {
        // B: 3 azioni su 6 (7 punti su 15); rivalutazione mancante (-3).
        const punteggio = calcolaPunteggio(fasi, (fase, indice) =>
            !((fase.id === "b") && (indice >= 3)) && (fase.id !== "rivalutazione"));

        expect(punteggio.totale).toBe(80 - 8 - 3);
        expect(punteggio.superato).toBe(true);
    });
});

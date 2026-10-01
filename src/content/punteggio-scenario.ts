import type { FaseScenario, RigaScenario } from "./types";

/*
 * Punteggio degli scenari: un formato nostro, costruito sui numeri delle griglie del corso
 * ma diverso da quello dell'esame (niente skill tecnica né valutazione del soccorso).
 * Spiegato in `ScenariPunteggioPage.vue`: se cambi le regole, aggiorna anche la pagina.
 */
export const SOGLIA = 0.75;
export const PENALITA_ERRORE_GRAVE = 25;
// Autoprotezione incompleta: errore, ma da solo non basta a non superare lo scenario.
export const PENALITA_AUTOPROTEZIONE = 10;
// Valore di un'azione fatta a metà (in ritardo, incompleta o dopo un suggerimento).
export const PARZIALE = 0.5;

export interface DettaglioFase
{
    fase: FaseScenario;
    // Somma dei valori delle azioni: quelle a metà contano {@link PARZIALE}.
    fatte: number;
    totali: number;
    // Punti ottenuti (fasi con punti) o persi, come numero negativo (fasi con penalità).
    punti: number;
    massimo: number;
}
export interface Punteggio
{
    totale: number;
    massimo: number;
    soglia: number;
    fasi: DettaglioFase[];
    errori: RigaScenario[];
    // Fasi di sicurezza (autoprotezione) incomplete.
    avvertimenti: FaseScenario[];
    invalidato: boolean;
    superato: boolean;
}

/*
 * `fatta` restituisce quanto è stata fatta un'azione: 0 (o `false`), PARZIALE, 1 (o `true`).
 * Le azioni a metà valgono in proporzione nei punti e nelle penalità di fase, ma non fanno
 * scattare errori gravi, invalidazione e autoprotezione incompleta: quelli riguardano
 * solo le azioni non fatte del tutto.
 */
export function calcolaPunteggio(
    fasi: FaseScenario[],
    fatta: (fase: FaseScenario, indice: number) => number | boolean
): Punteggio
{
    const valore = (fase: FaseScenario, indice: number) => Number(fatta(fase, indice));

    const dettagli: DettaglioFase[] = [];
    const errori: RigaScenario[] = [];
    const avvertimenti: FaseScenario[] = [];
    let invalidato = false;

    for (const fase of fasi)
    {
        const conteggiate = fase.righe.map((riga, indice) => ({ riga: riga, indice: indice }))
            .filter(({ riga }) => !riga.istruttori);
        const fatte = conteggiate.reduce((somma, { indice }) => somma + valore(fase, indice), 0);
        const totali = conteggiate.length;
        const mancanti = conteggiate.filter(({ indice }) => !valore(fase, indice)).length;

        if (fase.punti)
        {
            // Una fase fatta a metà vale in proporzione alle azioni fatte, arrotondando per difetto.
            const punti = Math.floor((fase.punti * fatte) / totali);
            dettagli.push({ fase: fase, fatte: fatte, totali: totali, punti: punti, massimo: fase.punti });
        }
        else if (fase.penalita)
        {
            const persi = Math.round((fase.penalita * (totali - fatte)) / totali);
            dettagli.push({ fase: fase, fatte: fatte, totali: totali, punti: -persi, massimo: 0 });
        }

        if (fase.grave && mancanti) { invalidato = true; }
        if (fase.sicurezza && mancanti) { avvertimenti.push(fase); }

        errori.push(...fase.righe.filter((riga, indice) => riga.grave && !valore(fase, indice)));
    }

    const massimo = dettagli.reduce((somma, { massimo: value }) => somma + value, 0);
    const soglia = Math.ceil(massimo * SOGLIA);
    const totale = dettagli.reduce((somma, { punti }) => somma + punti, 0) -
        (errori.length * PENALITA_ERRORE_GRAVE) - (avvertimenti.length * PENALITA_AUTOPROTEZIONE);

    return {
        totale: totale,
        massimo: massimo,
        soglia: soglia,
        fasi: dettagli,
        errori: errori,
        avvertimenti: avvertimenti,
        invalidato: invalidato,
        superato: !invalidato && (totale >= soglia)
    };
}

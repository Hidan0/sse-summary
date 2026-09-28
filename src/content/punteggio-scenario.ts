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

export interface DettaglioFase
{
    fase: FaseScenario;
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

export function calcolaPunteggio(
    fasi: FaseScenario[],
    fatta: (fase: FaseScenario, indice: number) => boolean
): Punteggio
{
    const dettagli: DettaglioFase[] = [];
    const errori: RigaScenario[] = [];
    const avvertimenti: FaseScenario[] = [];
    let invalidato = false;

    for (const fase of fasi)
    {
        const conteggiate = fase.righe.map((riga, indice) => ({ riga: riga, indice: indice }))
            .filter(({ riga }) => !riga.istruttori);
        const fatte = conteggiate.filter(({ indice }) => fatta(fase, indice)).length;
        const totali = conteggiate.length;

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

        if (fase.grave && (fatte < totali)) { invalidato = true; }
        if (fase.sicurezza && (fatte < totali)) { avvertimenti.push(fase); }

        errori.push(...fase.righe.filter((riga, indice) => riga.grave && !fatta(fase, indice)));
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

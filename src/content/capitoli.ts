export type Modulo = "SSE" | "TSS";

/*
 * I capitoli SSE sono numerati, quelli TSS hanno la lettera della lezione.
 */
export interface Capitolo
{
    modulo: Modulo;
    codice: number | string;
    cartella: string;
    titolo: string;
    icona: string;
}

export const moduli: Modulo[] = ["SSE", "TSS"];

type DatiCapitolo = Omit<Capitolo, "modulo">;

const sse: DatiCapitolo[] = [
    { codice: 0, cartella: "0-ruolo", titolo: "Ruolo e responsabilità", icona: "scale-balanced" },
    { codice: 1, cartella: "1-trauma", titolo: "Trauma", icona: "car-burst" },
    { codice: 2, cartella: "2-emergenze-mediche", titolo: "Emergenze mediche", icona: "heart-pulse" },
    { codice: 3, cartella: "3-ostetricia", titolo: "Urgenze ostetrico-ginecologiche", icona: "person-pregnant" },
    { codice: 4, cartella: "4-ambientali", titolo: "Emergenze ambientali", icona: "temperature-half" },
    { codice: 5, cartella: "5-trattamento-primario", titolo: "Il trattamento primario", icona: "hand-holding-medical" },
    { codice: 6, cartella: "6-psicologia", titolo: "Aspetti psicologici del soccorso", icona: "brain" },
    { codice: 7, cartella: "7-ambulanza", titolo: "Le operazioni in ambulanza", icona: "truck-medical" },
    { codice: 8, cartella: "8-maxiemergenza", titolo: "Maxiemergenza", icona: "users-between-lines" }
];
const tss: DatiCapitolo[] = [
    { codice: "A", cartella: "a-introduzione", titolo: "Introduzione e premesse", icona: "graduation-cap" },
    { codice: "B", cartella: "b-normativa", titolo: "Normativa, ruolo e responsabilità", icona: "gavel" },
    { codice: "C", cartella: "c-valutazione", titolo: "Anatomia, parametri e valutazione", icona: "stethoscope" },
    { codice: "D", cartella: "d-paziente", titolo: "Il paziente da assistere e trasportare", icona: "person-cane" },
    { codice: "E", cartella: "e-relazione", titolo: "Approccio psicologico e relazionale", icona: "comments" },
    { codice: "F", cartella: "f-assistenza", titolo: "Tecniche assistenziali", icona: "notes-medical" },
    { codice: "G", cartella: "g-blsd", titolo: "BLSD e ostruzione delle vie aeree", icona: "heart-circle-bolt" },
    { codice: "I", cartella: "i-ambulanza", titolo: "Trasporto in ambulanza", icona: "truck-medical" },
    { codice: "J", cartella: "j-guida", titolo: "Sicurezza nella guida", icona: "road" }
];

export const capitoli: Capitolo[] = [
    ...sse.map((capitolo) => ({ ...capitolo, modulo: "SSE" as const })),
    ...tss.map((capitolo) => ({ ...capitolo, modulo: "TSS" as const }))
];

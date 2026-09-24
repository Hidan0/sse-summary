export interface Fonte
{
    titolo: string;
    modulo: "SSE" | "TSS" | "Scenari";
}

/*
 * Registro dei documenti del corso citati nei contenuti con la sintassi `[@id:pagine]`.
 * Le pagine si riferiscono al PDF originale.
 */
export const fonti: Record<string, Fonte> = {
    /*
     * SSE - Capitolo 0: Ruolo e responsabilità
     */
    "0.0": { modulo: "SSE", titolo: "Introduzione e presentazione del corso" },
    "0.1": { modulo: "SSE", titolo: "Ruolo e responsabilità SSE" },

    /*
     * SSE - Capitolo 1: Trauma
     */
    "1.1.1": { modulo: "SSE", titolo: "Epidemiologia del trauma" },
    "1.1.2": { modulo: "SSE", titolo: "Valutazione della scena" },
    "1.2.1": { modulo: "SSE", titolo: "Valutazione primaria" },
    "1.2.2": { modulo: "SSE", titolo: "Valutazione secondaria" },
    "1.3.1": { modulo: "SSE", titolo: "Lesione della colonna vertebrale" },
    "1.3.2": { modulo: "SSE", titolo: "Immobilizzazione atraumatica" },
    "1.4": { modulo: "SSE", titolo: "Le lesioni delle parti molli e ossee" },
    "1.5": { modulo: "SSE", titolo: "Trauma cranico" },
    "1.6": { modulo: "SSE", titolo: "Trauma toracico" },
    "1.7": { modulo: "SSE", titolo: "Le lesioni dell'addome" },
    "1.8.1": { modulo: "SSE", titolo: "Il paziente incastrato" },
    "1.8.2": { modulo: "SSE", titolo: "Le ustioni" },
    "1.8.3": { modulo: "SSE", titolo: "Trauma bambino, anziano e donna gravida" },
    "scenario-trauma-libero": { modulo: "SSE", titolo: "Scenario trauma libero" },

    /*
     * SSE - Capitolo 2: Emergenze mediche
     */
    "2.1": { modulo: "SSE", titolo: "Patologie cardiovascolari" },
    "2.2": { modulo: "SSE", titolo: "Principali patologie mediche" },
    "2.3": { modulo: "SSE", titolo: "Urgenze pediatriche" },
    "ped-approfondimenti": { modulo: "SSE", titolo: "Approfondimenti in età pediatrica" },
    "abcde-note": { modulo: "SSE", titolo: "Note descrittive schema ABCDE" },

    /*
     * SSE - Capitolo 3: Urgenze ostetrico-ginecologiche
     */
    "3": { modulo: "SSE", titolo: "Urgenze ostetriche e ginecologiche" },
    "ost-manuale": { modulo: "SSE", titolo: "Manuale urgenze ostetriche e ginecologiche" },
    "rian-nascita-vent": { modulo: "SSE", titolo: "Rianimazione alla nascita: ventilazioni" },
    "rian-nascita-cte": { modulo: "SSE", titolo: "Rianimazione alla nascita: CTE" },
    "rian-neonatale": { modulo: "SSE", titolo: "Algoritmo rianimazione neonatale" },

    /*
     * SSE - Capitolo 4: Emergenze ambientali
     */
    "4.1": { modulo: "SSE", titolo: "Emergenze ambientali legate alla temperatura" },
    "4.2": { modulo: "SSE", titolo: "Emergenze in ambiente acquatico" },

    /*
     * SSE - Capitolo 5: Il trattamento primario
     */
    "5.1": { modulo: "SSE", titolo: "BLSD" },
    "5.2": { modulo: "SSE", titolo: "PBLSD" },
    "5.3": { modulo: "SSE", titolo: "Ostruzione vie aeree adulto" },
    "5.4": { modulo: "SSE", titolo: "Ostruzione vie aeree pediatrica" },
    "blsd-manuale": { modulo: "SSE", titolo: "Manuale BLSD" },
    "pblsd-manuale": { modulo: "SSE", titolo: "Manuale PBLSD" },
    "blsd-skill": { modulo: "SSE", titolo: "Scheda skill BLSD adulto" },
    "pblsd-skill": { modulo: "SSE", titolo: "Scheda skill BLSD pediatrico" },

    /*
     * SSE - Capitolo 6: Aspetti psicologici
     */
    "6.1": { modulo: "SSE", titolo: "Le principali reazioni del soccorritore" },
    "6.2": { modulo: "SSE", titolo: "I bisogni del paziente in situazioni di urgenza" },

    /*
     * SSE - Capitolo 7: Le operazioni in ambulanza
     */
    "7.1": { modulo: "SSE", titolo: "La compilazione della relazione di soccorso MSB" },
    "7.2": { modulo: "SSE", titolo: "Le operazioni in ambulanza" },

    /*
     * SSE - Capitolo 8: Maxiemergenza
     */
    "8": { modulo: "SSE", titolo: "Maxiemergenza" },
    "8.3": { modulo: "SSE", titolo: "Aspetti psicologici nelle maxiemergenze" },
    "maxi-manuale": { modulo: "SSE", titolo: "Manuale maxiemergenza" },
    "triage": { modulo: "SSE", titolo: "Triage: codici colore" },
    "iop4": { modulo: "SSE", titolo: "IOP 4: istruzioni primo MSB incidente maggiore" },

    /*
     * TSS
     */
    "tss-a": { modulo: "TSS", titolo: "Introduzione e premesse" },
    "tss-b": { modulo: "TSS", titolo: "Normativa, ruolo e responsabilità" },
    "tss-c": { modulo: "TSS", titolo: "Scheda valutazione ABCDE" },
    "tss-c1": { modulo: "TSS", titolo: "Cenni di anatomia e fisiologia" },
    "tss-c2": { modulo: "TSS", titolo: "Rilevazione dei parametri vitali" },
    "tss-c3": { modulo: "TSS", titolo: "Valutazione primaria del paziente" },
    "tss-d": { modulo: "TSS", titolo: "Caratteristiche del paziente da assistere e trasportare" },
    "tss-e": { modulo: "TSS", titolo: "Approccio psicologico e relazionale" },
    "tss-f": { modulo: "TSS", titolo: "Tecniche assistenziali" },
    "tss-g1": { modulo: "TSS", titolo: "BLSD per addetto al trasporto sanitario" },
    "tss-g2": { modulo: "TSS", titolo: "Ostruzione delle vie aeree adulto e pediatrica" },
    "tss-skill-blsd": { modulo: "TSS", titolo: "Scheda skill BLSD adulto" },
    "tss-skill-ostr-adulto": { modulo: "TSS", titolo: "Scheda skill disostruzione adulto" },
    "tss-skill-ostr-infante": { modulo: "TSS", titolo: "Scheda skill disostruzione infante" },
    "tss-i": { modulo: "TSS", titolo: "Trasporto in ambulanza" },
    "tss-j": { modulo: "TSS", titolo: "Sicurezza nella guida" },
    "tss-manuale-blsd": { modulo: "TSS", titolo: "Manuale BLSD e ostruzione adulto/pediatrica" },
    "tss-sigle": { modulo: "TSS", titolo: "Sigle e acronimi" },
    "tss-pedimate": { modulo: "TSS", titolo: "Pedi Mate" },
    "tss-abcde-note": { modulo: "TSS", titolo: "Note descrittive schema ABCDE" },

    /*
     * Scenari d'esame
     */
    "scenari": { modulo: "Scenari", titolo: "Scenari ABCDE riuniti" }
};

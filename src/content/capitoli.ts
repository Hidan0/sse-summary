export interface Capitolo
{
    numero: number;
    cartella: string;
    titolo: string;
    icona: string;
}

export const capitoli: Capitolo[] = [
    { numero: 0, cartella: "0-ruolo", titolo: "Ruolo e responsabilità", icona: "scale-balanced" },
    { numero: 1, cartella: "1-trauma", titolo: "Trauma", icona: "car-burst" },
    { numero: 2, cartella: "2-emergenze-mediche", titolo: "Emergenze mediche", icona: "heart-pulse" },
    { numero: 3, cartella: "3-ostetricia", titolo: "Urgenze ostetrico-ginecologiche", icona: "person-pregnant" },
    { numero: 4, cartella: "4-ambientali", titolo: "Emergenze ambientali", icona: "temperature-half" },
    { numero: 5, cartella: "5-trattamento-primario", titolo: "Il trattamento primario", icona: "hand-holding-medical" },
    { numero: 6, cartella: "6-psicologia", titolo: "Aspetti psicologici del soccorso", icona: "brain" },
    { numero: 7, cartella: "7-ambulanza", titolo: "Le operazioni in ambulanza", icona: "truck-medical" },
    { numero: 8, cartella: "8-maxiemergenza", titolo: "Maxiemergenza", icona: "users-between-lines" }
];

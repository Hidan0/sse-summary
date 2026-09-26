import type { RouteLocationNormalizedLoaded, RouteLocationRaw } from "vue-router";

export interface SezioneApp
{
    nome: string;
    breve: string;
    icona: string;
    to: RouteLocationRaw;
    attiva: (route: RouteLocationNormalizedLoaded) => boolean;
}

const inizia = (route: RouteLocationNormalizedLoaded, prefisso: string) => route.path.startsWith(prefisso);

/*
 * Le sezioni principali dell'app: barra in alto su desktop, barra in basso su telefono.
 */
export const SEZIONI_APP: SezioneApp[] = [
    {
        nome: "Argomenti",
        breve: "Argomenti",
        icona: "book-open",
        to: { name: "home" },
        attiva: (route) => (route.path === "/") || inizia(route, "/riassunti")
    },
    {
        nome: "ABCDE",
        breve: "ABCDE",
        icona: "clipboard-list",
        to: { name: "abcde" },
        attiva: (route) => inizia(route, "/abcde")
    },
    {
        nome: "Quiz",
        breve: "Quiz",
        icona: "circle-question",
        to: { name: "quiz" },
        attiva: (route) => inizia(route, "/quiz")
    },
    {
        nome: "Glossario",
        breve: "Glossario",
        icona: "book",
        to: { name: "glossario" },
        attiva: (route) => inizia(route, "/glossario")
    }
];

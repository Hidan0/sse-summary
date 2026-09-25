import type { CategoriaAbcde, IdSezioneAbcde, TipoSchema, TipoVoceAbcde } from "./types";

/*
 * Nomi di sezioni, voci e categorie delle schede ABCDE, senza `import.meta.glob`:
 * li usa anche l'indice di ricerca generato al build.
 */
export const SEZIONI: { id: IdSezioneAbcde, lettera: string, nome: string }[] = [
    { id: "scena", lettera: "", nome: "Scena e colpo d'occhio" },
    { id: "a", lettera: "A", nome: "Vie aeree e coscienza" },
    { id: "b", lettera: "B", nome: "Respiro" },
    { id: "c", lettera: "C", nome: "Circolo" },
    { id: "d", lettera: "D", nome: "Stato neurologico" },
    { id: "e", lettera: "E", nome: "Esposizione e anamnesi" },
    { id: "dopo", lettera: "", nome: "SOREU, trasporto e rivalutazione" }
];

export const VOCI: Record<TipoVoceAbcde, { nome: string, icona: string }> = {
    cerca: { nome: "Cosa cercare", icona: "magnifying-glass" },
    chiedi: { nome: "Cosa chiedere", icona: "comments" },
    fai: { nome: "Cosa fare", icona: "hand-holding-medical" },
    attenzione: { nome: "Attenzione", icona: "triangle-exclamation" }
};

export const CATEGORIE: { id: CategoriaAbcde, nome: string, icona: string }[] = [
    { id: "trauma", nome: "Trauma", icona: "car-burst" },
    { id: "medico", nome: "Emergenze mediche", icona: "heart-pulse" },
    { id: "ostetrico", nome: "Ostetricia e neonato", icona: "person-pregnant" },
    { id: "ambientale", nome: "Emergenze ambientali", icona: "temperature-half" }
];

export function getLettera(sezione: IdSezioneAbcde, schema: TipoSchema): string
{
    if ((sezione === "a") && (schema === "trauma")) { return "Ac"; }

    return SEZIONI.find(({ id }) => id === sezione)?.lettera ?? "";
}

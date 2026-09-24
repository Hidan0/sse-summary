import { useRouter } from "vue-router";
import type { LocationQueryRaw } from "vue-router";

/*
 * Restituisce una funzione che costruisce l'URL assoluto (condivisibile) di una pagina dei quiz.
 */
export function useUrlQuiz(): (name: "quiz-sfida" | "quiz-risultato", query: LocationQueryRaw) => string
{
    const router = useRouter();

    return (name, query) => new URL(router.resolve({ name: name, query: query }).href, window.location.href).href;
}

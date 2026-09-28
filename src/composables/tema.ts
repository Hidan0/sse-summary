import { computed, watchEffect } from "vue";
import { useLocalStorage, usePreferredDark } from "@vueuse/core";

export type Tema = "light" | "dark";

/*
 * Il tema segue il sistema finché non lo si cambia a mano; la scelta resta in localStorage
 * (letta anche dallo script in `index.html`, prima del caricamento dell'app).
 * Se la scelta manuale torna a coincidere con il sistema, si torna in automatico.
 */
const scelta = useLocalStorage<Tema | "auto">("sse-tema", "auto");
const scuroDiSistema = usePreferredDark();

const sistema = computed<Tema>(() => (scuroDiSistema.value ? "dark" : "light"));
const automatico = computed(() => (scelta.value !== "dark") && (scelta.value !== "light"));
const tema = computed<Tema>(() => (automatico.value ? sistema.value : scelta.value as Tema));

watchEffect(() => document.documentElement.setAttribute("data-tema", tema.value));

export function useTema()
{
    const cambia = () =>
    {
        const nuovo: Tema = (tema.value === "dark") ? "light" : "dark";
        scelta.value = (nuovo === sistema.value) ? "auto" : nuovo;
    };

    return { tema, automatico, cambia };
}

import { ref } from "vue";
import { defineStore } from "pinia";

interface GlossarioContent { type: "glossario", term: string, label: string }
interface FonteContent { type: "fonte", id: string, title: string }

export type InfoSheetContent = GlossarioContent | FonteContent;

/*
 * Pannello informativo mostrato al tocco su un termine del glossario o su una fonte.
 */
export const useInfoSheet = defineStore("info-sheet", () =>
{
    const content = ref<InfoSheetContent | null>(null);

    const open = (value: InfoSheetContent) => { content.value = value; };
    const close = () => { content.value = null; };

    return { content, open, close };
});

/// <reference types="vite/client" />

declare module "*.md"
{
    const content: {
        frontmatter: Record<string, unknown>;
        html: string;
        toc: { id: string, level: number, text: string }[];
    };

    export default content;
}

declare module "virtual:indice-ricerca"
{
    import type { DocumentoRicerca } from "@/content/ricerca";

    const documenti: DocumentoRicerca[];

    export default documenti;
}

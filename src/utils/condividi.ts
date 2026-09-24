export type EsitoCondivisione = "condiviso" | "copiato" | "annullato" | "non-disponibile";

/*
 * Usa il menu di condivisione del sistema (telefoni) e, dove non c'è, copia negli appunti.
 * Se nessuno dei due è disponibile (browser vecchi o contesti non sicuri) il chiamante mostra il link da copiare.
 */
export async function condividi(dati: { titolo: string, testo: string, url: string }): Promise<EsitoCondivisione>
{
    if (navigator.share)
    {
        try
        {
            await navigator.share({ title: dati.titolo, text: dati.testo, url: dati.url });

            return "condiviso";
        }
        catch (error)
        {
            if ((error as DOMException).name === "AbortError") { return "annullato"; }
        }
    }

    try
    {
        await navigator.clipboard.writeText(`${dati.testo}\n${dati.url}`);

        return "copiato";
    }
    catch
    {
        return "non-disponibile";
    }
}

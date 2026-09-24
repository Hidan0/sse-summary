/*
 * I file ordinati si chiamano `<ordine>-<slug>.md`, es. `1.6-trauma-toracico.md`.
 */
export function parseOrdineSlug(path: string): { ordine: number[], slug: string }
{
    const name = path.slice(path.lastIndexOf("/") + 1, -".md".length);
    const separator = name.indexOf("-");

    return {
        ordine: name.slice(0, separator).split(".")
            .map(Number),
        slug: name.slice(separator + 1)
    };
}

export function compareOrdine(a: number[], b: number[]): number
{
    for (let index = 0; index < Math.max(a.length, b.length); index += 1)
    {
        const difference = (a[index] ?? -1) - (b[index] ?? -1);
        if (difference !== 0) { return difference; }
    }

    return 0;
}

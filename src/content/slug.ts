export function slugify(text: string): string
{
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036F]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

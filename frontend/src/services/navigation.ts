import { type EditorDocument } from "../core/model";
import { sourcePdf } from "./viewer";
type OutlineNode = { title: string; dest: unknown; items: OutlineNode[] };
export type NavigationItem = { title: string; pageId: string };
export async function searchDocument(document: EditorDocument, query: string) {
  const results: NavigationItem[] = [],
    needle = query.toLocaleLowerCase();
  for (const page of document.pages) {
    const source = document.sources.find((item) => item.id === page.sourceId);
    let text = page.objects.map((object) => object.text).join(" ");
    if (source) {
      const content = await (
        await (await sourcePdf(source)).getPage(page.sourceIndex + 1)
      ).getTextContent();
      text += " " + content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
      text +=
        " " +
        source.fields
          .filter((field) => field.widgets.some((widget) => widget.pageIndex === page.sourceIndex))
          .map((field) => String(document.values[field.id] ?? field.value))
          .join(" ");
    }
    const index = text.toLocaleLowerCase().indexOf(needle);
    if (index >= 0)
      results.push({
        pageId: page.id,
        title: text.slice(Math.max(0, index - 25), index + query.length + 65),
      });
  }
  return results;
}
function flattenOutline(nodes: OutlineNode[], depth = 0): { title: string; dest: unknown }[] {
  return nodes.flatMap((node) => [
    { title: `${"  ".repeat(Math.min(depth, 10))}${node.title}`, dest: node.dest },
    ...flattenOutline(node.items, depth + 1),
  ]);
}
export async function documentOutline(document: EditorDocument) {
  const result: NavigationItem[] = [];
  for (const source of document.sources) {
    const pdf = await sourcePdf(source),
      nodes = await pdf.getOutline();
    for (const node of flattenOutline((nodes ?? []) as OutlineNode[])) {
      const destination: unknown =
        typeof node.dest === "string" ? await pdf.getDestination(node.dest) : node.dest;
      if (!Array.isArray(destination)) continue;
      const index = await destinationIndex(pdf, destination[0]);
      const page = document.pages.find(
        (item) => item.sourceId === source.id && item.sourceIndex === index
      );
      if (page) result.push({ title: node.title, pageId: page.id });
    }
  }
  return result;
}
async function destinationIndex(pdf: Awaited<ReturnType<typeof sourcePdf>>, reference: unknown) {
  if (typeof reference === "number") return reference;
  if (isReference(reference)) return pdf.getPageIndex(reference);
  return -1;
}
function isReference(value: unknown): value is { num: number; gen: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "num" in value &&
    "gen" in value &&
    typeof value.num === "number" &&
    typeof value.gen === "number"
  );
}

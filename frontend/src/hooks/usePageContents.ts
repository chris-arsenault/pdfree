import { useEffect, useState } from "react";
import { useEditor } from "./editorContext";
import { pageContent, type PageContent } from "../services/pageContent";

/** Classifies the given pages' original content; pages still being checked are absent. */
export function usePageContents(pageIds: string[]) {
  const editor = useEditor(),
    document = editor.document;
  const [contents, setContents] = useState<ReadonlyMap<string, PageContent>>(new Map());
  const key = pageIds.join(",");
  useEffect(() => {
    let cancelled = false;
    const ids = key ? key.split(",") : [];
    const run = async () => {
      const found = new Map<string, PageContent>();
      for (const id of ids) {
        const page = document.pages.find((page) => page.id === id);
        if (!page) continue;
        found.set(id, await pageContent(document, page));
        if (cancelled) return;
        // Publish in small batches so long documents show progress without re-rendering per page.
        if (found.size % 20 === 0 || found.size === ids.length) setContents(new Map(found));
      }
      setContents(new Map(found));
    };
    run().catch((error: Error) => {
      if (!cancelled) console.error(error.message);
    });
    return () => {
      cancelled = true;
    };
  }, [document, key]);
  const checked = pageIds.filter((id) => contents.has(id)).length;
  return { contents, checked, ready: checked === pageIds.length };
}

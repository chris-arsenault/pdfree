import { useState } from "react";
import { useEditor } from "./editorContext";
import { scopePageIds, type PageScope, type PageScopeKind } from "../core/pageScope";
import { errorMessage } from "../i18n/messages";
import { useMessages } from "../i18n/react";

/** Dialog-local page scope, initialised from the caller's default and the thumbnail selection. */
export function usePageScope(initial: PageScopeKind) {
  const { renderMessage } = useMessages();
  const editor = useEditor();
  const [scope, setScope] = useState<PageScope>({ kind: initial, range: "" });
  const resolved = resolveScope(editor, scope);
  return {
    scope,
    setScope,
    ...resolved,
    error: resolved.error ? renderMessage(resolved.error) : "",
  };
}

export function resolveScope(editor: ReturnType<typeof useEditor>, scope: PageScope) {
  try {
    return {
      pageIds: scopePageIds(editor.document, scope, editor.pageIds, editor.page?.id ?? ""),
      error: null,
    };
  } catch (cause) {
    return { pageIds: [] as string[], error: errorMessage(cause) };
  }
}

/** Default for whole-document scan processing: the checked thumbnails, otherwise every page. */
export function selectionOrAll(editor: ReturnType<typeof useEditor>): PageScopeKind {
  return editor.document.pages.some((page) => editor.pageIds.includes(page.id))
    ? "selected"
    : "all";
}

/** Default for commands that historically acted on the selection or the current page. */
export function selectionDefault(editor: ReturnType<typeof useEditor>): PageScopeKind {
  return editor.document.pages.some((page) => editor.pageIds.includes(page.id))
    ? "selected"
    : "current";
}

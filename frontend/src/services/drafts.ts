import { createStore, entries, get, promisifyRequest } from "idb-keyval";
import { newId, type EditorDocument, canSaveDraft } from "../core/model";
import { refreshSources } from "../core/refreshSources";

export type Draft = {
  version: 1;
  modelRevision: 3;
  id: string;
  revision: string;
  document: EditorDocument;
  savedAt: number;
};
export type DraftSession = {
  id: string;
  generation: number;
  entryGeneration: number;
  revision: string;
};
const store = createStore("keyval-store", "keyval");
const prefix = "pdfree-draft-v2:";
const legacyKey = "pdfree-draft-v1";
const generationKey = "pdfree-draft-generation";
const channelName = "pdfree-drafts-cleared";
const owner = newId();
let activeId: string = owner;
let predecessor = "";
try {
  predecessor = sessionStorage.getItem("pdfree-draft-slot") ?? "";
  sessionStorage.setItem("pdfree-draft-slot", owner);
} catch {
  // A unique page-lifetime slot remains safe when session storage is unavailable.
}

export async function draftSession(
  id: string = owner,
  openedRevision?: string
): Promise<DraftSession> {
  const [generation, entryGeneration, draft] = await Promise.all([
    get<number>(generationKey, store),
    get<number>(generationKey + ":" + id, store),
    get<Draft>(draftKey(id), store),
  ]);
  return {
    id,
    generation: generation ?? 0,
    entryGeneration: entryGeneration ?? 0,
    revision: openedRevision ?? draft?.revision ?? "",
  };
}

export function activeDraft(id: string) {
  activeId = id;
  try {
    sessionStorage.setItem("pdfree-draft-slot", id);
  } catch {
    // Library entries still work when session storage is unavailable.
  }
}
const draftKey = (id: string) => (id === "legacy" ? legacyKey : prefix + id);

export async function loadDrafts(): Promise<Draft[]> {
  const stored = await entries<string, Draft>(store);
  const drafts = await Promise.all(
    stored
      .filter(
        ([key, draft]) => (key === legacyKey || key.startsWith(prefix)) && draft?.version === 1
      )
      .map(async ([key, draft]) => ({
        ...draft,
        modelRevision: 3 as const,
        document: normalizeDraft(
          draft.modelRevision >= 2
            ? draft.document
            : {
                ...draft.document,
                ...(await refreshSources(draft.document.sources, draft.document.pages)),
              }
        ),
        id: key === legacyKey ? "legacy" : key.slice(prefix.length),
        revision: typeof draft.revision === "string" ? draft.revision : "",
      }))
  );
  return drafts.sort((a, b) => {
    const priority = (draft: Draft) =>
      Number(draft.id === activeId) * 2 + Number(draft.id === predecessor);
    return priority(b) - priority(a) || b.savedAt - a.savedAt;
  });
}

export const loadDraft = async () => (await loadDrafts())[0] ?? null;
function normalizeDraft(document: EditorDocument): EditorDocument {
  return {
    ...document,
    allowDecryptedDrafts: document.allowDecryptedDrafts === true,
    sources: document.sources.map((source) => ({
      ...source,
      decryptedBytes: source.decryptedBytes ?? null,
      encryption: source.encryption ?? null,
    })),
  };
}

export async function saveDraft(
  document: EditorDocument,
  session: DraftSession | null = null,
  permitted = () => true
) {
  if (!canSaveDraft(document))
    throw new Error("Enable decrypted local drafts before saving this document.");
  const current = session ?? (await draftSession());
  return store("readwrite", (objects) => {
    let saved = false;
    const next = { ...current };
    const generation = objects.get(generationKey);
    const entry = objects.get(generationKey + ":" + current.id);
    const existing = objects.get(draftKey(current.id));
    // Requests in one transaction complete in order; the final read sees both tokens.
    existing.onsuccess = () => {
      if (
        (generation.result ?? 0) !== current.generation ||
        (entry.result ?? 0) !== current.entryGeneration ||
        !permitted()
      )
        return;
      // Keep both working copies if another tab saved this entry since we read it.
      if ((existing.result?.revision ?? "") !== current.revision) {
        next.id = newId();
        next.entryGeneration = 0;
      }
      next.revision = newId();
      objects.put(
        {
          version: 1,
          modelRevision: 3,
          id: next.id,
          revision: next.revision,
          document,
          savedAt: Date.now(),
        },
        draftKey(next.id)
      );
      saved = true;
    };
    return promisifyRequest(objects.transaction).then(() => {
      if (saved) Object.assign(current, next);
      return saved;
    });
  });
}

export async function deleteSavedDraft(id: string) {
  await store("readwrite", (objects) => {
    const token = generationKey + ":" + id;
    const request = objects.get(token);
    request.onsuccess = () => {
      objects.put((request.result ?? 0) + 1, token);
      objects.delete(draftKey(id));
    };
    return promisifyRequest(objects.transaction);
  });
  notifyRemoved(id);
}

export async function deleteDraft() {
  const generation = await store("readwrite", (objects) => {
    let next = 0;
    const request = objects.get(generationKey);
    request.onsuccess = () => {
      next = (request.result ?? 0) + 1;
      objects.put(next, generationKey);
      const keys = objects.getAllKeys();
      keys.onsuccess = () => {
        for (const key of keys.result) {
          if (typeof key === "string" && (key === legacyKey || key.startsWith(prefix)))
            objects.delete(key);
        }
      };
    };
    return promisifyRequest(objects.transaction).then(() => next);
  });
  notifyRemoved(null);
  return generation;
}

function notifyRemoved(id: string | null) {
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent(channelName, { detail: id }));
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(channelName);
    channel.postMessage(id);
    channel.close();
  }
}

export function onDraftsRemoved(notify: (id: string | null) => void) {
  const local = (event: Event) => notify((event as CustomEvent<string | null>).detail);
  window.addEventListener(channelName, local);
  const channel =
    typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(channelName);
  if (channel) channel.onmessage = (event: MessageEvent<string | null>) => notify(event.data);
  return () => {
    window.removeEventListener(channelName, local);
    channel?.close();
  };
}

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
export type DraftSession = { id: string; generation: number };
const store = createStore("keyval-store", "keyval");
const prefix = "pdfree-draft-v2:";
const legacyKey = "pdfree-draft-v1";
const generationKey = "pdfree-draft-generation";
const channelName = "pdfree-drafts-cleared";
const owner = newId();
let predecessor = "";
try {
  predecessor = sessionStorage.getItem("pdfree-draft-slot") ?? "";
  sessionStorage.setItem("pdfree-draft-slot", owner);
} catch {
  // A unique page-lifetime slot remains safe when session storage is unavailable.
}

export async function draftSession(id: string = owner): Promise<DraftSession> {
  return { id, generation: (await get<number>(generationKey, store)) ?? 0 };
}

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
      Number(draft.id === owner) * 2 + Number(draft.id === predecessor);
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
    const generation = objects.get(generationKey);
    generation.onsuccess = () => {
      if ((generation.result ?? 0) !== current.generation || !permitted()) return;
      objects.put(
        {
          version: 1,
          modelRevision: 3,
          id: current.id,
          revision: newId(),
          document,
          savedAt: Date.now(),
        },
        prefix + current.id
      );
      saved = true;
    };
    return promisifyRequest(objects.transaction).then(() => saved);
  });
}

export async function removeRecoveredDraft(draft: Draft, destinationId: string) {
  if (draft.id === destinationId) return;
  await store("readwrite", (objects) => {
    const key = draft.id === "legacy" ? legacyKey : prefix + draft.id;
    const request = objects.get(key);
    request.onsuccess = () => {
      const unchanged = draft.revision
        ? request.result?.revision === draft.revision
        : request.result?.savedAt === draft.savedAt;
      if (unchanged) objects.delete(key);
    };
    return promisifyRequest(objects.transaction);
  });
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
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent(channelName, { detail: generation }));
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(channelName);
    channel.postMessage(generation);
    channel.close();
  }
  return generation;
}

export function onDraftsCleared(notify: (generation: number) => void) {
  const local = (event: Event) => notify((event as CustomEvent<number>).detail);
  window.addEventListener(channelName, local);
  const channel =
    typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(channelName);
  if (channel) channel.onmessage = (event: MessageEvent<number>) => notify(event.data);
  return () => {
    window.removeEventListener(channelName, local);
    channel?.close();
  };
}

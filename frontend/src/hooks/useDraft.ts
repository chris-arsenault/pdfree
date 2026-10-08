import {
  useEffect,
  useContext,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
  type RefObject,
} from "react";
import { useEditor } from "./editorContext";
import {
  loadDrafts,
  saveDraft,
  draftSession,
  activeDraft,
  onDraftsRemoved,
  type Draft,
  type DraftSession,
} from "../services/drafts";
import { type EditorDocument, canSaveDraft } from "../core/model";
import { releaseViewers } from "../services/viewer";
import { SessionContext } from "./sessionContext";
import { DraftContext } from "./draftContext";

export function useDraft() {
  const draft = useContext(DraftContext);
  if (!draft) throw new Error("The document draft provider is missing.");
  return draft;
}
export function useDraftState(active = true) {
  const editor = useEditor();
  const sessions = useContext(SessionContext);
  const [recoveries, setRecoveries] = useState<Draft[]>([]),
    [status, setStatus] = useState("");
  const { document: doc, history, savedRevision } = editor;
  const opened = useRef<{ id: string; revision: string } | null>(null);
  useDraftSync(
    doc,
    { id: editor.draftId, opened },
    editor.documentEpoch,
    setStatus,
    setRecoveries,
    editor.setDraftId,
    active
  );
  useEffect(() => {
    let cancelled = false;
    loadDrafts()
      .then((drafts) => {
        if (!cancelled) setRecoveries(drafts);
      })
      .catch(() => {
        if (!cancelled)
          setStatus("Draft storage is unavailable. Download an editing project to keep your work.");
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (doc.pages.length && savedRevision !== history.revision) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [doc.pages.length, savedRevision, history.revision]);
  useEffect(() => {
    if (!active) return;
    releaseViewers(doc.sources.map((source) => source.id));
  }, [doc.sources, active]);
  const restore = (draft: Draft) =>
    editor.task.run("Opening saved document", async () => {
      if (sessions) {
        const saved = (await loadDrafts()).find((item) => item.id === draft.id);
        if (!saved) throw new Error("This saved document was deleted.");
        editor.setDialog("");
        sessions.openDocument(saved.document, saved.id);
        return;
      }
      if (
        doc.pages.length &&
        editor.savedRevision !== editor.history.revision &&
        !(await editor.confirmation.ask({
          title: "Open a saved document?",
          message: "Download an editing project first if you need to keep your current edits.",
          confirmLabel: "Open document",
          tone: "primary",
        }))
      )
        return;
      const saved = (await loadDrafts()).find((item) => item.id === draft.id);
      if (!saved) throw new Error("This saved document was deleted. Choose another document.");
      opened.current = { id: saved.id, revision: saved.revision };
      editor.replace(saved.document);
      editor.setDraftId(draft.id);
      setRecoveries([]);
    });
  return { recoveries, status, restore };
}

// eslint-disable-next-line max-lines-per-function -- The queued save and generation/consent checks share this session lifecycle.
function useDraftSync(
  doc: EditorDocument,
  { id, opened }: { id: string; opened: RefObject<{ id: string; revision: string } | null> },
  epoch: number,
  setStatus: Dispatch<SetStateAction<string>>,
  setRecoveries: Dispatch<SetStateAction<Draft[]>>,
  setDraftId: Dispatch<SetStateAction<string>>,
  active: boolean
) {
  const writes = useRef<Promise<void>>(Promise.resolve());
  const session = useRef<Promise<DraftSession> | null>(null);
  const paused = useRef<EditorDocument | null>(null),
    current = useRef({ document: doc, id, epoch });
  useEffect(() => {
    current.current = { document: doc, id, epoch };
  }, [doc, id, epoch]);
  useEffect(() => {
    session.current = draftSession(
      id,
      opened.current?.id === id ? opened.current.revision : undefined
    );
    paused.current = null;
  }, [id, epoch, opened]);
  useEffect(() => {
    if (active) activeDraft(id);
  }, [active, id]);
  useEffect(
    () =>
      onDraftsRemoved((removed) => {
        setRecoveries((saved) => remainingDrafts(saved, removed));
        if (removed !== null && removed !== current.current.id) return;
        paused.current = current.current.document;
        session.current = draftSession(current.current.id);
        setStatus(
          "Removed from library. This document stays open; saving resumes after your next edit."
        );
      }),
    [setRecoveries, setStatus]
  );
  useEffect(() => {
    if (!doc.pages.length || paused.current === doc) return;
    if (!canSaveDraft(doc)) {
      setStatus(
        "Encrypted input: decrypted drafts are disabled. Enable them in Document details or save a project."
      );
      return;
    }
    const writer = (session.current ??= draftSession(id));
    const permitted = () => maySave(current.current, id, epoch);
    setStatus("Saving draft…");
    const timer = setTimeout(() => {
      writes.current = writes.current
        .catch(() => {})
        .then(async () => {
          const active = await writer;
          if (!permitted()) return;
          if (!(await saveDraft(doc, active, permitted))) {
            if (!permitted()) return;
            paused.current = current.current.document;
            session.current = draftSession(id);
            setStatus(
              "Removed from library. This document stays open; saving resumes after your next edit."
            );
            return;
          }
          if (!permitted()) return;
          if (active.id !== id) setDraftId(active.id);
          setStatus("Draft saved on this device");
        })
        .catch(() => {
          setStatus(
            "Draft could not be saved. Download an editing project; browser storage may be full."
          );
        });
    }, 600);
    return () => clearTimeout(timer);
  }, [doc, id, epoch, setStatus, setDraftId]);
}
function remainingDrafts(saved: Draft[], removed: string | null) {
  return removed === null ? [] : saved.filter((draft) => draft.id !== removed);
}
function maySave(
  current: { document: EditorDocument; id: string; epoch: number },
  id: string,
  epoch: number
) {
  return current.id === id && current.epoch === epoch && canSaveDraft(current.document);
}

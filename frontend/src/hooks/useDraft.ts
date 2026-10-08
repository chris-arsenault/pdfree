import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useEditor } from "./editorContext";
import {
  loadDrafts,
  saveDraft,
  deleteDraft,
  draftSession,
  onDraftsCleared,
  removeRecoveredDraft,
  type Draft,
  type DraftSession,
} from "../services/drafts";
import { clearSignatures } from "../services/signatures";
import { emptyDocument, type EditorDocument, canSaveDraft } from "../core/model";
import { releaseViewers } from "../services/viewer";

export function useDraft() {
  const editor = useEditor();
  const [recoveries, setRecoveries] = useState<Draft[]>([]),
    [status, setStatus] = useState("");
  const adopted = useRef<Draft | null>(null);
  const { document: doc, history, savedRevision } = editor;
  const writes = useDraftSync(doc, setStatus, setRecoveries, adopted);
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
    releaseViewers(doc.sources.map((source) => source.id));
  }, [doc.sources]);
  const restore = (draft: Draft) => {
    if (editor.task.busy) return;
    adopted.current = draft;
    editor.replace(draft.document);
    setRecoveries([]);
  };
  const discard = () =>
    editor.task.run("Clearing local data", async () => {
      if (
        !window.confirm(
          "Clear all stored drafts and remembered signatures from this browser? Other open tabs keep their current documents in memory. Download your project first to keep editable work."
        )
      )
        return;
      editor.replace(emptyDocument());
      adopted.current = null;
      setRecoveries([]);
      await writes.current.catch(() => {});
      await deleteDraft();
      await clearSignatures();
      setStatus("Stored browser drafts and signatures cleared");
    });
  return { recoveries, status, restore, discard };
}

function useDraftSync(
  doc: EditorDocument,
  setStatus: Dispatch<SetStateAction<string>>,
  setRecoveries: Dispatch<SetStateAction<Draft[]>>,
  adopted: { current: Draft | null }
) {
  const writes = useRef<Promise<void>>(Promise.resolve());
  const session = useRef<Promise<DraftSession> | null>(null);
  const paused = useRef<EditorDocument | null>(null),
    current = useRef(doc);
  useEffect(() => {
    current.current = doc;
  }, [doc]);
  useEffect(
    () =>
      onDraftsCleared(() => {
        paused.current = current.current;
        session.current = draftSession();
        adopted.current = null;
        setRecoveries([]);
        setStatus(
          "Stored drafts were cleared. This document stays in memory; drafts resume after your next edit."
        );
      }),
    [adopted, setRecoveries, setStatus]
  );
  useEffect(() => {
    if (!doc.pages.length || paused.current === doc) return;
    if (!canSaveDraft(doc)) {
      setStatus(
        "Encrypted input: decrypted drafts are disabled. Enable them in Document details or save a project."
      );
      return;
    }
    const writer = (session.current ??= draftSession());
    const permitted = () => canSaveDraft(current.current);
    const recovery = adopted.current;
    const timer = setTimeout(() => {
      setStatus("Saving draft…");
      writes.current = writes.current
        .catch(() => {})
        .then(async () => {
          const active = await writer;
          if (!canSaveDraft(current.current)) return;
          if (!(await saveDraft(doc, active, permitted))) {
            if (!canSaveDraft(current.current)) return;
            paused.current = current.current;
            session.current = draftSession();
            setStatus(
              "Stored drafts were cleared. This document stays in memory; drafts resume after your next edit."
            );
            return;
          }
          if (recovery) {
            await removeRecoveredDraft(recovery, active.id);
            if (adopted.current === recovery) adopted.current = null;
          }
          setStatus("Draft saved on this device");
        })
        .catch(() => {
          setStatus(
            "Draft could not be saved. Download an editing project; browser storage may be full."
          );
        });
    }, 600);
    return () => clearTimeout(timer);
  }, [doc, adopted, setStatus]);
  return writes;
}

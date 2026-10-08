import { useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { emptyDocument, newId, type EditorDocument } from "../core/model";
import { useEditorState } from "../hooks/useEditorState";
import { EditorContext } from "../hooks/editorContext";
import {
  SessionContext,
  type SessionInfo,
  type DocumentSessions as SessionsApi,
} from "../hooks/sessionContext";
import { DraftContext } from "../hooks/draftContext";
import { useDraftState } from "../hooks/useDraft";
import { loadDrafts } from "../services/drafts";
type Session = { id: string; document: EditorDocument; draftId?: string; files?: File[] };
const blank = (): Session => ({ id: newId(), document: emptyDocument() });
type Editor = ReturnType<typeof useEditorState>;
export function DocumentSessions({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>(() => [blank()]);
  const [activeId, setActiveId] = useState(sessions[0].id),
    [ready, setReady] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, SessionInfo>>({});
  const editors = useRef(new Map<string, Editor>());
  const update = useCallback((id: string, editor: Editor) => {
    editors.current.set(id, editor);
    const info = editorInfo(id, editor);
    setMetadata((previous) =>
      JSON.stringify(previous[id]) === JSON.stringify(info) ? previous : { ...previous, [id]: info }
    );
  }, []);
  useSessionRecovery(
    (recovered, draftId) => {
      if (!mayRestore(editors.current)) return;
      setSessions(recovered);
      setActiveId((recovered.find((session) => session.draftId === draftId) ?? recovered[0]).id);
    },
    () => setReady(true)
  );
  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(
        "pdfree-open-documents",
        JSON.stringify({
          ids: sessions.map((session) => metadata[session.id]?.draftId).filter(Boolean),
          activeDraftId: metadata[activeId]?.draftId,
        })
      );
    } catch {
      /* In-memory sessions still work. */
    }
  }, [sessions, metadata, ready, activeId]);
  const open = (session: Session) => {
    setSessions((previous) => [...previous, session]);
    setActiveId(session.id);
  };
  const openFiles = (files: File[]) => {
    const next = files.map((file) => ({ ...blank(), files: [file] }));
    if (!next.length) return;
    setSessions((previous) => [...previous, ...next]);
    setActiveId(next.at(-1)!.id);
  };
  const openDocument = (document: EditorDocument, draftId: string) => {
    const existing = sessions.find(
      (session) => metadata[session.id]?.draftId === draftId || session.draftId === draftId
    );
    if (existing) setActiveId(existing.id);
    else open({ id: newId(), document, draftId });
  };
  const close = async (id: string) => {
    const closing = editors.current.get(id),
      active = editors.current.get(activeId);
    if (!closing || !active) return;
    if (!(await mayClose(closing, active))) return;
    const remaining = sessions.filter((session) => session.id !== id);
    if (!remaining.length) remaining.push(blank());
    setSessions(remaining);
    editors.current.delete(id);
    if (activeId === id) setActiveId(remaining.at(-1)!.id);
  };
  const info = sessions.map((session) => sessionInfo(session, metadata[session.id]));
  return (
    <SessionsView
      sessions={sessions}
      update={update}
      api={{ sessions: info, activeId, openFiles, openDocument, select: setActiveId, close }}
    >
      {children}
    </SessionsView>
  );
}
function mayRestore(editors: Map<string, Editor>) {
  return ![...editors.values()].some((editor) => editor.document.pages.length || editor.task.busy);
}
function editorInfo(id: string, editor: Editor): SessionInfo {
  return {
    id,
    name: editor.document.name,
    unsaved: !!editor.document.pages.length && editor.savedRevision !== editor.history.revision,
    draftId: editor.draftId,
    busy: !!editor.task.busy,
  };
}
function sessionInfo(session: Session, metadata?: SessionInfo): SessionInfo {
  const info = metadata ?? {
    id: session.id,
    name: session.document.name,
    unsaved: false,
    draftId: session.draftId ?? "",
    busy: false,
  };
  return {
    ...info,
    name: session.files?.[0]?.name && info.name === "Untitled" ? session.files[0].name : info.name,
  };
}
function useSessionRecovery(
  accept: (sessions: Session[], activeDraftId: unknown) => void,
  ready: () => void
) {
  const callbacks = useRef({ accept, ready });
  useEffect(() => {
    callbacks.current = { accept, ready };
  }, [accept, ready]);
  useEffect(() => {
    let disposed = false;
    const restore = async () => {
      try {
        const stored: unknown = JSON.parse(
          sessionStorage.getItem("pdfree-open-documents") ?? "null"
        );
        if (stored && typeof stored === "object" && "ids" in stored && Array.isArray(stored.ids)) {
          const drafts = await loadDrafts();
          const recovered = recoveredSessions(stored.ids, drafts);
          if (!disposed && recovered.length) {
            callbacks.current.accept(recovered, storedActiveId(stored));
          }
        }
      } catch {
        /* Library remains available when session storage is blocked. */
      }
      if (!disposed) callbacks.current.ready();
    };
    restore();
    return () => {
      disposed = true;
    };
  }, []);
}
function storedActiveId(stored: object) {
  return "activeDraftId" in stored ? stored.activeDraftId : null;
}
function recoveredSessions(ids: unknown[], drafts: Awaited<ReturnType<typeof loadDrafts>>) {
  return ids.slice(0, 12).flatMap((id) => {
    const draft = drafts.find((draft) => draft.id === id);
    return draft ? [{ id: newId(), document: draft.document, draftId: draft.id }] : [];
  });
}
function mayClose(closing: Editor, active: Editor) {
  if (!closing.document.pages.length || closing.savedRevision === closing.history.revision)
    return Promise.resolve(true);
  return active.confirmation.ask({
    title: `Close ${closing.document.name}?`,
    message:
      "Download an editing project to keep a portable copy. Saved library documents stay in this browser.",
    confirmLabel: "Close document",
    tone: "primary",
  });
}
function SessionsView({
  sessions,
  update,
  api,
  children,
}: {
  sessions: Session[];
  update: (id: string, editor: Editor) => void;
  api: SessionsApi;
  children: ReactNode;
}) {
  return (
    <SessionContext.Provider value={api}>
      {sessions.map((session) => (
        <SessionEditor
          key={session.id}
          session={session}
          active={session.id === api.activeId}
          update={update}
        >
          {children}
        </SessionEditor>
      ))}
    </SessionContext.Provider>
  );
}
function SessionEditor({
  session,
  active,
  update,
  children,
}: {
  session: Session;
  active: boolean;
  update: (id: string, editor: Editor) => void;
  children: ReactNode;
}) {
  const editor = useEditorState(session.document, session.draftId);
  const manager = useContext(SessionContext);
  const started = useRef(false);
  useEffect(() => {
    update(session.id, editor);
  }, [session.id, editor, update]);
  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    if (session.files) editor.importFiles(session.files, true);
  }, [session, editor, active]);
  useEffect(() => {
    if (session.files && !editor.document.pages.length && editor.task.error.includes("canceled"))
      manager?.close(session.id);
  }, [session, editor.document.pages.length, editor.task.error, manager]);
  return (
    <EditorContext.Provider value={editor}>
      <SessionDraft active={active}>{active ? children : null}</SessionDraft>
    </EditorContext.Provider>
  );
}
function SessionDraft({ active, children }: { active: boolean; children: ReactNode }) {
  const draft = useDraftState(active);
  return <DraftContext.Provider value={draft}>{children}</DraftContext.Provider>;
}

import { createContext } from "react";
import { type EditorDocument } from "../core/model";
export type SessionInfo = {
  id: string;
  name: string;
  unsaved: boolean;
  draftId: string;
  busy: boolean;
};
export type DocumentSessions = {
  sessions: SessionInfo[];
  activeId: string;
  openFiles: (files: File[]) => void;
  openDocument: (document: EditorDocument, draftId: string) => void;
  select: (id: string) => void;
  close: (id: string) => void;
};
export const SessionContext = createContext<DocumentSessions | null>(null);

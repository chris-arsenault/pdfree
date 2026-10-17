import { failure } from "../i18n/messages";
import { createContext, useContext } from "react";
import { type useEditorState } from "./useEditorState";
export const EditorContext = createContext<ReturnType<typeof useEditorState> | null>(null);
export function useEditor() {
  const editor = useContext(EditorContext);
  if (!editor) throw failure("errors.editorProvider");
  return editor;
}

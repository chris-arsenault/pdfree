import { createContext, useContext } from "react";
import { type useEditorState } from "./useEditorState";
export const EditorContext = createContext<ReturnType<typeof useEditorState> | null>(null);
export function useEditor() {
  const editor = useContext(EditorContext);
  if (!editor) throw new Error("The editor provider is missing.");
  return editor;
}

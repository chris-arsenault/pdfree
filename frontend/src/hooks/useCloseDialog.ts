import { useCallback } from "react";
import { useEditor } from "./editorContext";
export function useCloseDialog() {
  const { setDialog } = useEditor();
  return useCallback(() => setDialog(""), [setDialog]);
}

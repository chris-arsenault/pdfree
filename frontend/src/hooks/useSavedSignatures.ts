import { useMessageState } from "../i18n/react";
import { message } from "../i18n/messages";
import { useEffect, useState } from "react";
import { useEditor } from "./editorContext";
import { savedSignatures, removeSignature, type SavedSignature } from "../services/signatures";

export function useSavedSignatures() {
  const editor = useEditor();
  const [saved, setSaved] = useState<SavedSignature[]>([]),
    [error, setError] = useMessageState();
  useEffect(() => {
    let cancelled = false;
    savedSignatures()
      .then((items) => {
        if (!cancelled) setSaved(items);
      })
      .catch(() => {
        if (!cancelled) setError(message("library.signaturesUnavailable"));
      });
    return () => {
      cancelled = true;
    };
  }, [setError]);
  const use = (signature: SavedSignature) => {
    if (!editor.page) return;
    if (
      signature.asset &&
      !editor.document.assets.some((asset) => asset.id === signature.asset?.id)
    )
      editor.commit({ ...editor.document, assets: [...editor.document.assets, signature.asset] });
    editor.setPendingObject(signature.object);
    editor.setTool(signature.object.kind === "image" ? "image" : "text");
    editor.setDialog("");
  };
  const remove = (id: string) =>
    editor.task.run(message("task.removingSignature"), async () => {
      await removeSignature(id);
      setSaved(await savedSignatures());
    });
  return { saved, error, use, remove };
}

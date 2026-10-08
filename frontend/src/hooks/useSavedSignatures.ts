import { useEffect, useState } from "react";
import { useEditor } from "./editorContext";
import { savedSignatures, removeSignature, type SavedSignature } from "../services/signatures";

export function useSavedSignatures() {
  const editor = useEditor();
  const [saved, setSaved] = useState<SavedSignature[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    savedSignatures()
      .then((items) => {
        if (!cancelled) setSaved(items);
      })
      .catch(() => {
        if (!cancelled) setError("Saved signatures are unavailable in this browser.");
      });
    return () => {
      cancelled = true;
    };
  }, []);
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
    editor.task.run("Removing signature", async () => {
      await removeSignature(id);
      setSaved(await savedSignatures());
    });
  return { saved, error, use, remove };
}

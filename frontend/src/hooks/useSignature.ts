import { useEffect, useRef, useState } from "react";
import { useEditor } from "./editorContext";
import { newId, type Asset } from "../core/model";
import {
  makeSignature,
  rememberSignature,
  savedSignatures,
  removeSignature,
  type SavedSignature,
} from "../services/signatures";
export function useSignature() {
  const editor = useEditor(),
    [mode, setMode] = useState("draw"),
    [text, setText] = useState("");
  const [remember, setRemember] = useState(false),
    [image, setImage] = useState<Asset | null>(null);
  const [saved, setSaved] = useState<SavedSignature[]>([]),
    canvasRef = useRef<HTMLCanvasElement>(null);
  const notify = editor.task.notify;
  useEffect(() => {
    savedSignatures()
      .then(setSaved)
      .catch(() => notify("Saved signatures are unavailable in this browser."));
  }, [notify]);
  const use = (signature: SavedSignature) => {
    if (
      signature.asset &&
      !editor.document.assets.some((asset) => asset.id === signature.asset?.id)
    )
      editor.commit({ ...editor.document, assets: [...editor.document.assets, signature.asset] });
    editor.setPendingObject(signature.object);
    editor.setTool(signature.object.kind === "image" ? "image" : "text");
    editor.setDialog("");
  };
  const create = () =>
    editor.task.run("Preparing signature", async () => {
      const { object, asset } = await makeSignature(mode, text, canvasRef.current, image);
      const signature = {
        id: newId(),
        label: text || (editor.dialog === "initials" ? "Initials" : "Signature"),
        object,
        asset,
      };
      if (remember) await rememberSignature(signature);
      use(signature);
    });
  const remove = (id: string) =>
    editor.task.run("Removing signature", async () => {
      await removeSignature(id);
      setSaved(await savedSignatures());
    });
  const readImage = (file: File) =>
    editor.task.run("Reading signature image", async () =>
      setImage({
        id: newId(),
        name: file.name,
        data: new Uint8Array(await file.arrayBuffer()),
        mime: file.type,
      })
    );
  return {
    mode,
    setMode,
    text,
    setText,
    remember,
    setRemember,
    image,
    saved,
    canvasRef,
    create,
    use,
    remove,
    readImage,
  };
}

import { useRef, useState } from "react";
import { useEditor } from "./editorContext";
import { newId, type Asset } from "../core/model";
import { makeSignature, rememberSignature } from "../services/signatures";
import { useSavedSignatures } from "./useSavedSignatures";
export function useSignature() {
  const editor = useEditor(),
    [mode, setMode] = useState("draw"),
    [text, setText] = useState("");
  const [remember, setRemember] = useState(false),
    [image, setImage] = useState<Asset | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null),
    collection = useSavedSignatures();
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
      collection.use(signature);
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
    ...collection,
    canvasRef,
    create,
    readImage,
  };
}

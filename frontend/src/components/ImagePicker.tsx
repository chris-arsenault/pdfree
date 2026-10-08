import { newId } from "../core/model";
import { useEditor } from "../hooks/editorContext";
import { ImagePlus } from "lucide-react";
import { FileButton } from "./ui/FileButton";
export function ImagePicker() {
  const editor = useEditor();
  return (
    <FileButton
      label="Choose image"
      icon={ImagePlus}
      multiple={false}
      disabled={!!editor.task.busy}
      accept="image/png,image/jpeg"
      onFiles={(files) => {
        const file = files[0];
        if (!file) return;
        editor.task.run("Opening image", async () => {
          const bitmap = await createImageBitmap(file);
          const asset = {
            id: newId(),
            name: file.name,
            data: new Uint8Array(await file.arrayBuffer()),
            mime: file.type,
          };
          editor.commit({ ...editor.document, assets: [...editor.document.assets, asset] });
          editor.setPendingObject({
            kind: "image",
            assetId: asset.id,
            width: 180,
            height: (180 * bitmap.height) / bitmap.width,
          });
          bitmap.close();
          if (window.matchMedia("(max-width: 760px)").matches) editor.setPropertiesOpen(false);
        });
      }}
    />
  );
}

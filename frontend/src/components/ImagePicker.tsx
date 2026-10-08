import { newId } from "../core/model";
import { useEditor } from "../hooks/editorContext";
export function ImagePicker() {
  const editor = useEditor();
  return (
    <label className="button secondary">
      Choose image
      <input
        className="visually-hidden"
        type="file"
        accept="image/png,image/jpeg"
        onChange={(event) => {
          const file = event.target.files?.[0];
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
          });
        }}
      />
    </label>
  );
}

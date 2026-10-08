import { useEditor } from "./editorContext";
import { createSplitArchive } from "../services/split";
import { runPdfWorker } from "../services/workerClient";
import { outputName } from "../core/pageRanges";
import { download, fontData } from "../services/resources";
export function useSplitExport(groups: number[][], name: string, flatten: boolean) {
  const editor = useEditor();
  const save = () =>
    editor.task.run("Creating split PDFs", async () => {
      download(
        await createSplitArchive(editor.document, groups, name, flatten),
        `${name || "document"}-split.zip`,
        "application/zip"
      );
      editor.setDialog("");
    });
  const saveOne = (index: number) =>
    editor.task.run("Creating split PDF", async () => {
      const pageIds = groups[index].map((number) => editor.document.pages[number - 1].id);
      const bytes = await runPdfWorker<Uint8Array>({
        kind: "export",
        document: editor.document,
        pageIds,
        flatten,
        fonts: await fontData(),
      });
      download(bytes, outputName(name, index), "application/pdf");
    });
  return { save, saveOne };
}

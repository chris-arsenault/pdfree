import { useEditor } from "./editorContext";
import { runPdfWorker } from "../services/workerClient";
import { download } from "../services/resources";
import { filePicker, saveDirect } from "../services/fileSave";
import { pageImages } from "../services/pageImages";
import { printPdf } from "../services/print";
import { type SecuritySettings } from "../core/securitySettings";
import { useExportPdf } from "./useExportPdf";
import { hasEncryptedSources } from "../core/model";
export function useExport(
  name: string,
  selected: boolean,
  flatten: boolean,
  security: SecuritySettings
) {
  const editor = useEditor(),
    pageIds = selected ? editor.selectedPageIds : [];
  const pdfBytes = useExportPdf(pageIds, flatten, security);
  const saveProject = () =>
    editor.task.run("Saving editing project", async () => {
      if (
        hasEncryptedSources(editor.document) &&
        !(await editor.confirmation.ask({
          title: "Download an unprotected project?",
          message:
            "This editing project includes decrypted document content without password protection. Keep the downloaded file private.",
          confirmLabel: "Download project",
          tone: "primary",
        }))
      )
        return;
      download(
        await runPdfWorker<Uint8Array>({ kind: "project-save", document: editor.document }),
        `${name.replace(/\.(pdf|pdfree)$/i, "")}.pdfree`,
        "application/octet-stream"
      );
      editor.setSavedRevision(editor.history.revision);
      editor.setDialog("");
    });
  const direct = () =>
    editor.task.run("Saving PDF directly", async () => {
      if (!filePicker) return;
      const handle = await filePicker({
        suggestedName: name,
        types: [{ description: "PDF document", accept: { "application/pdf": [".pdf"] } }],
      });
      await saveDirect(handle, await pdfBytes());
      if (!selected) editor.setSavedRevision(editor.history.revision);
      editor.setDialog("");
    });
  const images = () =>
    editor.task.run("Exporting page images", async () => {
      download(
        await pageImages(editor.document, pageIds),
        `${name.replace(/\.pdf$/i, "")}-images.zip`,
        "application/zip"
      );
    });
  const exportFile = (print = false) =>
    editor.task.run(print ? "Preparing print" : "Exporting PDF", async () => {
      const bytes = await pdfBytes(!print);
      if (print) printPdf(bytes);
      else
        download(
          bytes,
          name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`,
          "application/pdf"
        );
      if (!selected && !print) editor.setSavedRevision(editor.history.revision);
      editor.setDialog("");
    });
  return { saveProject, direct, images, exportFile };
}

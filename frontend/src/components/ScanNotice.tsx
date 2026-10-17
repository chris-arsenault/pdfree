import { text as tr } from "../i18n/runtime";
import { useState } from "react";
import { Eye, EyeOff, ScanLine, ScanText, X } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { usePageContents } from "../hooks/usePageContents";
import { recognitionSummary } from "../core/recognitionModel";

/**
 * Page-level scan status above the page: offers OCR and cleanup on an
 * unrecognized scan, and reports recognition with a word-outline toggle.
 */
export function ScanNotice() {
  const editor = useEditor(),
    page = editor.page;
  const { contents } = usePageContents(page ? [page.id] : []);
  const [dismissed, setDismissed] = useState(false);
  if (!page) return null;
  if (page.recognition) {
    const summary = recognitionSummary(page.recognition);
    return (
      <div className="scan-notice recognized" role="status">
        <ScanText size={16} aria-hidden="true" />
        <span>
          {summary.words
            ? tr("ocr.summary", {
                words: tr("ocr.words", { count: summary.words }),
                percent: summary.confidence,
              })
            : tr("scan.noWords")}
        </span>
        <button
          className="text-button"
          aria-pressed={editor.showRecognition}
          onClick={() => editor.setShowRecognition(!editor.showRecognition)}
        >
          {editor.showRecognition ? <EyeOff size={15} /> : <Eye size={15} />}
          {editor.showRecognition ? tr("scan.hideWords") : tr("scan.showWords")}
        </button>
        <button className="text-button" onClick={() => editor.setDialog("ocr")}>
          {tr("scan.details")}
        </button>
      </div>
    );
  }
  if (dismissed || contents.get(page.id) !== "scan") return null;
  return (
    <div className="scan-notice" role="status">
      <ScanLine size={16} aria-hidden="true" />
      <span>{tr("scan.notice")}</span>
      <button className="text-button" onClick={() => editor.setDialog("ocr")}>
        {tr("scan.recognize")}
      </button>
      <button className="text-button" onClick={() => editor.setDialog("cleanup")}>
        {tr("scan.cleanup")}
      </button>
      <button
        className="icon-button"
        aria-label={tr("scan.dismiss")}
        onClick={() => setDismissed(true)}
      >
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

import { useState } from "react";
import { Eye, EyeOff, ScanLine, ScanText, X } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { usePageContents } from "../hooks/usePageContents";
import { recognitionSummary } from "../core/recognition";

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
            ? `Text recognized · ${summary.words} words · ${summary.confidence}% confident`
            : "Text recognition found no words on this page"}
        </span>
        <button
          className="text-button"
          aria-pressed={editor.showRecognition}
          onClick={() => editor.setShowRecognition(!editor.showRecognition)}
        >
          {editor.showRecognition ? <EyeOff size={15} /> : <Eye size={15} />}
          {editor.showRecognition ? "Hide words" : "Show words"}
        </button>
        <button className="text-button" onClick={() => editor.setDialog("ocr")}>
          Details
        </button>
      </div>
    );
  }
  if (dismissed || contents.get(page.id) !== "scan") return null;
  return (
    <div className="scan-notice" role="status">
      <ScanLine size={16} aria-hidden="true" />
      <span>This page is a scanned image; its text cannot be searched or selected yet.</span>
      <button className="text-button" onClick={() => editor.setDialog("ocr")}>
        Recognize text
      </button>
      <button className="text-button" onClick={() => editor.setDialog("cleanup")}>
        Clean up scan
      </button>
      <button
        className="icon-button"
        aria-label="Dismiss scan notice"
        onClick={() => setDismissed(true)}
      >
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

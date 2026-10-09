import { useState } from "react";
import { Copy, Eye, Trash2 } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { type EditorDocument, type Page, type Recognition } from "../core/model";
import {
  recognitionSummary,
  recognizedLines,
  recognizedText,
  uncertainConfidence,
} from "../core/recognition";
import { recognizable, type PageContent } from "../services/pageContent";
import { type RecognitionOutcome } from "../services/ocr";

export type OcrRow = {
  page: Page;
  number: number;
  content: PageContent | undefined;
  recognition: Recognition | null;
  /** Recognized by the run that just finished in this dialog. */
  fresh: boolean;
};
export function ocrRows(
  document: EditorDocument,
  ids: string[],
  contents: ReadonlyMap<string, PageContent>,
  outcomes: RecognitionOutcome[]
): OcrRow[] {
  return document.pages.flatMap((page, index) =>
    ids.includes(page.id)
      ? [
          {
            page,
            number: index + 1,
            content: contents.get(page.id),
            recognition: page.recognition ?? null,
            fresh: outcomes.some(
              (outcome) => outcome.pageId === page.id && outcome.status === "recognized"
            ),
          },
        ]
      : []
  );
}

export function OcrResults({
  rows,
  recognizeMore,
  close,
}: {
  rows: OcrRow[];
  recognizeMore: () => void;
  close: () => void;
}) {
  const recognized = rows.filter((row) => row.recognition);
  const [selectedId, setSelectedId] = useState(
    () => (recognized.find((row) => row.recognition!.words.length) ?? recognized[0])?.page.id ?? ""
  );
  const selected = recognized.find((row) => row.page.id === selectedId) ?? recognized[0];
  const actions = useResultActions(recognized, selected, close);
  return (
    <>
      <ResultsHeadline rows={rows} recognizeMore={recognizeMore} />
      {recognized.length > 0 && (
        <div className="ocr-results">
          <ul className="ocr-pages" aria-label="Recognized pages">
            {recognized.map((row) => (
              <ResultRow
                key={row.page.id}
                row={row}
                selected={row === selected}
                select={() => setSelectedId(row.page.id)}
              />
            ))}
          </ul>
          {selected && <RecognizedText row={selected} />}
        </div>
      )}
      {actions.notice && (
        <p className="field-note" role="status">
          {actions.notice}
        </p>
      )}
      <div className="modal-actions ocr-actions">
        {recognized.length > 0 && (
          <>
            <button className="button secondary" onClick={actions.remove}>
              <Trash2 size={16} aria-hidden="true" /> Remove text
            </button>
            <button className="button secondary" onClick={actions.copy}>
              <Copy size={16} aria-hidden="true" /> Copy text
            </button>
            <button className="button secondary" onClick={actions.show}>
              <Eye size={16} aria-hidden="true" /> Show on page
            </button>
          </>
        )}
        <button className="button primary" onClick={close}>
          Done
        </button>
      </div>
    </>
  );
}

function useResultActions(recognized: OcrRow[], selected: OcrRow | undefined, close: () => void) {
  const editor = useEditor();
  const [notice, setNotice] = useState("");
  const copy = () => {
    const text = recognized
      .map((row) => `Page ${row.number}\n${recognizedText(row.recognition!)}`)
      .join("\n\n");
    navigator.clipboard
      .writeText(text)
      .then(() => setNotice(`Copied text from ${recognized.length} page(s).`))
      .catch(() => setNotice("This browser blocked copying. Select the text above instead."));
  };
  const show = () => {
    editor.setShowRecognition(true);
    if (selected) editor.setActiveId(selected.page.id);
    close();
  };
  const remove = () => {
    const ids = new Set(recognized.map((row) => row.page.id));
    editor.commit({
      ...editor.document,
      pages: editor.document.pages.map((page) =>
        ids.has(page.id) ? { ...page, recognition: null } : page
      ),
    });
    setNotice(`Removed recognized text from ${ids.size} page(s). Undo restores it.`);
  };
  return { notice, copy, show, remove };
}

function ResultsHeadline({ rows, recognizeMore }: { rows: OcrRow[]; recognizeMore: () => void }) {
  const recognized = rows.filter((row) => row.recognition);
  const words = recognized.reduce((sum, row) => sum + row.recognition!.words.length, 0);
  const fresh = rows.filter((row) => row.fresh).length;
  const empty = recognized.filter((row) => !row.recognition!.words.length);
  const pending = rows.filter(
    (row) => row.content && recognizable(row.content) && !row.recognition
  ).length;
  return (
    <div className="ocr-headline" role="status">
      {recognized.length ? (
        <p>
          <strong>
            {words.toLocaleString()} word(s) found on {recognized.length} page(s).
          </strong>{" "}
          {fresh > 0 && `${fresh} page(s) recognized just now. `}
          Text is searchable and selectable, and is saved in exported PDFs.
        </p>
      ) : (
        <p>No page in this selection has recognized text yet.</p>
      )}
      {empty.length > 0 && (
        <p className="inline-warning">
          No text found on page {empty.map((row) => row.number).join(", ")}. The scan may be blank,
          a photograph, or too faint; Clean up scan can darken faint text before recognizing again.
        </p>
      )}
      {pending > 0 && (
        <p className="ocr-pending">
          {pending} scanned page(s) not recognized yet.
          <button className="button secondary" onClick={recognizeMore}>
            Recognize…
          </button>
        </p>
      )}
    </div>
  );
}

function ResultRow({
  row,
  selected,
  select,
}: {
  row: OcrRow;
  selected: boolean;
  select: () => void;
}) {
  const summary = recognitionSummary(row.recognition!);
  let quality = "poor";
  if (summary.confidence >= 85) quality = "good";
  else if (summary.confidence >= uncertainConfidence) quality = "fair";
  return (
    <li>
      <button aria-pressed={selected} onClick={select}>
        <span className="ocr-page">Page {row.number}</span>
        {summary.words ? (
          <>
            <span>{summary.words} words</span>
            <span className={`confidence ${quality}`}>{summary.confidence}% confident</span>
            {summary.uncertain > 0 && (
              <span className="uncertain">{summary.uncertain} to check</span>
            )}
          </>
        ) : (
          <span className="confidence poor">No text found</span>
        )}
        {row.fresh && <span className="fresh">New</span>}
      </button>
    </li>
  );
}

/** Recognized lines for one page; low-confidence words are marked for review. */
function RecognizedText({ row }: { row: OcrRow }) {
  const lines = recognizedLines(row.recognition!);
  return (
    <section className="ocr-text" aria-label={`Recognized text on page ${row.number}`}>
      {lines.length ? (
        lines.map((line, index) => (
          <p key={index}>
            {line.map((word, position) =>
              word.confidence < uncertainConfidence ? (
                <mark key={position} title={`${Math.round(word.confidence)}% confident`}>
                  {word.text}{" "}
                </mark>
              ) : (
                `${word.text} `
              )
            )}
          </p>
        ))
      ) : (
        <p className="field-note">Recognition found no words on this page.</p>
      )}
    </section>
  );
}

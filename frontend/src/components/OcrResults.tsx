import { useMessageState } from "../i18n/react";
import { message } from "../i18n/messages";
import { formatList, formatNumber } from "../i18n/format";
import { text as tr } from "../i18n/runtime";
import { useState } from "react";
import { Copy, Eye, Trash2 } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { type EditorDocument, type Page, type Recognition } from "../core/model";
import {
  recognitionSummary,
  recognizedLines,
  recognizedText,
  uncertainConfidence,
} from "../core/recognitionModel";
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
          <ul className="ocr-pages" aria-label={tr("ocr.pages")}>
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
              <Trash2 size={16} aria-hidden="true" /> {tr("ocr.remove")}
            </button>
            <button className="button secondary" onClick={actions.copy}>
              <Copy size={16} aria-hidden="true" /> {tr("ocr.copy")}
            </button>
            <button className="button secondary" onClick={actions.show}>
              <Eye size={16} aria-hidden="true" /> {tr("ocr.show")}
            </button>
          </>
        )}
        <button className="button primary" onClick={close}>
          {tr("common.done")}
        </button>
      </div>
    </>
  );
}

function useResultActions(recognized: OcrRow[], selected: OcrRow | undefined, close: () => void) {
  const editor = useEditor();
  const [notice, setNotice] = useMessageState();
  const copy = () => {
    const text = recognized
      .map(
        (row) =>
          `${tr("common.pageNumber", { number: row.number })}\n${recognizedText(row.recognition!)}`
      )
      .join("\n\n");
    navigator.clipboard
      .writeText(text)
      .then(() => setNotice(message("ocr.copied", { count: recognized.length })))
      .catch(() => setNotice(message("ocr.copyBlocked")));
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
    setNotice(message("ocr.removed", { count: ids.size }));
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
            {tr("ocr.wordTotal", {
              words: tr("ocr.words", { count: words }),
              count: recognized.length,
            })}
          </strong>{" "}
          {fresh > 0 && tr("ocr.fresh", { count: fresh })} {tr("ocr.savedHint")}
        </p>
      ) : (
        <p>{tr("ocr.noneYet")}</p>
      )}
      {empty.length > 0 && (
        <p className="inline-warning">
          {tr("ocr.emptyPages", {
            pages: formatList(empty.map((row) => formatNumber(row.number))),
          })}
        </p>
      )}
      {pending > 0 && (
        <p className="ocr-pending">
          {tr("ocr.pending", { count: pending })}
          <button className="button secondary" onClick={recognizeMore}>
            {tr("ocr.more")}
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
        <span className="ocr-page">{tr("common.pageNumber", { number: row.number })}</span>
        {summary.words ? (
          <>
            <span>{tr("ocr.words", { count: summary.words })}</span>
            <span className={`confidence ${quality}`}>
              {tr("ocr.confidence", { percent: summary.confidence })}
            </span>
            {summary.uncertain > 0 && (
              <span className="uncertain">
                {tr("ocr.checkWords", { count: summary.uncertain })}
              </span>
            )}
          </>
        ) : (
          <span className="confidence poor">{tr("ocr.noText")}</span>
        )}
        {row.fresh && <span className="fresh">{tr("common.new")}</span>}
      </button>
    </li>
  );
}

/** Recognized lines for one page; low-confidence words are marked for review. */
function RecognizedText({ row }: { row: OcrRow }) {
  const lines = recognizedLines(row.recognition!);
  return (
    <section className="ocr-text" aria-label={tr("ocr.pageText", { number: row.number })}>
      {lines.length ? (
        lines.map((line, index) => (
          <p key={index}>
            {line.map((word, position) =>
              word.confidence < uncertainConfidence ? (
                <mark
                  key={position}
                  title={tr("ocr.confidence", { percent: Math.round(word.confidence) })}
                >
                  {word.text}{" "}
                </mark>
              ) : (
                `${word.text} `
              )
            )}
          </p>
        ))
      ) : (
        <p className="field-note">{tr("ocr.emptyPage")}</p>
      )}
    </section>
  );
}

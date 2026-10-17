import { text as tr } from "../i18n/runtime";
import { useState, useMemo } from "react";
import { useEditor } from "../hooks/editorContext";
import { splitGroups, outputName, type SplitMode } from "../core/pageRanges";
import { useSplitExport } from "../hooks/useSplitExport";

/** Export format body for splitting the document into several PDFs. */
export function SplitExport({ prefix, flatten }: { prefix: string; flatten: boolean }) {
  const editor = useEditor(),
    [mode, setMode] = useState<SplitMode>("after"),
    [input, setInput] = useState("1");
  const name = prefix.replace(/\.pdf$/i, "");
  const { groups, error } = useMemo(() => {
    try {
      return { groups: splitGroups(mode, input, editor.document.pages.length), error: "" };
    } catch (cause) {
      return { groups: [] as number[][], error: String((cause as Error).message) };
    }
  }, [mode, input, editor.document.pages.length]);
  const exports = useSplitExport(groups, name, flatten);
  return (
    <>
      <p className="field-note">{tr("split.description")}</p>
      <label>
        {tr("split.method")}
        <select value={mode} onChange={(event) => setMode(event.target.value as SplitMode)}>
          <option value="after">{tr("split.after")}</option>
          <option value="every">{tr("split.every")}</option>
          <option value="individual">{tr("split.individual")}</option>
          <option value="ranges">{tr("split.ranges")}</option>
        </select>
      </label>
      {mode !== "individual" && (
        <label>
          {mode === "ranges" ? tr("split.rangeInput") : tr("split.sizeInput")}
          <input value={input} onChange={(event) => setInput(event.target.value)} />
        </label>
      )}
      <SplitPreview groups={groups} name={name} error={error} exports={exports} />
      <div className="modal-actions">
        <button
          className="button primary"
          onClick={exports.save}
          disabled={!!error || !!editor.task.busy}
        >
          {tr("split.downloadZip", { count: groups.length })}
        </button>
      </div>
    </>
  );
}
function SplitPreview({
  groups,
  name,
  error,
  exports,
}: {
  groups: number[][];
  name: string;
  error: string;
  exports: ReturnType<typeof useSplitExport>;
}) {
  const editor = useEditor();
  const included = new Set(groups.flat());
  const omitted = editor.document.pages
    .map((_, index) => index + 1)
    .filter((number) => !included.has(number));
  if (error)
    return (
      <div role="alert" className="inline-warning">
        {error}
      </div>
    );
  return (
    <>
      {omitted.length > 0 && (
        <p className="inline-warning">{tr("export.omitted", { pages: omitted.join(", ") })}</p>
      )}
      <ol className="split-preview">
        {groups.map((group, index) => (
          <li key={outputName(name, index)}>
            <strong>{outputName(name, index)}</strong>
            <span>{tr("split.pageList", { pages: group.join(", ") })}</span>
            <button
              disabled={!!editor.task.busy}
              onClick={() => exports.saveOne(index)}
              aria-label={tr("common.downloadNamed", { name: outputName(name, index) })}
            >
              {tr("export.downloadPdf")}
            </button>
          </li>
        ))}
      </ol>
    </>
  );
}

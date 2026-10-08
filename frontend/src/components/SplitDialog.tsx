import { useState, useMemo } from "react";
import { useCloseDialog } from "../hooks/useCloseDialog";
import { useEditor } from "../hooks/editorContext";
import { splitGroups, outputName, type SplitMode } from "../core/pageRanges";
import { useSplitExport } from "../hooks/useSplitExport";
import { Modal } from "./Modal";

export function SplitDialog() {
  const editor = useEditor(),
    [mode, setMode] = useState<SplitMode>("after"),
    [input, setInput] = useState("1");
  const [name, setName] = useState(editor.document.name.replace(/\.pdf$/i, "")),
    [flatten, setFlatten] = useState(false);
  const close = useCloseDialog();
  const { groups, error } = useMemo(() => {
    try {
      return { groups: splitGroups(mode, input, editor.document.pages.length), error: "" };
    } catch (cause) {
      return { groups: [] as number[][], error: String((cause as Error).message) };
    }
  }, [mode, input, editor.document.pages.length]);
  const exports = useSplitExport(groups, name, flatten);
  return (
    <Modal title="Split into PDFs" onClose={close}>
      <p className="modal-description">
        Use physical page numbers from the sidebar. Your current fields and edits are included in
        every output.
      </p>
      <label>
        Split method
        <select value={mode} onChange={(event) => setMode(event.target.value as SplitMode)}>
          <option value="after">After page numbers</option>
          <option value="every">Every N pages</option>
          <option value="individual">One PDF per page</option>
          <option value="ranges">Explicit output ranges</option>
        </select>
      </label>
      {mode !== "individual" && (
        <label>
          {mode === "ranges"
            ? "Ranges separated by semicolons (1-3; 5-end)"
            : "Page numbers / group size"}
          <input value={input} onChange={(event) => setInput(event.target.value)} />
        </label>
      )}
      <label>
        Output name prefix
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={flatten}
          onChange={(event) => setFlatten(event.target.checked)}
        />{" "}
        Flatten form fields
      </label>
      <SplitPreview groups={groups} name={name} error={error} exports={exports} />
      <div className="modal-actions">
        <button
          className="button primary"
          onClick={exports.save}
          disabled={!!error || !!editor.task.busy}
        >
          Download {groups.length} PDFs as ZIP
        </button>
      </div>
    </Modal>
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
        <p className="inline-warning">Pages omitted from these outputs: {omitted.join(", ")}</p>
      )}
      <ol className="split-preview">
        {groups.map((group, index) => (
          <li key={outputName(name, index)}>
            <strong>{outputName(name, index)}</strong>
            <span>Pages {group.join(", ")}</span>
            <button
              disabled={!!editor.task.busy}
              onClick={() => exports.saveOne(index)}
              aria-label={`Download ${outputName(name, index)}`}
            >
              Download PDF
            </button>
          </li>
        ))}
      </ol>
    </>
  );
}

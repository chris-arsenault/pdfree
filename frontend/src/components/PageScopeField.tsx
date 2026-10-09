import { useId } from "react";
import { useEditor } from "../hooks/editorContext";
import { type PageScope, type PageScopeKind } from "../core/pageScope";

export function PageScopeField({
  scope,
  onChange,
  pageIds,
  error,
  disabled = false,
  legend = "Pages",
}: {
  scope: PageScope;
  onChange: (scope: PageScope) => void;
  pageIds: string[];
  error: string;
  disabled?: boolean;
  legend?: string;
}) {
  const editor = useEditor(),
    name = useId(),
    noteId = useId();
  const pages = editor.document.pages;
  const selected = pages.filter((page) => editor.pageIds.includes(page.id)).length;
  const current = pages.findIndex((page) => page.id === editor.page?.id) + 1;
  const choices: { kind: PageScopeKind; label: string; detail: string }[] = [
    { kind: "all", label: "All pages", detail: `${pages.length}` },
    { kind: "current", label: "Current page", detail: `page ${current}` },
    { kind: "selected", label: "Selected pages", detail: selected ? `${selected}` : "none" },
    { kind: "range", label: "Page range", detail: "" },
  ];
  return (
    <fieldset className="page-scope-field" disabled={disabled} aria-describedby={noteId}>
      <legend>{legend}</legend>
      <div className="scope-choices">
        {choices.map((choice) => (
          <label key={choice.kind} className="scope-choice">
            <input
              type="radio"
              name={name}
              checked={scope.kind === choice.kind}
              disabled={choice.kind === "selected" && !selected}
              onChange={() => onChange({ ...scope, kind: choice.kind })}
            />
            {choice.label}
            {choice.detail && (
              <span className="scope-count" aria-hidden="true">
                {choice.detail}
              </span>
            )}
          </label>
        ))}
      </div>
      {scope.kind === "range" && (
        <input
          placeholder="1-3, 5, 7-end"
          aria-label="Pages to include"
          aria-invalid={!!error}
          value={scope.range}
          onChange={(event) => onChange({ ...scope, range: event.target.value })}
        />
      )}
      <p id={noteId} className={error ? "field-note scope-error" : "field-note"} aria-live="polite">
        {error || `${pageIds.length} of ${pages.length} page(s)`}
      </p>
    </fieldset>
  );
}

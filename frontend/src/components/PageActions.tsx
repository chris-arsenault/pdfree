import { useState } from "react";
import { RotateCw, Copy, Trash2, Scissors, Files, Download } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { rotatePages, duplicatePages, removePages } from "../core/pageOperations";
import { parsePageRange } from "../core/pageRanges";

export function PageActions() {
  const editor = useEditor();
  const remove = () =>
    editor.task.run("Deleting selected pages", () => {
      if (
        !window.confirm(
          `Delete ${editor.selectedPageIds.length} selected page(s)? You can undo this.`
        )
      )
        return;
      editor.commit(removePages(editor.document, editor.selectedPageIds));
      editor.setPageIds([]);
      editor.setObjectIds([]);
    });
  return (
    <div className="page-actions" role="toolbar" aria-label="Page operations">
      <PageSelection />
      <button onClick={() => editor.commit(rotatePages(editor.document, editor.selectedPageIds))}>
        <RotateCw size={14} /> Rotate
      </button>
      <button
        onClick={() => editor.commit(duplicatePages(editor.document, editor.selectedPageIds))}
      >
        <Copy size={14} /> Duplicate
      </button>
      <button onClick={remove}>
        <Trash2 size={14} /> Delete pages
      </button>
      <label className="file-button">
        <Files size={14} /> Merge / insert
        <input
          type="file"
          accept="application/pdf,.pdf"
          multiple
          disabled={!!editor.task.busy}
          onChange={(event) => {
            editor.importFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </label>
      <button onClick={() => editor.setDialog("split")}>
        <Scissors size={14} /> Split
      </button>
      <label className="file-button">
        Insert pages
        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg,.pdf"
          multiple
          disabled={!!editor.task.busy}
          onChange={(event) => {
            editor.importFiles(Array.from(event.target.files ?? []), false, true);
            event.target.value = "";
          }}
        />
      </label>
      <button
        onClick={() => {
          editor.setExportSelected(true);
          editor.setDialog("export");
        }}
      >
        <Download size={14} /> Extract
      </button>
      <button onClick={() => editor.setDialog("properties")}>Document</button>
    </div>
  );
}
function PageSelection() {
  const editor = useEditor(),
    [range, setRange] = useState("");
  const selectRange = () =>
    editor.task.run("Selecting pages", () =>
      editor.setPageIds(
        parsePageRange(range, editor.document.pages.length).map(
          (number) => editor.document.pages[number - 1].id
        )
      )
    );
  return (
    <>
      <span>{editor.selectedPageIds.length} selected</span>
      <button onClick={() => editor.setPageIds(editor.document.pages.map((page) => page.id))}>
        All
      </button>
      <button onClick={() => editor.setPageIds([])}>Clear</button>
      <label className="range-picker">
        <span className="sr-only">Page range</span>
        <input
          placeholder="1-3, 5"
          value={range}
          onChange={(event) => setRange(event.target.value)}
        />
        <button onClick={selectRange} disabled={!range}>
          Select
        </button>
      </label>
    </>
  );
}

import { useState } from "react";
import {
  RotateCw,
  Copy,
  Trash2,
  Scissors,
  Files,
  Download,
  ListChecks,
  MoreHorizontal,
  FilePlus2,
} from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { rotatePages, duplicatePages, removePages } from "../core/pageOperations";
import { parsePageRange } from "../core/pageRanges";
import { IconButton } from "./ui/IconButton";
import { ActionPopover } from "./ui/ActionPopover";
import { FileButton } from "./ui/FileButton";

export function PageActions() {
  const editor = useEditor();
  const remove = () =>
    editor.task.run("Deleting selected pages", async () => {
      if (
        !(await editor.confirmation.ask({
          title: `Delete ${pageScope(editor)}?`,
          message: "Pages and their edits will be removed from this document. You can undo this.",
          confirmLabel: editor.selectedPageIds.length === 1 ? "Delete page" : "Delete pages",
          tone: "danger",
        }))
      )
        return;
      editor.commit(removePages(editor.document, editor.selectedPageIds));
      editor.setPageIds([]);
      editor.setObjectIds([]);
    });
  return (
    <div className="page-actions" role="toolbar" aria-label="Page operations">
      <div className="page-scope">
        <PageSelection />
      </div>
      <IconButton
        label="Rotate"
        icon={RotateCw}
        detail={`Rotate ${pageScope(editor)} clockwise by 90°.`}
        onClick={() => editor.commit(rotatePages(editor.document, editor.selectedPageIds))}
      />
      <IconButton
        label="Duplicate"
        icon={Copy}
        detail={`Duplicate ${pageScope(editor)}.`}
        onClick={() => editor.commit(duplicatePages(editor.document, editor.selectedPageIds))}
      />
      <IconButton
        label="Delete pages"
        icon={Trash2}
        detail={`Delete ${pageScope(editor)}. You can undo this.`}
        onClick={remove}
      />
      <ActionPopover label="More" icon={MoreHorizontal}>
        {(close) => <PageExtras close={close} />}
      </ActionPopover>
    </div>
  );
}
function PageExtras({ close }: { close: () => void }) {
  const editor = useEditor();
  const merge = (files: File[]) => {
    editor.importFiles(files);
    close();
  };
  const insert = (files: File[]) => {
    editor.importFiles(files, false, true);
    close();
  };
  return (
    <>
      <button
        onClick={() => {
          editor.setExportSelected(true);
          editor.setDialog("export");
          close();
        }}
      >
        <Download size={17} aria-hidden="true" /> Extract
      </button>
      <button
        onClick={() => {
          editor.setDialog("split");
          close();
        }}
      >
        <Scissors size={17} aria-hidden="true" /> Split
      </button>
      <FileButton
        label="Merge PDFs"
        multiple
        icon={Files}
        detail="Append to the end of this document"
        className="file-action"
        accept="application/pdf,.pdf"
        disabled={!!editor.task.busy}
        onFiles={merge}
      />
      <FileButton
        label="Insert pages"
        multiple
        icon={FilePlus2}
        detail="Insert after the current page"
        className="file-action"
        accept="application/pdf,image/png,image/jpeg,.pdf"
        disabled={!!editor.task.busy}
        onFiles={insert}
      />
    </>
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
    <ActionPopover
      label={
        editor.pageIds.length ? `${editor.selectedPageIds.length} selected pages` : "Current page"
      }
      icon={ListChecks}
    >
      {(close) => (
        <>
          <p>
            Actions apply to {pageScope(editor)}. Without a selection, they apply to the current
            page.
          </p>
          <button
            onClick={() => {
              editor.setPageIds(editor.document.pages.map((page) => page.id));
              close();
            }}
          >
            Select all pages
          </button>
          <button
            onClick={() => {
              editor.setPageIds([]);
              close();
            }}
          >
            Use current page
          </button>
          <form
            className="range-picker"
            onSubmit={(event) => {
              event.preventDefault();
              selectRange();
            }}
          >
            <label>
              Page range
              <input
                placeholder="1-3, 5"
                value={range}
                onChange={(event) => setRange(event.target.value)}
              />
            </label>
            <button disabled={!range.trim()}>Select range</button>
          </form>
        </>
      )}
    </ActionPopover>
  );
}

function pageScope(editor: ReturnType<typeof useEditor>) {
  return editor.pageIds.length
    ? `${editor.selectedPageIds.length} selected pages`
    : `page ${editor.document.pages.findIndex((page) => page.id === editor.page?.id) + 1}`;
}

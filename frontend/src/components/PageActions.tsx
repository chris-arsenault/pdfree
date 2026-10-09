import { useState } from "react";
import {
  RotateCw,
  Copy,
  Trash2,
  Scissors,
  Files,
  Download,
  File,
  ListChecks,
  ListOrdered,
  MoreHorizontal,
  FilePlus2,
  ScanLine,
  ScanText,
  type LucideIcon,
} from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { rotatePages, duplicatePages, removePages, insertBlank } from "../core/pageOperations";
import { selectionScope, type PageScope, type PageScopeKind } from "../core/pageScope";
import { resolveScope } from "../hooks/usePageScope";
import { PageScopeField } from "./PageScopeField";
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
      <ActionPopover label="Insert" icon={FilePlus2}>
        {(close) => <InsertChoices close={close} />}
      </ActionPopover>
      <ActionPopover label="More" icon={MoreHorizontal}>
        {(close) => <PageTools close={close} />}
      </ActionPopover>
    </div>
  );
}
function InsertChoices({ close }: { close: () => void }) {
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
          editor.commit(insertBlank(editor.document, editor.page?.id ?? ""));
          close();
        }}
      >
        <File size={17} aria-hidden="true" />
        <span>
          Blank page
          <small aria-hidden="true">After the current page</small>
        </span>
      </button>
      <FileButton
        label="Pages from file"
        multiple
        icon={FilePlus2}
        detail="PDF, PNG or JPG after the current page"
        className="file-action"
        accept="application/pdf,image/png,image/jpeg,.pdf"
        disabled={!!editor.task.busy}
        onFiles={insert}
      />
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
    </>
  );
}
function PageTools({ close }: { close: () => void }) {
  const editor = useEditor();
  const items: { label: string; icon: LucideIcon; open: () => void }[] = [
    { label: "Extract", icon: Download, open: () => editor.openExport("extract") },
    { label: "Split", icon: Scissors, open: () => editor.openExport("split") },
    { label: "Repeat across pages", icon: ListOrdered, open: () => editor.setDialog("repeat") },
    { label: "Clean up scans", icon: ScanLine, open: () => editor.setDialog("cleanup") },
    { label: "Recognize text", icon: ScanText, open: () => editor.setDialog("ocr") },
  ];
  return items.map((item) => (
    <button
      key={item.label}
      onClick={() => {
        item.open();
        close();
        // On phones the Pages drawer is modal; leave the dialog over the document instead.
        if (window.matchMedia("(max-width: 760px)").matches) editor.setPagesOpen(false);
      }}
    >
      <item.icon size={17} aria-hidden="true" /> {item.label}
    </button>
  ));
}
function PageSelection() {
  const editor = useEditor(),
    kind = selectionScope(editor.document, editor.pageIds);
  const labels = {
    all: "All pages",
    selected: `${editor.selectedPageIds.length} selected pages`,
    current: "Current page",
    range: "",
  };
  return (
    <ActionPopover label={labels[kind]} icon={ListChecks}>
      {() => <SelectionScope initial={kind} />}
    </ActionPopover>
  );
}
/** Edits the shared thumbnail selection through the same scope control dialogs use. */
function SelectionScope({ initial }: { initial: PageScopeKind }) {
  const editor = useEditor(),
    [scope, setScope] = useState<PageScope>({ kind: initial, range: "" });
  const resolved = resolveScope(editor, scope);
  const change = (next: PageScope) => {
    setScope(next);
    const { pageIds, error } = resolveScope(editor, next);
    if (next.kind === "all") editor.setPageIds(pageIds);
    else if (next.kind === "current") editor.setPageIds([]);
    else if (next.kind === "range" && !error) editor.setPageIds(pageIds);
  };
  return (
    <>
      <p>Rotate, duplicate, delete and Extract apply to these pages.</p>
      <PageScopeField
        scope={scope}
        onChange={change}
        pageIds={reportedPageIds(scope, resolved.pageIds, editor.selectedPageIds)}
        error={scope.kind === "range" && scope.range.trim() ? resolved.error : ""}
      />
    </>
  );
}
// An unfinished range leaves the previous selection in effect, so report that selection.
const reportedPageIds = (scope: PageScope, resolved: string[], selected: string[]) =>
  scope.kind === "range" && !resolved.length ? selected : resolved;

function pageScope(editor: ReturnType<typeof useEditor>) {
  const kind = selectionScope(editor.document, editor.pageIds);
  if (kind === "all") return "all pages";
  return kind === "selected"
    ? `${editor.selectedPageIds.length} selected pages`
    : `page ${editor.document.pages.findIndex((page) => page.id === editor.page?.id) + 1}`;
}

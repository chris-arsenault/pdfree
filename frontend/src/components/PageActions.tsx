import { renderMessage } from "../i18n/runtime";
import { text as tr } from "../i18n/runtime";
import { message } from "../i18n/messages";
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
    editor.task.run(message("task.deletingPages"), async () => {
      if (
        !(await editor.confirmation.ask({
          title: message("common.deleteQuestion", { name: [pageScope(editor)] }),
          message: message("pages.deleteDescription"),
          confirmLabel:
            editor.selectedPageIds.length === 1
              ? message("pages.delete")
              : message("pages.deleteMany"),
          tone: "danger",
        }))
      )
        return;
      editor.commit(removePages(editor.document, editor.selectedPageIds));
      editor.setPageIds([]);
      editor.setObjectIds([]);
    });
  return (
    <div className="page-actions" role="toolbar" aria-label={tr("pages.operations")}>
      <div className="page-scope">
        <PageSelection />
      </div>
      <IconButton
        label={tr("common.rotate")}
        icon={RotateCw}
        detail={tr("pages.rotateScope", { scope: [pageScope(editor)] })}
        onClick={() => editor.commit(rotatePages(editor.document, editor.selectedPageIds))}
      />
      <IconButton
        label={tr("common.duplicate")}
        icon={Copy}
        detail={tr("pages.duplicateScope", { scope: [pageScope(editor)] })}
        onClick={() => editor.commit(duplicatePages(editor.document, editor.selectedPageIds))}
      />
      <IconButton
        label={tr("pages.deleteMany")}
        icon={Trash2}
        detail={tr("pages.deleteScope", { scope: [pageScope(editor)] })}
        onClick={remove}
      />
      <ActionPopover label={tr("common.insert")} icon={FilePlus2}>
        {(close) => <InsertChoices close={close} />}
      </ActionPopover>
      <ActionPopover label={tr("common.more")} icon={MoreHorizontal}>
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
          {tr("pages.blank")}
          <small aria-hidden="true">{tr("pages.afterCurrent")}</small>
        </span>
      </button>
      <FileButton
        label={tr("pages.fromFile")}
        multiple
        icon={FilePlus2}
        detail={tr("pages.fromFileHint")}
        className="file-action"
        accept="application/pdf,image/png,image/jpeg,.pdf"
        disabled={!!editor.task.busy}
        onFiles={insert}
      />
      <FileButton
        label={tr("pages.merge")}
        multiple
        icon={Files}
        detail={tr("pages.mergeHint")}
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
    { label: tr("common.extract"), icon: Download, open: () => editor.openExport("extract") },
    { label: tr("common.split"), icon: Scissors, open: () => editor.openExport("split") },
    { label: tr("pages.repeat"), icon: ListOrdered, open: () => editor.setDialog("repeat") },
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
    all: tr("scope.all"),
    selected: tr("common.selectedPages", { count: editor.selectedPageIds.length }),
    current: tr("scope.current"),
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
      <p>{tr("scope.actions")}</p>
      <PageScopeField
        scope={scope}
        onChange={change}
        pageIds={reportedPageIds(scope, resolved.pageIds, editor.selectedPageIds)}
        error={
          scope.kind === "range" && scope.range.trim() && resolved.error
            ? renderMessage(resolved.error)
            : ""
        }
      />
    </>
  );
}
// An unfinished range leaves the previous selection in effect, so report that selection.
const reportedPageIds = (scope: PageScope, resolved: string[], selected: string[]) =>
  scope.kind === "range" && !resolved.length ? selected : resolved;

function pageScope(editor: ReturnType<typeof useEditor>) {
  const kind = selectionScope(editor.document, editor.pageIds);
  if (kind === "all") return message("scope.all");
  return kind === "selected"
    ? message("common.selectedPages", { count: editor.selectedPageIds.length })
    : message("common.pageLower", {
        number: editor.document.pages.findIndex((page) => page.id === editor.page?.id) + 1,
      });
}

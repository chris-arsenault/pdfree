import { formatNumber } from "../i18n/format";
import { text as tr } from "../i18n/runtime";
import { ChevronLeft, ChevronRight, Pin } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { IconButton } from "./ui/IconButton";

export function PageNavigation() {
  const editor = useEditor();
  const index = editor.document.pages.findIndex((page) => page.id === editor.page?.id);
  const goToPage = (next: number) => {
    const page = editor.document.pages[next];
    if (page) {
      editor.setActiveId(page.id);
      editor.setObjectIds([]);
    }
  };
  return (
    <div className="page-navigation">
      <IconButton
        label={tr("common.previousPage")}
        icon={ChevronLeft}
        disabled={index === 0}
        detail={index === 0 ? tr("pages.first") : tr("pages.previousHint")}
        onClick={() => goToPage(index - 1)}
      />
      <label className="page-position">
        <span className="sr-only">{tr("common.page")}</span>
        <input
          className="page-jump"
          type="number"
          min="1"
          max={editor.document.pages.length}
          value={index + 1}
          onChange={(event) => goToPage(Number(event.target.value) - 1)}
        />
        <span aria-hidden="true">/ {formatNumber(editor.document.pages.length)}</span>
      </label>
      <span className="sr-only">
        {tr("pages.position", { number: index + 1, total: editor.document.pages.length })}
      </span>
      <IconButton
        label={tr("common.nextPage")}
        icon={ChevronRight}
        disabled={index === editor.document.pages.length - 1}
        detail={
          index === editor.document.pages.length - 1 ? tr("pages.last") : tr("pages.nextHint")
        }
        onClick={() => goToPage(index + 1)}
      />
      <IconButton
        label={tr("pages.pin")}
        icon={Pin}
        data-pin-current
        aria-pressed={editor.pinned.page?.id === editor.page?.id}
        detail={tr("pages.pinHint")}
        onClick={() => editor.page && editor.pinned.pin(editor.page.id)}
      />
    </div>
  );
}

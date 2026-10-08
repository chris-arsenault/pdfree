import { ChevronLeft, ChevronRight } from "lucide-react";
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
        label="Previous page"
        icon={ChevronLeft}
        disabled={index === 0}
        detail={index === 0 ? "This is the first page." : "Go to the previous physical page."}
        onClick={() => goToPage(index - 1)}
      />
      <label className="page-position">
        <span className="sr-only">Page</span>
        <input
          className="page-jump"
          type="number"
          min="1"
          max={editor.document.pages.length}
          value={index + 1}
          onChange={(event) => goToPage(Number(event.target.value) - 1)}
        />
        <span aria-hidden="true">/ {editor.document.pages.length}</span>
      </label>
      <span className="sr-only">
        PAGE {index + 1} OF {editor.document.pages.length}
      </span>
      <IconButton
        label="Next page"
        icon={ChevronRight}
        disabled={index === editor.document.pages.length - 1}
        detail={
          index === editor.document.pages.length - 1
            ? "This is the last page."
            : "Go to the next physical page."
        }
        onClick={() => goToPage(index + 1)}
      />
    </div>
  );
}

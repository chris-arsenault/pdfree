import { text as tr } from "../i18n/runtime";
import { Bookmark, PanelLeft, SlidersHorizontal, MessagesSquare } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { IconButton } from "./ui/IconButton";

type Panel = "pages" | "bookmarks" | "properties" | "comments";
const panels = {
  pages: {
    get label() {
      return tr("common.pagesLabel");
    },
    icon: PanelLeft,
    get detail() {
      return tr("panels.pagesHint");
    },
    controls: "pages-panel",
  },
  bookmarks: {
    get label() {
      return tr("common.bookmarks");
    },
    icon: Bookmark,
    get detail() {
      return tr("panels.bookmarksHint");
    },
    controls: "pages-panel",
  },
  comments: {
    get label() {
      return tr("common.comments");
    },
    icon: MessagesSquare,
    get detail() {
      return tr("panels.commentsHint");
    },
    controls: "comments-panel",
  },
  properties: {
    get label() {
      return tr("common.properties");
    },
    icon: SlidersHorizontal,
    get detail() {
      return tr("panels.propertiesHint");
    },
    controls: "properties-panel",
  },
};

export function PanelToggle({ panel }: { panel: Panel }) {
  const editor = useEditor();
  const left = panel === "pages" || panel === "bookmarks";
  const open = {
    pages: editor.pagesOpen && editor.leftTab === "pages",
    bookmarks: editor.pagesOpen && editor.leftTab === "bookmarks",
    comments: editor.commentsOpen,
    properties: editor.propertiesOpen,
  }[panel];
  const toggle = () => {
    if (left) {
      // Pages and Bookmarks share the left panel; the other button switches its tab.
      editor.setLeftTab(panel);
      editor.setPagesOpen(!open);
    } else if (panel === "comments") {
      editor.setCommentsOpen(!open);
      editor.setPropertiesOpen(false);
    } else {
      editor.setPropertiesOpen(!open);
      editor.setCommentsOpen(false);
    }
  };
  const { label, icon, detail, controls } = panels[panel];
  return (
    <IconButton
      label={label}
      icon={icon}
      detail={detail}
      aria-expanded={open}
      aria-controls={controls}
      onClick={toggle}
    />
  );
}

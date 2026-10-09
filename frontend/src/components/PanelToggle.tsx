import { Bookmark, PanelLeft, SlidersHorizontal, MessagesSquare } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { IconButton } from "./ui/IconButton";

type Panel = "pages" | "bookmarks" | "properties" | "comments";
const panels = {
  pages: {
    label: "Pages",
    icon: PanelLeft,
    detail: "Show thumbnails and page operations.",
    controls: "pages-panel",
  },
  bookmarks: {
    label: "Bookmarks",
    icon: Bookmark,
    detail: "Navigate and edit the document outline.",
    controls: "pages-panel",
  },
  comments: {
    label: "Comments",
    icon: MessagesSquare,
    detail: "Browse document comments and replies.",
    controls: "comments-panel",
  },
  properties: {
    label: "Properties",
    icon: SlidersHorizontal,
    detail: "Show properties for added objects.",
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

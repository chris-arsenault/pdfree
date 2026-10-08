import { PanelLeft, SlidersHorizontal, MessagesSquare } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { IconButton } from "./ui/IconButton";

export function PanelToggle({ panel }: { panel: "pages" | "properties" | "comments" }) {
  const editor = useEditor();
  const pages = panel === "pages";
  const comments = panel === "comments";
  const panels = {
    pages: {
      open: editor.pagesOpen,
      label: "Pages",
      icon: PanelLeft,
      detail: "Show thumbnails and page operations.",
    },
    comments: {
      open: editor.commentsOpen,
      label: "Comments",
      icon: MessagesSquare,
      detail: "Browse document comments and replies.",
    },
    properties: {
      open: editor.propertiesOpen,
      label: "Properties",
      icon: SlidersHorizontal,
      detail: "Show properties for added objects.",
    },
  };
  const { open, label, icon, detail } = panels[panel];
  const toggle = () => {
    if (pages) editor.setPagesOpen(!open);
    else if (comments) {
      editor.setCommentsOpen(!open);
      editor.setPropertiesOpen(false);
    } else {
      editor.setPropertiesOpen(!open);
      editor.setCommentsOpen(false);
    }
  };
  return (
    <IconButton
      label={label}
      icon={icon}
      detail={detail}
      aria-expanded={open}
      aria-controls={`${panel}-panel`}
      onClick={toggle}
    />
  );
}

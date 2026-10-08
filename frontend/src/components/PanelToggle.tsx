import { PanelLeft, SlidersHorizontal } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { IconButton } from "./ui/IconButton";

export function PanelToggle({ panel }: { panel: "pages" | "properties" }) {
  const editor = useEditor();
  const pages = panel === "pages";
  const open = pages ? editor.pagesOpen : editor.propertiesOpen;
  const toggle = () => (pages ? editor.setPagesOpen(!open) : editor.setPropertiesOpen(!open));
  return (
    <IconButton
      label={pages ? "Pages" : "Properties"}
      icon={pages ? PanelLeft : SlidersHorizontal}
      detail={pages ? "Show thumbnails and page operations." : "Show properties for added objects."}
      aria-expanded={open}
      aria-controls={pages ? "pages-panel" : "properties-panel"}
      onClick={toggle}
    />
  );
}

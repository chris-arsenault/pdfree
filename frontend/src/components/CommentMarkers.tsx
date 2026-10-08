import { MessageSquare } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { displayBox, displaySize } from "../core/coordinates";
import { IconButton } from "./ui/IconButton";

export function CommentMarkers() {
  const editor = useEditor(),
    page = editor.page;
  if (!page) return null;
  const size = displaySize(page);
  return (
    <div className="comment-markers">
      {(page.comments ?? [])
        .filter((comment) => !comment.parentId)
        .map((comment) => {
          const point = displayBox({ ...comment, rotation: 0 }, page);
          return (
            <IconButton
              key={comment.id}
              icon={MessageSquare}
              label={`Comment: ${comment.text.trim().slice(0, 80) || "Untitled note"}`}
              detail={comment.author || "Open this comment thread."}
              className={`comment-marker ${editor.commentId === comment.id && editor.commentsOpen ? "active" : ""}`}
              aria-pressed={editor.commentId === comment.id && editor.commentsOpen}
              style={{
                "--x": `${Math.max(0, Math.min(point.x * editor.zoom, size.width * editor.zoom - 36))}px`,
                "--y": `${Math.max(0, Math.min(point.y * editor.zoom, size.height * editor.zoom - 36))}px`,
              }}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => {
                editor.setObjectIds([]);
                editor.setCommentId(comment.id);
                editor.setPendingComment(null);
                editor.setCommentsOpen(true);
              }}
            />
          );
        })}
    </div>
  );
}

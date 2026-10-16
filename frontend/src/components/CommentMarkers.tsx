import { MessageSquare } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { displayBox, displaySize } from "../core/coordinates";
import { IconButton } from "./ui/IconButton";
import { type Page } from "../core/model";

export function CommentMarkers({
  page: requestedPage,
  scale,
  readOnly = false,
}: {
  page?: Page;
  scale?: number;
  readOnly?: boolean;
}) {
  const editor = useEditor(),
    page = requestedPage ?? editor.page;
  const zoom = scale ?? editor.zoom;
  if (!page) return null;
  const size = displaySize(page);
  return (
    <div className="comment-markers">
      {(page.comments ?? [])
        .filter((comment) => !comment.parentId)
        .map((comment) => {
          const point = displayBox({ ...comment, rotation: 0 }, page);
          const x = `${Math.max(0, Math.min(point.x * zoom, size.width * zoom - 36))}px`;
          const y = `${Math.max(0, Math.min(point.y * zoom, size.height * zoom - 36))}px`;
          if (readOnly)
            return (
              <span
                key={comment.id}
                className="comment-marker"
                title={comment.text}
                style={{ "--x": x, "--y": y }}
              >
                <MessageSquare size={18} aria-hidden="true" />
                <span className="sr-only">Comment: {comment.text}</span>
              </span>
            );
          return (
            <IconButton
              key={comment.id}
              icon={MessageSquare}
              label={`Comment: ${comment.text.trim().slice(0, 80) || "Untitled note"}`}
              detail={comment.author || "Open this comment thread."}
              className={`comment-marker ${editor.commentId === comment.id && editor.commentsOpen ? "active" : ""}`}
              aria-pressed={editor.commentId === comment.id && editor.commentsOpen}
              style={{ "--x": x, "--y": y }}
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

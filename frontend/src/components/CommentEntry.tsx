import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { type PdfComment } from "../core/model";
import { editComment, removeComment } from "../core/comments";
import { useEditor } from "../hooks/editorContext";
import { IconButton } from "./ui/IconButton";
import { CommentForm } from "./CommentForm";

function displayDate(value: string) {
  const match = /^D:(\d{4})(\d{2})(\d{2})/.exec(value);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString() : "";
}
export function CommentEntry({ comment, pageId }: { comment: PdfComment; pageId: string }) {
  const editor = useEditor();
  const [editing, setEditing] = useState(false);
  const remove = () =>
    editor.task.run("Deleting comment", async () => {
      const allowed = await editor.confirmation.ask({
        title: comment.parentId ? "Delete this reply?" : "Delete this comment thread?",
        message: comment.parentId
          ? "This reply and any replies to it will be removed."
          : "This comment and its replies will be removed.",
        confirmLabel: "Delete",
        tone: "danger",
      });
      if (allowed) editor.commit(removeComment(editor.document, pageId, comment.id));
    });
  if (editing)
    return (
      <CommentForm
        label="Edit comment"
        text={comment.text}
        onCancel={() => setEditing(false)}
        onSave={(text) => {
          editor.commit(editComment(editor.document, pageId, comment.id, text));
          setEditing(false);
        }}
      />
    );
  return (
    <div className={`comment-entry ${comment.parentId ? "comment-reply" : ""}`}>
      <div className="comment-meta">
        <strong>{comment.author || "Unnamed author"}</strong>
        <span>{displayDate(comment.createdAt)}</span>
      </div>
      <p>{comment.text || "No comment text."}</p>
      {comment.readOnly ? (
        <span className="comment-read-only">Read only</span>
      ) : (
        <div className="comment-entry-actions">
          <IconButton
            label={comment.parentId ? "Edit reply" : "Edit comment"}
            icon={Pencil}
            onClick={() => setEditing(true)}
          />
          <IconButton
            label={comment.parentId ? "Delete reply" : "Delete comment"}
            icon={Trash2}
            onClick={remove}
          />
        </div>
      )}
    </div>
  );
}

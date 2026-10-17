import { message } from "../i18n/messages";
import { formatDate } from "../i18n/format";
import { text as tr } from "../i18n/runtime";
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
  return Number.isFinite(date.getTime()) ? formatDate(date) : "";
}
export function CommentEntry({ comment, pageId }: { comment: PdfComment; pageId: string }) {
  const editor = useEditor();
  const [editing, setEditing] = useState(false);
  const remove = () =>
    editor.task.run(message("task.deletingComment"), async () => {
      const allowed = await editor.confirmation.ask({
        title: comment.parentId
          ? message("comments.deleteReplyQuestion")
          : message("comments.deleteThreadQuestion"),
        message: comment.parentId
          ? message("comments.deleteReplyDescription")
          : message("comments.deleteThreadDescription"),
        confirmLabel: message("common.delete"),
        tone: "danger",
      });
      if (allowed) editor.commit(removeComment(editor.document, pageId, comment.id));
    });
  if (editing)
    return (
      <CommentForm
        mode="edit"
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
        <strong>{comment.author || tr("comments.unnamedAuthor")}</strong>
        <span>{displayDate(comment.createdAt)}</span>
      </div>
      <p>{comment.text || tr("comments.noText")}</p>
      {comment.readOnly ? (
        <span className="comment-read-only">{tr("common.readOnly")}</span>
      ) : (
        <div className="comment-entry-actions">
          <IconButton
            label={comment.parentId ? tr("comments.editReply") : tr("comments.edit")}
            icon={Pencil}
            onClick={() => setEditing(true)}
          />
          <IconButton
            label={comment.parentId ? tr("comments.deleteReply") : tr("comments.delete")}
            icon={Trash2}
            onClick={remove}
          />
        </div>
      )}
    </div>
  );
}

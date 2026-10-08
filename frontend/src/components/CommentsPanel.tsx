import { useState } from "react";
import { MessageSquarePlus, Reply, X } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { type Page, type PdfComment } from "../core/model";
import { addComment, createComment, commentThread } from "../core/comments";
import { SidePanel } from "./ui/SidePanel";
import { IconButton } from "./ui/IconButton";
import { CommentForm } from "./CommentForm";
import { CommentEntry } from "./CommentEntry";

export function CommentsPanel() {
  const editor = useEditor();
  const roots = editor.document.pages.flatMap((page, index) =>
    (page.comments ?? [])
      .filter((comment) => !comment.parentId)
      .map((comment) => ({ page, comment, index }))
  );
  const close = () => {
    editor.setCommentsOpen(false);
    editor.setPendingComment(null);
  };
  return (
    <SidePanel
      id="comments-panel"
      label="Comments"
      className="comments-panel"
      open={editor.commentsOpen}
      onClose={close}
      drawer
    >
      <div className="panel-heading">
        <strong>Comments</strong>
        <span className="panel-count">{roots.length}</span>
        <IconButton label="Hide comments" icon={X} onClick={close} />
      </div>
      <button
        className="button secondary full"
        onClick={() => {
          close();
          editor.setObjectIds([]);
          editor.setTool("comment");
        }}
      >
        <MessageSquarePlus size={16} aria-hidden="true" />
        Add comment
      </button>
      {editor.pendingComment && <NewComment key={editor.pendingComment.id} />}
      {!roots.length && !editor.pendingComment && (
        <p className="comments-empty">Add a comment, then click its location on the page.</p>
      )}
      <div className="comment-list">
        {roots.map(({ page, comment, index }) => (
          <article
            key={comment.id}
            className={`comment-thread ${editor.commentId === comment.id ? "selected" : ""}`}
            aria-label={`Comment on page ${index + 1}`}
          >
            <button
              className="comment-jump"
              aria-expanded={editor.commentId === comment.id}
              onClick={() => {
                editor.setActiveId(page.id);
                editor.setObjectIds([]);
                editor.setCommentId(comment.id);
                editor.setPendingComment(null);
              }}
            >
              <span>Page {index + 1}</span>
              <span>{comment.text.slice(0, 100) || "Untitled note"}</span>
            </button>
            {editor.commentId === comment.id && (
              <Thread key={`${comment.id}-${editor.documentEpoch}`} page={page} root={comment} />
            )}
          </article>
        ))}
      </div>
    </SidePanel>
  );
}
function NewComment() {
  const editor = useEditor(),
    pending = editor.pendingComment!;
  return (
    <CommentForm
      label="New comment"
      author
      onCancel={() => editor.setPendingComment(null)}
      onSave={(text) => {
        const comment = createComment(pending.point, text, editor.commentAuthor);
        editor.commit(addComment(editor.document, pending.pageId, comment));
        editor.setCommentId(comment.id);
        editor.setPendingComment(null);
      }}
    />
  );
}
function Thread({ page, root }: { page: Page; root: PdfComment }) {
  const editor = useEditor();
  const [replying, setReplying] = useState(false);
  const members = commentThread(page.comments, root.id);
  return (
    <div className="comment-thread-body">
      {[
        root,
        ...(page.comments ?? []).filter((item) => item.id !== root.id && members.has(item.id)),
      ].map((comment) => (
        <CommentEntry
          key={`${comment.id}-${comment.modifiedAt}-${comment.text}`}
          comment={comment}
          pageId={page.id}
        />
      ))}
      {replying ? (
        <CommentForm
          label="Reply"
          author
          onCancel={() => setReplying(false)}
          onSave={(text) => {
            editor.commit(
              addComment(
                editor.document,
                page.id,
                createComment(root, text, editor.commentAuthor, root.id)
              )
            );
            setReplying(false);
          }}
        />
      ) : (
        <button className="button secondary" onClick={() => setReplying(true)}>
          <Reply size={16} aria-hidden="true" />
          Reply
        </button>
      )}
    </div>
  );
}

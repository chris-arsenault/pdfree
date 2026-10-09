import { useState } from "react";
import { MessageSquarePlus, Reply, X } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { type Page, type PdfComment, newId } from "../core/model";
import { addComment, createComment, commentThread, commentPointAt } from "../core/comments";
import { pagePoint } from "../core/coordinates";
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
      <AddCommentButton />
      {editor.pendingComment && <NewComment key={editor.pendingComment.id} />}
      {!roots.length && !editor.pendingComment && (
        <p className="comments-empty">Add a comment to the current page.</p>
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
function AddCommentButton() {
  const editor = useEditor();
  const add = () => {
    if (!editor.page) return;
    editor.setObjectIds([]);
    editor.setCommentId("");
    editor.setTool("select");
    editor.setPendingComment({
      id: newId(),
      pageId: editor.page.id,
      point: commentPointAt(visibleCentre(editor.page, editor.zoom), editor.page),
    });
  };
  return (
    <button
      className="button secondary full"
      disabled={!editor.page || !!editor.task.busy || !!editor.pendingComment}
      onClick={add}
    >
      <MessageSquarePlus size={16} aria-hidden="true" />
      Add comment
    </button>
  );
}
/** Centre of the page area currently scrolled into view, so a new note lands where the user looks. */
function visibleCentre(page: Page, zoom: number) {
  const surface = document.querySelector<HTMLElement>(".page-surface"),
    scroll = document.querySelector<HTMLElement>(".page-scroll");
  const box = page.box;
  const fallback = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  if (!surface || !scroll) return fallback;
  const shown = surface.getBoundingClientRect(),
    view = scroll.getBoundingClientRect();
  const left = Math.max(shown.left, view.left),
    right = Math.min(shown.right, view.right),
    top = Math.max(shown.top, view.top),
    bottom = Math.min(shown.bottom, view.bottom);
  if (right <= left || bottom <= top) return fallback;
  return pagePoint(
    { clientX: (left + right) / 2, clientY: (top + bottom) / 2 },
    surface,
    page,
    zoom
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

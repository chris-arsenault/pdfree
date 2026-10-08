import { useCallback, useState } from "react";
import { type Point } from "../core/model";

export function useCommentUi() {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentId, setCommentId] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");
  const [pendingComment, setPendingComment] = useState<{
    id: string;
    pageId: string;
    point: Point;
  } | null>(null);
  const resetComments = useCallback(() => {
    setCommentsOpen(false);
    setCommentId("");
    setPendingComment(null);
  }, []);
  return {
    commentsOpen,
    setCommentsOpen,
    commentId,
    setCommentId,
    commentAuthor,
    setCommentAuthor,
    pendingComment,
    setPendingComment,
    resetComments,
  };
}

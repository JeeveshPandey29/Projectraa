"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { createComment } from "@/lib/firestore";
import { Comment, User, ProgressLog, Task } from "@/lib/types";
import { format } from "date-fns";

interface CommentsProps {
  projectId: string;
  comments: Comment[];
  users: User[];
  progressLogs?: ProgressLog[];
  tasks?: Task[];
  onRefresh: () => void;
}

export function Comments({ projectId, comments, users, progressLogs = [], tasks = [], onRefresh }: CommentsProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    setLoading(true);
    try {
      await createComment({
        projectId,
        userId: user.id,
        content: newComment.trim(),
      });
      setNewComment("");
      onRefresh();
    } catch (error) {
      console.error("Error creating comment:", error);
    }
    setLoading(false);
  };

  const getUserInfo = (userId: string) => {
    return users.find((u) => u.id === userId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Leave Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your feedback or comment..."
            rows={3}
          />
          <Button
            onClick={handleSubmitComment}
            disabled={loading || !newComment.trim()}
            className="mt-3"
          >
            {loading ? "Posting..." : "Post Comment"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Feedback & Comments ({comments.length})</h3>
        
        {comments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-500">
              No comments yet. Be the first to leave feedback!
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => {
            const author = getUserInfo(comment.userId);
            const isTeacher = author?.role === "teacher";
            
            return (
              <Card key={comment.id} className={isTeacher ? "border-l-4 border-l-emerald-500" : ""}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    {author?.photoURL ? (
                      <img
                        src={author.photoURL}
                        alt={author.displayName}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                        <span className="font-medium text-slate-600">
                          {author?.displayName?.[0] || "?"}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{author?.displayName || "Unknown"}</span>
                        {isTeacher && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">
                            Teacher
                          </span>
                        )}
                        <span className="text-sm text-slate-500">
                          {format(comment.createdAt, "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

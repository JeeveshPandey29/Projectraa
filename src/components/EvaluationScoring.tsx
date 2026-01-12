"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Project, ProjectEvaluation } from "@/lib/types";
import { updateProjectEvaluation } from "@/lib/firestore";
import { useNotifications } from "@/contexts/NotificationContext";
import { Save, Calculator } from "lucide-react";

interface EvaluationScoringProps {
  project: Project;
  onRefresh: () => void;
  isTeacher: boolean;
}

export function EvaluationScoring({ project, onRefresh, isTeacher }: EvaluationScoringProps) {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [evalData, setEvalData] = useState<ProjectEvaluation>(project.evaluation || {
    review1Marks: 0,
    review2Marks: 0,
    review3Marks: 0,
    finalMarks: 0,
    totalScore: 0,
    feedback: "",
    updatedAt: new Date()
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTeacher) return;

    setLoading(true);
    try {
      const total = evalData.review1Marks + evalData.review2Marks + evalData.review3Marks + evalData.finalMarks;
      const updatedEval = { ...evalData, totalScore: total };
      await updateProjectEvaluation(project.id, updatedEval);
      addNotification("Evaluation updated successfully", "success");
      onRefresh();
    } catch (error) {
      console.error("Error updating evaluation:", error);
      addNotification("Failed to update evaluation", "error");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const total = Number(evalData.review1Marks) + Number(evalData.review2Marks) + Number(evalData.review3Marks) + Number(evalData.finalMarks);
    setEvalData(prev => ({ ...prev, totalScore: total }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Project Evaluation</CardTitle>
          <CardDescription>
            {isTeacher ? "Assign marks and provide feedback for this project." : "View your project evaluation and feedback."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="review1">Review 1 Marks</Label>
                  <Input
                    id="review1"
                    type="number"
                    disabled={!isTeacher}
                    value={evalData.review1Marks === 0 ? "" : evalData.review1Marks}
                    onChange={(e) => setEvalData({ ...evalData, review1Marks: e.target.value === "" ? 0 : Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review2">Review 2 Marks</Label>
                  <Input
                    id="review2"
                    type="number"
                    disabled={!isTeacher}
                    value={evalData.review2Marks === 0 ? "" : evalData.review2Marks}
                    onChange={(e) => setEvalData({ ...evalData, review2Marks: e.target.value === "" ? 0 : Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review3">Review 3 Marks</Label>
                  <Input
                    id="review3"
                    type="number"
                    disabled={!isTeacher}
                    value={evalData.review3Marks === 0 ? "" : evalData.review3Marks}
                    onChange={(e) => setEvalData({ ...evalData, review3Marks: e.target.value === "" ? 0 : Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="final">Final Marks</Label>
                  <Input
                    id="final"
                    type="number"
                    disabled={!isTeacher}
                    value={evalData.finalMarks === 0 ? "" : evalData.finalMarks}
                    onChange={(e) => setEvalData({ ...evalData, finalMarks: e.target.value === "" ? 0 : Number(e.target.value) })}
                    placeholder="0"
                  />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                disabled={!isTeacher}
                rows={4}
                value={evalData.feedback}
                onChange={(e) => setEvalData({ ...evalData, feedback: e.target.value })}
                placeholder="Enter feedback for the students..."
              />
            </div>

            {isTeacher && (
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={calculateTotal}>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Total
                </Button>
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save Evaluation"}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Score Summary</CardTitle>
          <CardDescription>Total performance tracking</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-slate-100"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * Math.min(evalData.totalScore, 100)) / 100}
                className="text-emerald-500 transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-slate-900">{evalData.totalScore}</span>
              <span className="text-xs text-slate-500 uppercase font-medium">Out of 100</span>
            </div>
          </div>
          <div className="mt-8 w-full space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Reviews</span>
              <span className="font-semibold">{evalData.review1Marks + evalData.review2Marks + evalData.review3Marks}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Final Presentation</span>
              <span className="font-semibold">{evalData.finalMarks}</span>
            </div>
            <div className="pt-3 border-t flex justify-between items-center font-bold text-slate-900">
              <span>Total Score</span>
              <span>{evalData.totalScore}/100</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

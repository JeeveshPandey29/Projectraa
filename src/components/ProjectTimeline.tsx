"use client";

import { ProgressLog, Meeting, Task, Sprint } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, MessageSquare, Users, Zap } from "lucide-react";

interface ProjectTimelineProps {
  sprints: Sprint[];
  tasks: Task[];
  meetings: Meeting[];
  progressLogs: ProgressLog[];
}

export function ProjectTimeline({ sprints, tasks, meetings, progressLogs }: ProjectTimelineProps) {
  // Combine all events into a single sorted timeline
  const events = [
    ...sprints.map(s => ({ type: "sprint", date: s.createdAt, data: s, title: `Sprint ${s.sprintNumber}: ${s.name}` })),
    ...meetings.map(m => ({ type: "meeting", date: m.date, data: m, title: `Meeting: ${m.agendaPoints[0] || "General Update"}` })),
    ...progressLogs.map(p => ({ type: "log", date: p.createdAt, data: p, title: "Progress Update" }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            No activity recorded yet.
          </CardContent>
        </Card>
      ) : (
        events.map((event, index) => (
          <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Icon */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 group-[.is-active]:bg-emerald-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              {event.type === "sprint" && <Zap className="w-5 h-5" />}
              {event.type === "meeting" && <Users className="w-5 h-5" />}
              {event.type === "log" && <CheckCircle2 className="w-5 h-5" />}
            </div>
            {/* Content */}
            <div className="w-[calc(100%-4rem)] md:w-[45%] p-4 rounded-xl border border-slate-200 bg-white shadow-sm group-hover:shadow-md transition-shadow md:order-1">
              <div className="flex items-center justify-between space-x-2 mb-1">
                <div className="font-bold text-slate-900">{event.title}</div>
                <time className="font-mono text-xs text-emerald-500 font-medium">
                  {event.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </time>
              </div>
              <div className="text-slate-500 text-sm">
                {event.type === "sprint" && `Status: ${(event.data as Sprint).status.replace("_", " ").toUpperCase()}`}
                {event.type === "meeting" && `${(event.data as Meeting).attendeeIds.length} Attendees • ${(event.data as Meeting).actionItems.length} Action Items`}
                {event.type === "log" && (event.data as ProgressLog).description}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

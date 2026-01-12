"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import { Task, Sprint, Project, ProgressLog } from "@/lib/types";
import { format, subDays, eachDayOfInterval } from "date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsChartsProps {
  projects: Project[];
  tasks: Task[];
  sprints: Sprint[];
  progressLogs: ProgressLog[];
}

export function AnalyticsCharts({ projects, tasks, sprints, progressLogs }: AnalyticsChartsProps) {
  const taskStatusData = {
    labels: ["Not Started", "In Progress", "Review", "Blocked", "Completed"],
    datasets: [
      {
        data: [
          tasks.filter((t) => t.status === "not_started").length,
          tasks.filter((t) => t.status === "in_progress").length,
          tasks.filter((t) => t.status === "review").length,
          tasks.filter((t) => t.status === "blocked").length,
          tasks.filter((t) => t.status === "completed").length,
        ],
        backgroundColor: [
          "rgba(156, 163, 175, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(234, 179, 8, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(34, 197, 94, 0.8)",
        ],
        borderColor: [
          "rgb(156, 163, 175)",
          "rgb(59, 130, 246)",
          "rgb(234, 179, 8)",
          "rgb(239, 68, 68)",
          "rgb(34, 197, 94)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const projectStatusData = {
    labels: ["Planning", "Active", "On Hold", "Completed"],
    datasets: [
      {
        data: [
          projects.filter((p) => p.status === "planning").length,
          projects.filter((p) => p.status === "active").length,
          projects.filter((p) => p.status === "on_hold").length,
          projects.filter((p) => p.status === "completed").length,
        ],
        backgroundColor: [
          "rgba(147, 51, 234, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(234, 179, 8, 0.8)",
          "rgba(34, 197, 94, 0.8)",
        ],
        borderColor: [
          "rgb(147, 51, 234)",
          "rgb(59, 130, 246)",
          "rgb(234, 179, 8)",
          "rgb(34, 197, 94)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const sprintProgressData = {
    labels: sprints.map((s) => `Sprint ${s.sprintNumber}`),
    datasets: [
      {
        label: "Completion %",
        data: sprints.map((s) => {
          const sprintTasks = tasks.filter((t) => t.sprintId === s.id);
          return sprintTasks.length > 0
            ? Math.round(
                sprintTasks.reduce((sum, t) => sum + t.percentComplete, 0) /
                  sprintTasks.length
              )
            : 0;
        }),
        backgroundColor: "rgba(16, 185, 129, 0.6)",
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const progressTrendData = {
    labels: last7Days.map((d) => format(d, "MMM d")),
    datasets: [
      {
        label: "Progress Updates",
        data: last7Days.map((day) => {
          return progressLogs.filter((log) => {
            const logDate = new Date(log.createdAt);
            return format(logDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
          }).length;
        }),
        fill: true,
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderColor: "rgb(59, 130, 246)",
        tension: 0.4,
        pointBackgroundColor: "rgb(59, 130, 246)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const projectProgressData = {
    labels: projects.slice(0, 8).map((p) => p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name),
    datasets: [
      {
        label: "Progress %",
        data: projects.slice(0, 8).map((p) => p.percentComplete),
        backgroundColor: projects.slice(0, 8).map((_, i) => {
          const colors = [
            "rgba(16, 185, 129, 0.7)",
            "rgba(59, 130, 246, 0.7)",
            "rgba(147, 51, 234, 0.7)",
            "rgba(234, 179, 8, 0.7)",
            "rgba(236, 72, 153, 0.7)",
            "rgba(239, 68, 68, 0.7)",
            "rgba(20, 184, 166, 0.7)",
            "rgba(249, 115, 22, 0.7)",
          ];
          return colors[i % colors.length];
        }),
        borderColor: projects.slice(0, 8).map((_, i) => {
          const colors = [
            "rgb(16, 185, 129)",
            "rgb(59, 130, 246)",
            "rgb(147, 51, 234)",
            "rgb(234, 179, 8)",
            "rgb(236, 72, 153)",
            "rgb(239, 68, 68)",
            "rgb(20, 184, 166)",
            "rgb(249, 115, 22)",
          ];
          return colors[i % colors.length];
        }),
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: { size: 12 },
        },
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { font: { size: 11 } },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
    },
  };

  const lineOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { font: { size: 11 } },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Task Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Doughnut data={taskStatusData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Pie data={projectStatusData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sprint Completion Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Bar data={sprintProgressData} options={barOptions} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progress Updates (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Line data={progressTrendData} options={lineOptions} />
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Project Progress Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <Bar data={projectProgressData} options={barOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { ListTodo, CheckCircle2, AlertTriangle, AlertCircle, Clock, Search, Filter, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { careosToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

interface NursingTask {
  id: string;
  title: string;
  description: string | null;
  patientName: string;
  priority: string;
  status: string;
  dueAt: string | null;
}

interface Nurse {
  id: string;
  shiftType: string;
  shiftRange: string;
  department: string;
}

interface Stats {
  shiftTimeRemaining: string;
  marDueCount: number;
  pendingTasksCount: number;
  pendingHandoffsCount: number;
}

interface NursingDashboardData {
  nurse: Nurse;
  stats: Stats;
  tasksList: NursingTask[];
}

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("all"); // Wait, let's use search state
  const [searchVal, setSearchVal] = useState<string>("");
  // Local state to simulate task completion without throwing errors on page reload
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());

  // Fetch Nurse Dashboard Data
  const { data: responseData, isLoading, isError, refetch, isRefetching } = useQuery<{ data: NursingDashboardData }>({
    queryKey: ["nurse", "dashboard"],
    queryFn: () => apiClient.get<{ data: NursingDashboardData }>("/nursing/dashboard"),
  });

  const data = responseData?.data;

  const handleCompleteTask = (taskId: string, title: string) => {
    setCompletedTaskIds((prev) => {
      const updated = new Set(prev);
      updated.add(taskId);
      return updated;
    });
    careosToast.success(`Completed task: "${title}" successfully.`);
    // We can also trigger a refetch if we want, but since we simulate, local state is perfect.
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-1/3 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="p-8 text-center flex flex-col items-center justify-center gap-4 border-dashed border-2">
        <div className="p-3 bg-destructive/10 rounded-full text-destructive">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Failed to load Task Queue</h3>
          <p className="text-sm text-text-secondary mt-1">Please try refreshing the page.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 text-sm bg-role-nurse text-text-inverse rounded-md font-semibold"
        >
          Retry
        </button>
      </Card>
    );
  }

  // Calculate stats based on non-completed tasks
  const activeTasks = data.tasksList.filter((task) => !completedTaskIds.has(task.id));
  const totalPending = activeTasks.length;
  const highPriorityCount = activeTasks.filter((t) => t.priority.toLowerCase() === "high" || t.priority.toLowerCase() === "critical").length;
  const normalPriorityCount = activeTasks.filter((t) => t.priority.toLowerCase() !== "high" && t.priority.toLowerCase() !== "critical").length;

  // Filter tasks based on searchQuery and priorityFilter
  const filteredTasks = activeTasks.filter((task) => {
    const matchesPriority =
      priorityFilter === "all" ||
      task.priority.toLowerCase() === priorityFilter.toLowerCase();

    const matchesSearch =
      searchVal === "" ||
      task.title.toLowerCase().includes(searchVal.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchVal.toLowerCase())) ||
      task.patientName.toLowerCase().includes(searchVal.toLowerCase());

    return matchesPriority && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Nursing Task Queue</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage your daily workflow, patient care steps, and nursing checkpoints.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="self-start sm:self-center h-9 px-3 rounded-md border border-border bg-bg-muted hover:bg-bg-subtle text-text-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
          {isRefetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Summary widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-role-nurse shadow-sm">
          <div className="p-2.5 rounded-lg bg-role-nurse/10 text-role-nurse">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Pending Tasks</p>
            <p className="text-lg font-bold text-text-primary mt-0.5 font-data">{totalPending} Assigned</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-warning shadow-sm">
          <div className="p-2.5 rounded-lg bg-warning/10 text-warning">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">High / Critical Priority</p>
            <p className="text-lg font-bold text-text-primary mt-0.5 font-data">{highPriorityCount} Tasks</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-success shadow-sm">
          <div className="p-2.5 rounded-lg bg-success/10 text-success">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Completed (This Session)</p>
            <p className="text-lg font-bold text-text-primary mt-0.5 font-data">{completedTaskIds.size} Resolved</p>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search by title, description, patient..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-md border border-border bg-bg-muted text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-nurse"
          />
        </div>

        {/* Priority Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto shrink-0 py-1">
          <span className="text-xs font-semibold text-text-secondary flex items-center gap-1.5 whitespace-nowrap mr-2">
            <Filter className="w-3.5 h-3.5" /> Priority:
          </span>
          <div className="flex gap-1.5">
            {[
              { id: "all", label: "All Tasks" },
              { id: "high", label: "High Priority" },
              { id: "medium", label: "Medium" },
              { id: "low", label: "Low" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setPriorityFilter(filter.id)}
                className={`h-8 px-3 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  priorityFilter === filter.id
                    ? "bg-role-nurse text-text-inverse shadow-sm"
                    : "bg-bg-muted hover:bg-bg-subtle text-text-secondary border border-border"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Task Queue List */}
      <Card className="p-6 shadow-sm flex flex-col gap-4">
        <h2 className="text-base font-bold text-text-primary">Current Shift Tasks</h2>
        
        <div className="flex flex-col gap-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-text-tertiary">
              <CheckCircle2 className="w-12 h-12 mx-auto text-success/30 mb-3" />
              <h3 className="font-semibold text-text-secondary text-sm">No pending tasks found</h3>
              <p className="text-xs text-text-tertiary mt-1">
                {totalPending > 0 ? "Try modifying your search queries." : "Great job! All shift tasks are completed."}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isHigh = task.priority.toLowerCase() === "high" || task.priority.toLowerCase() === "critical";
              
              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-fast bg-bg-muted/30 border-border hover:border-border-subtle`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-text-primary truncate">{task.title}</h3>
                      <Badge
                        variant={isHigh ? "warning" : "neutral"}
                        className="text-[10px] uppercase font-bold py-0.5 px-2"
                      >
                        {task.priority}
                      </Badge>
                      <Badge variant="neutral" className="text-[10px] py-[1px] px-1.5 bg-bg-elevated border-border-subtle text-text-secondary">
                        Patient: {task.patientName}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-xs text-text-secondary line-clamp-2 mt-1">{task.description}</p>
                    )}
                    {task.dueAt && (
                      <p className="text-[11px] text-text-tertiary mt-2 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                        Due: {new Date(task.dueAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => handleCompleteTask(task.id, task.title)}
                      className="h-9 px-4 rounded-md border border-success/30 text-success hover:bg-success/5 bg-bg-base text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 fill-current" />
                      Mark Resolved
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

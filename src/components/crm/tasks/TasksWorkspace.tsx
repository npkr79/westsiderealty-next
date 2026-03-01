"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTasks } from "@/hooks/useTasks";
import type { CrmTask } from "@/lib/crm/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AgentOption {
  id: string;
  full_name: string | null;
}

const isToday = (value?: string | null): boolean => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
};

const isUpcoming = (value?: string | null): boolean => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compare = new Date(date);
  compare.setHours(0, 0, 0, 0);
  return compare.getTime() > today.getTime();
};

export default function TasksWorkspace() {
  const supabase = useMemo(() => createClient(), []);
  const [assignedTo, setAssignedTo] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { tasks, loading, error, refetch } = useTasks({
    assignedTo: assignedTo === "all" ? undefined : assignedTo,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  useEffect(() => {
    const loadAgents = async () => {
      const { data } = await supabase
        .from("crm_users")
        .select("id,full_name")
        .eq("is_active", true)
        .order("full_name", { ascending: true });
      setAgents((data as AgentOption[]) || []);
    };
    loadAgents();
  }, [supabase]);

  const dueToday = useMemo(
    () => tasks.filter((task) => task.status !== "completed" && isToday(task.due_date)),
    [tasks]
  );
  const upcoming = useMemo(
    () => tasks.filter((task) => task.status !== "completed" && isUpcoming(task.due_date)),
    [tasks]
  );
  const completed = useMemo(() => tasks.filter((task) => task.status === "completed"), [tasks]);

  const setTaskStatus = useCallback(
    async (taskId: string, nextStatus: string) => {
      setMutationError(null);
      const { error: updateError } = await supabase.from("crm_tasks").update({ status: nextStatus }).eq("id", taskId);
      if (updateError) {
        setMutationError(updateError.message || "Failed to update task.");
        return;
      }
      refetch();
    },
    [refetch, supabase]
  );

  const addTask = useCallback(async () => {
    if (!newTaskTitle.trim()) return;
    setSubmitting(true);
    setMutationError(null);
    const payload: Partial<CrmTask> = {
      title: newTaskTitle.trim(),
      due_date: newTaskDueDate || null,
      status: "pending",
    };
    if (newTaskAssignee !== "all") {
      payload.assigned_to = newTaskAssignee;
    }
    const { error: insertError } = await supabase.from("crm_tasks").insert(payload);
    setSubmitting(false);
    if (insertError) {
      setMutationError(insertError.message || "Failed to create task.");
      return;
    }
    setNewTaskTitle("");
    setNewTaskDueDate("");
    setNewTaskAssignee("all");
    refetch();
  }, [newTaskAssignee, newTaskDueDate, newTaskTitle, refetch, supabase]);

  const renderTaskList = (title: string, list: CrmTask[]) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {list.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No tasks in this bucket.</p>
        ) : (
          list.map((task) => (
            <div key={task.id} className="rounded-md border p-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  className="mt-1"
                  checked={task.status === "completed"}
                  onCheckedChange={(checked) => setTaskStatus(task.id, checked ? "completed" : "pending")}
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${task.status === "completed" ? "line-through opacity-70" : ""}`}>
                    {task.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : "Not set"}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Create task</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-4">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task title"
            className="md:col-span-2"
          />
          <Input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} />
          <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
            <SelectTrigger>
              <SelectValue placeholder="Assign agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Unassigned</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.full_name || agent.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="md:col-span-4">
            <Button type="button" onClick={addTask} disabled={submitting}>
              {submitting ? "Creating..." : "Add task"}
            </Button>
          </div>
          {mutationError ? <p className="md:col-span-4 text-sm text-rose-600 dark:text-rose-300">{mutationError}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-2 pt-6 md:grid-cols-3">
          <Select value={assignedTo} onValueChange={setAssignedTo}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.full_name || agent.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? <p className="text-sm">Loading tasks...</p> : null}
      {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
      <div className="grid gap-4 lg:grid-cols-3">
        {renderTaskList("Due today", dueToday)}
        {renderTaskList("Upcoming", upcoming)}
        {renderTaskList("Completed", completed)}
      </div>
    </div>
  );
}

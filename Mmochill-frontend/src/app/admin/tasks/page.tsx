import TasksTable from "@/components/admin/tasks-table";
import { Database } from "lucide-react";

export default function AdminTasksPage() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Database: Tasks
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your MMO platform tasks here. Changes sync immediately.
          </p>
        </div>
        
        {/* We moved the New Task button inside the TaskTable component to manage state easily,
            but we could also put it here if we elevate state. Usually in Nextjs App router, 
            the table client component handles its own modal state. */}
      </div>

      <div className="bg-card border border-border rounded-3xl p-1 shadow-sm overflow-hidden">
        <TasksTable />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { 
  Edit, Trash2, PlusCircle, 
  Search, Link as LinkIcon, AlertCircle, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { 
  getTasks, addTask, updateTask, deleteTask, updateTaskStatus, 
  DatabaseTask, TaskStatus 
} from "@/app/actions/tasks";

export default function TasksTable() {
  const [tasks, setTasks] = useState<DatabaseTask[]>([]);
  const [search, setSearch] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DatabaseTask | null>(null);
  
  // Selection & Delete states
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [tasksToDelete, setTasksToDelete] = useState<string[]>([]);

  const fetchData = async () => {
    setIsLoadingData(true);
    const data = await getTasks();
    setTasks(data);
    setIsLoadingData(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  // Filter tasks
  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  // Form Handlers
  const handleSaveTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      let res;
      if (editingTask) {
        res = await updateTask(editingTask.id, formData);
        if (res.success) {
          toast.success("Task updated successfully!");
        } else {
          toast.error("Error updating task: " + res.error);
        }
      } else {
        res = await addTask(formData);
        if (res.success) {
          toast.success("Task created successfully!");
        } else {
          toast.error("Error creating task: " + res.error);
        }
      }

      if (res.success) {
        await fetchData();
        setIsModalOpen(false);
        setEditingTask(null);
      }
    });
  };

  const handleDelete = async () => {
    if (tasksToDelete.length > 0) {
      startTransition(async () => {
        let successCount = 0;
        let failsCount = 0;
        
        await Promise.all(tasksToDelete.map(async (id) => {
           const res = await deleteTask(id);
           if (res.success) successCount++;
           else failsCount++;
        }));

        if (successCount > 0) toast.success(`Deleted ${successCount} tasks successfully!`);
        if (failsCount > 0) toast.error(`Failed to delete ${failsCount} tasks.`);
        
        await fetchData();
        setTasksToDelete([]);
        setSelectedTasks([]);
      });
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTasks(filteredTasks.map(t => t.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const toggleSelectTask = (id: string) => {
    setSelectedTasks(prev => 
      prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]
    );
  };

  const handleToggleStatus = async (id: string, currentStatus: TaskStatus) => {
    // Optimistic UI Update
    setTasks(tasks.map(t => t.id === id ? { ...t, status: currentStatus === "active" ? "inactive" : "active" } : t));
    
    startTransition(async () => {
      const res = await updateTaskStatus(id, currentStatus);
      if (res.success) {
        toast.success(`Task is now ${res.newStatus}`);
      } else {
        toast.error("Failed to update status");
        // Revert UI on failure
        await fetchData();
      }
    });
  };

  const openAddModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: DatabaseTask) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-muted/50 border border-border/50 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <button 
          onClick={openAddModal}
          disabled={isPending}
          className="w-full sm:w-auto bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
        >
          <PlusCircle className="w-4 h-4" /> Add New Task
        </button>

        <AnimatePresence>
          {selectedTasks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <button 
                onClick={() => setTasksToDelete(selectedTasks)}
                disabled={isPending}
                className="w-full sm:w-auto bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors shadow-sm disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Delete ({selectedTasks.length})
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4 w-12">
                <input 
                  type="checkbox" 
                  checked={filteredTasks.length > 0 && selectedTasks.length === filteredTasks.length}
                  onChange={handleSelectAll}
                  className="rounded border-border/50 text-primary focus:ring-primary/20 bg-muted"
                />
              </th>
              <th className="px-4 py-4">Task Name</th>
              <th className="px-6 py-4">Target URL</th>
              <th className="px-6 py-4">Reward</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 relative">
            {isLoadingData ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading DB Tasks...</span>
                  </div>
                </td>
              </tr>
            ) : filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No tasks found. Create one.
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr key={task.id} className={`transition-colors ${selectedTasks.includes(task.id) ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      checked={selectedTasks.includes(task.id)}
                      onChange={() => toggleSelectTask(task.id)}
                      className="rounded border-border/50 text-primary focus:ring-primary/20 bg-muted"
                    />
                  </td>
                  <td className="px-4 py-4 font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs uppercase">
                      {task.type.charAt(0)}
                    </div>
                    {task.title}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    <a href={task.target_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                      <LinkIcon className="w-3 h-3" />
                      {task.target_url.length > 25 ? task.target_url.slice(0, 25) + '...' : task.target_url}
                    </a>
                  </td>
                  <td className="px-6 py-4 font-semibold text-emerald-500">
                    +{task.reward_amount}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                        onClick={() => handleToggleStatus(task.id, task.status)}
                        disabled={isPending}
                        className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex transition-colors cursor-pointer disabled:opacity-50 ${
                        task.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' 
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-muted-foreground">
                      <button onClick={() => openEditModal(task)} disabled={isPending} className="p-2 hover:bg-muted rounded-lg hover:text-foreground transition-colors disabled:opacity-50">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setTasksToDelete([task.id])} disabled={isPending} className="p-2 hover:bg-red-500/10 rounded-lg hover:text-red-500 transition-colors disabled:opacity-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative bg-card border border-border w-full max-w-lg rounded-3xl shadow-xl overflow-hidden z-10"
            >
              <div className="p-6 border-b border-border/50">
                <h3 className="font-bold text-xl">{editingTask ? 'Edit Task' : 'Create New Task'}</h3>
                <p className="text-sm text-muted-foreground">Configure the task details and reward.</p>
              </div>
              
              <form onSubmit={handleSaveTask} className="p-6 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Task Title</label>
                  <input required name="title" defaultValue={editingTask?.title} type="text" className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g. Visit Example.com" />
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Target URL</label>
                  <input required name="target_url" defaultValue={editingTask?.target_url} type="url" className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="https://" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Reward Amount (VND)</label>
                    <input required name="reward_amount" defaultValue={editingTask?.reward_amount} type="number" min="0" className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="250" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Required Time (s)</label>
                    <input required name="time_requirement" defaultValue={editingTask?.time_requirement || 30} type="number" min="0" className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="30" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Type</label>
                     <select name="type" defaultValue={editingTask?.type || 'surf'} className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none">
                       <option value="surf">Surf / Visit</option>
                       <option value="app">Download App</option>
                       <option value="video">Watch Video</option>
                     </select>
                  </div>
                  <div>
                     <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Provider</label>
                     <select name="provider" defaultValue={editingTask?.provider || 'taplayma'} className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none">
                       <option value="taplayma">TapLayMa.com</option>
                       <option value="nhapma">NhapMa.com</option>
                       <option value="traffic68">Traffic68.com</option>
                       <option value="manual">Manual / Others</option>
                     </select>
                  </div>
                </div>

                <div>
                   <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Status</label>
                   <select name="status" defaultValue={editingTask?.status || 'active'} className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none">
                     <option value="active">Active</option>
                     <option value="inactive">Inactive</option>
                   </select>
                </div>

                <div className="mt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={isPending} className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={isPending} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Task"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {tasksToDelete.length > 0 && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setTasksToDelete([])}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="relative bg-card border border-border w-full max-w-sm rounded-3xl p-6 shadow-xl text-center z-10"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-1">Delete Task?</h3>
              <p className="text-sm text-muted-foreground mb-6">Are you sure you want to delete {tasksToDelete.length === 1 ? 'this task' : `these ${tasksToDelete.length} tasks`}? This action cannot be undone.</p>
              
              <div className="flex gap-3">
                <button onClick={() => setTasksToDelete([])} disabled={isPending} className="flex-1 py-2 rounded-xl text-sm font-semibold hover:bg-muted transition-colors border border-border disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={isPending} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Calendar, Trash2, Edit3, Plus } from 'lucide-react';
import { tasksApi, adminApi, eventsApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TASK_STATUSES, TASK_DOMAINS } from '@/constants';
import type { Task, Event } from '@/types';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function Tasks() {
  const [filter, setFilter] = useState<string>('');
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const canDelete = useAuthStore(
    (s) => s.user?.role === 'Event Manager' || s.user?.role === 'Admin'
  );
  const canCreate = canDelete;

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.list().then((r) => r.data),
  });

  const filtered = (tasks as Task[]).filter((t) => !filter || t.status === filter);

  const userRole = useAuthStore((s) => s.user?.role);
  const isEventManagerOrAdmin = userRole === 'Event Manager' || userRole === 'Admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-header">
            {isEventManagerOrAdmin ? 'All tasks' : 'My tasks'}
          </h1>
          <p className="text-slate-600">
            {isEventManagerOrAdmin
              ? 'Tasks for events you manage'
              : 'Tasks assigned to you'}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)} size="md">
            <Plus className="h-4 w-4 mr-2" />
            Assign task
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter('')}
          className={`rounded-xl px-3 py-1.5 text-sm font-medium ${
            filter === '' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All
        </button>
        {TASK_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium ${
              filter === s ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-12 text-center">
          <CheckSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No tasks assigned</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((task) => (
            <Card key={task._id} className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-900">{task.name}</h3>
                  <StatusBadge status={task.status} />
                  <span className="text-xs text-slate-500">{task.domain}</span>
                </div>
                <p className="text-sm text-slate-600 mt-0.5 line-clamp-1">{task.description}</p>
                <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Due {formatDate(task.dueDate)}
                  </span>
                  <span>{task.completionPercentage}%</span>
                </div>
                <div className="mt-2 w-full max-w-xs h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${task.completionPercentage}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditTask(task)}
                  aria-label="Edit task"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(task._id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    aria-label="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {editTask && (
        <EditTaskModal
          task={editTask}
          open={!!editTask}
          onClose={() => setEditTask(null)}
        />
      )}
      {deleteId && (
        <DeleteTaskModal
          taskId={deleteId}
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
        />
      )}
      {createOpen && (
        <CreateTaskModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  );
}

function EditTaskModal({
  task,
  open,
  onClose,
}: {
  task: Task;
  open: boolean;
  onClose: () => void;
}) {
  const [status, setStatus] = useState(task.status);
  const [completionPercentage, setCompletionPercentage] = useState(task.completionPercentage);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: () =>
      tasksApi.update(task._id, { status, completionPercentage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message ?? 'Update failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (completionPercentage < 0 || completionPercentage > 100) {
      setError('Completion must be between 0 and 100');
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Modal open={open} onClose={onClose} title="Update task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">{task.name}</p>
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as Task['status'])}
        >
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Input
          label="Completion %"
          type="number"
          min={0}
          max={100}
          value={completionPercentage}
          onChange={(e) => setCompletionPercentage(Number(e.target.value))}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteTaskModal({
  taskId,
  open,
  onClose,
}: {
  taskId: string;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Delete task">
      <p className="text-slate-600 mb-4">Are you sure you want to delete this task?</p>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </Modal>
  );
}

function CreateTaskModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventId, setEventId] = useState('');
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState('Pending');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [domain, setDomain] = useState('General');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.list().then((r) => r.data),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => adminApi.getUsers().then((r) => r.data),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      tasksApi.create({
        name,
        description,
        event: eventId,
        assignee: assignee || null,
        status,
        completionPercentage,
        dueDate,
        domain,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
      setName('');
      setDescription('');
      setEventId('');
      setAssignee('');
      setStatus('Pending');
      setCompletionPercentage(0);
      setDueDate('');
      setDomain('General');
      setError('');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message ?? 'Failed to create task');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !description || !eventId || !dueDate || !domain) {
      setError('Please fill all required fields');
      return;
    }
    createMutation.mutate();
  };

  return (
    <Modal open={open} onClose={onClose} title="Assign task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Task name"
          required
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Task description"
            rows={3}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            required
          />
        </div>
        <Select
          label="Event"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          required
        >
          <option value="">Select an event</option>
          {(events as Event[]).map((e) => (
            <option key={e._id} value={e._id}>
              {e.title}
            </option>
          ))}
        </Select>
        <Select
          label="Assign to (optional)"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
        >
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name} ({u.email})
            </option>
          ))}
        </Select>
        <Select
          label="Domain"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          required
        >
          {TASK_DOMAINS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Input
          label="Due date"
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />
        <Input
          label="Completion %"
          type="number"
          min={0}
          max={100}
          value={completionPercentage}
          onChange={(e) => setCompletionPercentage(Number(e.target.value))}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

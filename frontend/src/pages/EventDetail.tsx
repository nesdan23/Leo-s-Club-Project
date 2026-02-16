import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin, Users, Upload, ArrowLeft } from 'lucide-react';
import { eventsApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { ROUTES } from '@/constants';
import type { Event, Task } from '@/types';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [importOpen, setImportOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importError, setImportError] = useState('');
  const isEventManager = useAuthStore(
    (s) => s.user?.role === 'Event Manager' || s.user?.role === 'Admin'
  );
  const isAdmin = useAuthStore((s) => s.user?.role === 'Admin');

  const { data: event, isLoading } = useQuery({
    queryKey: ['events', id],
    queryFn: () => eventsApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  });

  const { data: volunteers, refetch: refetchVolunteers } = useQuery({
    queryKey: ['events', id, 'volunteers'],
    queryFn: () => eventsApi.getVolunteers(id!).then((r) => r.data),
    enabled: !!id && (isEventManager || isAdmin),
  });

  if (!id) return null;
  if (isLoading || !event) {
    return (
      <div className="space-y-6">
        <Link to={ROUTES.EVENTS} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to events
        </Link>
        <Card className="animate-pulse h-64" />
      </div>
    );
  }

  const ev = event as Event;
  const volunteerTasks = (ev as Event & { volunteerTasks?: Task[] }).volunteerTasks ?? [];
  const manager = typeof ev.manager === 'object' ? ev.manager : null;

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.EVENTS}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to events
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-slate-900">{ev.title}</h1>
            <StatusBadge status={ev.status} />
          </div>
          <p className="text-slate-600">{ev.description}</p>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(ev.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {ev.location}
            </span>
            {manager && (
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {manager.name}
              </span>
            )}
          </div>
        </div>
        {isEventManager && (
          <Button onClick={() => setImportOpen(true)} size="md">
            <Upload className="h-4 w-4 mr-2" />
            Import volunteers
          </Button>
        )}
      </div>

      {volunteerTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My tasks for this event</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {volunteerTasks.map((task) => (
                <li key={task._id}>
                  <Link
                    to={ROUTES.TASKS}
                    className="block px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{task.name}</span>
                      <StatusBadge status={task.status} />
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {task.completionPercentage}% · {task.domain}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {volunteers && (volunteers.totalVolunteers > 0 || isEventManager) && (
        <Card>
          <CardHeader>
            <CardTitle>Volunteers ({volunteers.totalVolunteers})</CardTitle>
          </CardHeader>
          <CardContent>
            {volunteers.totalVolunteers === 0 ? (
              <p className="text-slate-500 text-sm">No volunteers imported yet.</p>
            ) : (
              <ul className="space-y-2">
                {volunteers.allVolunteers.slice(0, 10).map((v) => (
                  <li key={v.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="font-medium text-slate-900">{v.name}</span>
                    <span className="text-sm text-slate-500">{v.preferredDomain}</span>
                  </li>
                ))}
                {volunteers.allVolunteers.length > 10 && (
                  <li className="text-sm text-slate-500 pt-2">
                    +{volunteers.allVolunteers.length - 10} more
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <ImportVolunteersModal
        eventId={id}
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setFile(null);
          setImportError('');
        }}
        onSuccess={() => refetchVolunteers()}
        file={file}
        setFile={setFile}
        error={importError}
        setError={setImportError}
      />
    </div>
  );
}

function ImportVolunteersModal({
  eventId,
  open,
  onClose,
  onSuccess,
  file,
  setFile,
  error,
  setError,
}: {
  eventId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  file: File | null;
  setFile: (f: File | null) => void;
  error: string;
  setError: (s: string) => void;
}) {
  const queryClient = useQueryClient();
  const importMutation = useMutation({
    mutationFn: (f: File) => eventsApi.importVolunteers(eventId, f),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'volunteers'] });
      onSuccess();
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message ?? 'Import failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!file) {
      setError('Please select an Excel file (.xlsx)');
      return;
    }
    importMutation.mutate(file);
  };

  return (
    <Modal open={open} onClose={onClose} title="Import volunteers">
      <p className="text-sm text-slate-600 mb-4">
        Upload an Excel file with columns: Name, Email, PreferredDomain.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">File</label>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={importMutation.isPending || !file}>
            {importMutation.isPending ? 'Importing...' : 'Import'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}


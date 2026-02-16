import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, MapPin } from 'lucide-react';
import { eventsApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ROUTES } from '@/constants';
import { EVENT_STATUSES } from '@/constants';
import type { Event } from '@/types';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function Events() {
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<string>('');

  const isEventManager = useAuthStore(
    (s) => s.user?.role === 'Event Manager' || s.user?.role === 'Admin'
  );

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.list().then((r) => r.data),
  });

  const filtered = (events as Event[]).filter(
    (e) => !filter || e.status === filter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-header">Events</h1>
          <p className="text-slate-600">View and manage events</p>
        </div>
        {isEventManager && (
          <Button onClick={() => setCreateOpen(true)} size="md">
            <Plus className="h-4 w-4 mr-2" />
            New event
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
        {EVENT_STATUSES.map((s) => (
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-12 text-center">
          <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No events found</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <Link key={event._id} to={ROUTES.EVENT_DETAIL(event._id)}>
              <Card className="h-full transition-shadow hover:shadow-soft-lg">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-slate-900 line-clamp-2">{event.title}</h3>
                  <StatusBadge status={event.status} />
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 mb-3">{event.description}</p>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  {formatDate(event.date)}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  {event.location}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateEventModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function CreateEventModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('Draft');
  const [volunteerFile, setVolunteerFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () =>
      eventsApi.create({ title, description, date, location, status }),
    onSuccess: async (res) => {
      const eventId = res.data._id;
      queryClient.invalidateQueries({ queryKey: ['events'] });
      
      // If volunteer file is uploaded, import volunteers
      if (volunteerFile) {
        try {
          await eventsApi.importVolunteers(eventId, volunteerFile);
          setSuccess('Event created and volunteers imported successfully!');
        } catch (err: any) {
          setError(err.response?.data?.message ?? 'Event created but volunteer import failed');
        }
      } else {
        setSuccess('Event created successfully!');
      }
      
      setTimeout(() => {
        onClose();
        setTitle('');
        setDescription('');
        setDate('');
        setLocation('');
        setStatus('Draft');
        setVolunteerFile(null);
        setError('');
        setSuccess('');
      }, 2000);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message ?? 'Failed to create event');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title || !description || !date || !location) {
      setError('Please fill all required fields');
      return;
    }
    createMutation.mutate();
  };

  return (
    <Modal open={open} onClose={onClose} title="New event">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          required
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description"
            rows={3}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            required
          />
        </div>
        <Input
          label="Date"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <Input
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Venue or address"
          required
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {EVENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Upload volunteers (optional)
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Excel file with columns: Name, Email, PreferredDomain
          </p>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setVolunteerFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700"
          />
        </div>
        {success && <p className="text-sm text-green-600">{success}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create event'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

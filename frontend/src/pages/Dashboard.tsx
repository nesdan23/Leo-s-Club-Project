import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { adminApi, eventsApi, tasksApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { MetricCard } from '@/components/ui/MetricCard';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ROUTES } from '@/constants';
import type { Event, Task } from '@/types';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function Dashboard() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'Admin');

  const { data: adminData } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.getDashboard().then((r) => r.data),
    enabled: isAdmin,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.list().then((r) => r.data),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.list().then((r) => r.data),
  });

  const recentEvents = (events as Event[]).slice(0, 5);
  const recentTasks = (tasks as Task[]).slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-header">Dashboard</h1>
        <p className="text-slate-600">Overview of your events and tasks</p>
      </div>

      {isAdmin && adminData?.events && adminData.events.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Admin metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total events"
              value={adminData.events.length}
              description="Across the organization"
              variant="pastel-sky"
            />
            <MetricCard
              title="Total tasks"
              value={adminData.events.reduce((s, e) => s + e.totalTasks, 0)}
              description="All events combined"
              variant="pastel-lavender"
            />
            <MetricCard
              title="Avg. completion"
              value={`${(
                adminData.events.reduce((s, e) => s + e.averageCompletion, 0) /
                adminData.events.length
              ).toFixed(1)}%`}
              description="Task completion rate"
              variant="pastel-mint"
            />
            <MetricCard
              title="Events in progress"
              value={adminData.events.filter((e) => e.event.status === 'In Progress').length}
              description="Currently active"
              variant="pastel-yellow"
            />
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent events</h2>
            <Link
              to={ROUTES.EVENTS}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              {recentEvents.length === 0 ? (
                <p className="p-5 text-slate-500 text-sm">No events yet</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {recentEvents.map((event) => (
                    <li key={event._id}>
                      <Link
                        to={ROUTES.EVENT_DETAIL(event._id)}
                        className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/80 transition-colors rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-accent-sky/80 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{event.title}</p>
                            <p className="text-sm text-slate-500">
                              {formatDate(event.date)} · {event.location}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={event.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">My tasks</h2>
            <Link
              to={ROUTES.TASKS}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </div>
          <Card variant="pastel-mint">
            <CardContent className="p-0">
              {recentTasks.length === 0 ? (
                <p className="p-5 text-slate-600 text-sm">No tasks assigned</p>
              ) : (
                <ul className="space-y-2">
                  {recentTasks.map((task) => (
                    <li key={task._id}>
                      <Link
                        to={ROUTES.TASKS}
                        className="block px-4 py-3 rounded-xl hover:bg-white/50 transition-colors"
                      >
                        <p className="font-medium text-slate-900 text-sm">{task.name}</p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {typeof task.event === 'object' && task.event?.title}
                          {' · '}
                          {task.completionPercentage}%
                        </p>
                        <StatusBadge status={task.status} className="mt-1" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

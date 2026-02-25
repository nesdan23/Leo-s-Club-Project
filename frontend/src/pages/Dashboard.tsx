import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

import { adminApi, eventsApi, tasksApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { MetricCard } from '@/components/ui/MetricCard';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ROUTES } from '@/constants';
import type { Event, Task } from '@/types';

/* ======================
   TYPES
====================== */
type TaskStatus =
  | 'Completed'
  | 'In Progress'
  | 'Upcoming'
  | 'Pending'
  | 'Cancelled';

type AdminDashboardEvent = {
  event: { status: string };
  totalTasks: number;
  averageCompletion: number;
};

type AdminDashboardResponse = {
  events: AdminDashboardEvent[];
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role;
  const userId = user?.id;

  const isAdmin = userRole === 'Admin';
  const isEventManager = userRole === 'Event Manager';
  const isTeamMember = userRole === 'Team Member';

  const canViewAnalytics = isAdmin || isEventManager;

  /* ======================
     DATA FETCHING
  ====================== */
  const { data: adminData } = useQuery<AdminDashboardResponse>({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.getDashboard().then((r) => r.data),
    enabled: isAdmin,
  });

  const { data: allEvents = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.list().then((r) => r.data),
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.list().then((r) => r.data),
  });

  /* ======================
     🔐 ROLE-BASED FILTERING
  ====================== */
  let events: Event[] = [];
  let tasks: Task[] = [];
  const getUserId = (u: any) =>
  typeof u === 'object' ? u?._id : u;

  const getEventId = (e: any) =>
  typeof e === 'object' ? e?._id : e;

  if (isAdmin) {
    events = allEvents as Event[];
    tasks = allTasks as Task[];
  }

  if (isEventManager) {
  events = (allEvents as Event[]).filter(
    (e) => getUserId(e.manager) === userId
  );

  const eventIds = events.map((e) => e._id);

  tasks = (allTasks as Task[]).filter(
    (t) => eventIds.includes(getEventId(t.event))
  );
}

  if (isTeamMember) {
  tasks = (allTasks as Task[]).filter(
    (t) => getUserId(t.assignee) === userId
  );

  const eventIds = tasks.map((t) => getEventId(t.event));

  events = (allEvents as Event[]).filter((e) =>
    eventIds.includes(e._id)
  );
}

  const adminEvents = isAdmin ? adminData?.events : undefined;

  const recentEvents = [...events]
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.date).getTime() -
        new Date(a.createdAt || a.date).getTime()
    )
    .slice(0, 5);

  const activeTasks = tasks.filter((task) => task.status !== 'Completed');
  const recentTasks = [...activeTasks]
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.dueDate).getTime() -
        new Date(a.createdAt || a.dueDate).getTime()
    )
    .slice(0, 5);



  ///// temporary
  console.log('ROLE:', userRole);
console.log('USER ID:', userId);
console.log('EVENT MANAGERS:', allEvents.map(e => e.manager));
console.log('FILTERED EVENTS:', events.length);
console.log('FILTERED TASKS:', tasks.length);

  /* ======================
     TASK STATUS %
  ====================== */
  const totalTasks = tasks.length || 1;

  const completedCount = tasks.filter(
    (t) => (t.status as TaskStatus) === 'Completed'
  ).length;

  const inProgressCount = tasks.filter(
    (t) => (t.status as TaskStatus) === 'In Progress'
  ).length;

  const upcomingCount = tasks.filter(
    (t) =>
      (t.status as TaskStatus) === 'Upcoming' ||
      (t.status as TaskStatus) === 'Pending'
  ).length;

  const cancelledCount = tasks.filter(
    (t) => (t.status as TaskStatus) === 'Cancelled'
  ).length;

  const completedPct = ((completedCount / totalTasks) * 100).toFixed(1);
  const inProgressPct = ((inProgressCount / totalTasks) * 100).toFixed(1);
  const upcomingPct = ((upcomingCount / totalTasks) * 100).toFixed(1);
  const cancelledPct = ((cancelledCount / totalTasks) * 100).toFixed(1);

  /* ======================
     EVENT TIMELINE
  ====================== */
  const eventTimelineData = Object.values(
    events.reduce((acc: any, e) => {
      const month = new Date(e.date).toLocaleString('default', {
        month: 'short',
      });
      acc[month] = acc[month] || { name: month, events: 0 };
      acc[month].events += 1;
      return acc;
    }, {})
  );

  /* ======================
     ⏳ UPCOMING EVENT
  ====================== */
  const upcomingEvent = [...events]
    .filter((e) => new Date(e.date) > new Date())
    .sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    )[0];

  const daysRemaining = upcomingEvent
    ? Math.ceil(
        (new Date(upcomingEvent.date).getTime() -
          new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  /* ======================
     📊 TASKS PER EVENT
  ====================== */
  const tasksPerEvent = events.map((event) => ({
    name: event.title,
    tasks: tasks.filter(
      (t) =>
        typeof t.event === 'object' &&
        t.event?._id === event._id
    ).length,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-header">Dashboard</h1>
        <p className="text-slate-600">
          Overview of your events and tasks
        </p>
      </div>

      {/* ADMIN METRICS */}
      {adminEvents && adminEvents.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">
            Admin metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <MetricCard
              title="Total events"
              value={adminEvents.length}
            />
            <MetricCard
              title="Total tasks"
              value={adminEvents.reduce(
                (s, e) => s + e.totalTasks,
                0
              )}
            />
            <MetricCard
              title="Avg completion"
              value={`${(
                adminEvents.reduce(
                  (s, e) => s + e.averageCompletion,
                  0
                ) / adminEvents.length
              ).toFixed(1)}%`}
            />
            <MetricCard
              title="Events in progress"
              value={adminEvents.filter(
                (e) => e.event.status === 'In Progress'
              ).length}
            />
          </div>
        </section>
      )}

      {/* ANALYTICS (ADMIN + EVENT MANAGER) */}
      {canViewAnalytics && (
        <>
          <section>
            <h2 className="text-lg font-semibold mb-4">
              Task status breakdown
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <MetricCard title="Completed" value={`${completedPct}%`} />
              <MetricCard title="In progress" value={`${inProgressPct}%`} />
              <MetricCard title="Upcoming" value={`${upcomingPct}%`} />
              <MetricCard title="Cancelled" value={`${cancelledPct}%`} />
            </div>
          </section>

          {upcomingEvent && (
            <Card>
              <CardContent className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-600">
                    Upcoming Event
                  </p>
                  <p className="text-lg font-semibold">
                    {upcomingEvent.title}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDate(upcomingEvent.date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary-600">
                    {daysRemaining}
                  </p>
                  <p className="text-sm text-slate-600">
                    days remaining
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <section>
            <h2 className="text-lg font-semibold mb-4">
              Event timeline
            </h2>
            <Card>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={eventTimelineData}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="events"
                      stroke="#60A5FA"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">
              Tasks per event
            </h2>
            <Card>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tasksPerEvent}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="tasks" fill="#34D399" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </section>
        </>
      )}

      {/* RECENT EVENTS + MY TASKS (ALL ROLES) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">
            Recent events
          </h2>
          <Card>
            <CardContent className="p-0">
              {recentEvents.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">
                  No events yet
                </p>
              ) : (
                <ul className="divide-y">
                  {recentEvents.map((event) => (
                    <li key={event._id}>
                      <Link
                        to={ROUTES.EVENT_DETAIL(event._id)}
                        className="flex justify-between px-5 py-4 hover:bg-slate-50"
                      >
                        <div className="flex gap-3">
                          <div className="w-10 h-10 bg-accent-sky rounded-xl flex items-center justify-center">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {event.title}
                            </p>
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
          <h2 className="text-lg font-semibold mb-4">
            My tasks
          </h2>
          <Card>
            <CardContent className="p-0">
              {recentTasks.length === 0 ? (
                <p className="p-5 text-sm text-slate-600">
                  No tasks assigned
                </p>
              ) : (
                <ul className="space-y-2 p-2">
                  {recentTasks.map((task) => (
                    <li key={task._id}>
                      <Link
                        to={ROUTES.TASKS}
                        className="block p-3 rounded-xl hover:bg-white/50"
                      >
                        <p className="text-sm font-medium">
                          {task.name}
                        </p>
                        <p className="text-xs text-slate-600">
                          {typeof task.event === 'object' &&
                            task.event?.title}{' '}
                          · {task.completionPercentage}%
                        </p>
                        <StatusBadge status={task.status} />
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

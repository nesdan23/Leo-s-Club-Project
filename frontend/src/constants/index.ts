import type { EventStatus, TaskStatus, TaskDomain, UserRole } from '@/types';

export const EVENT_STATUSES: EventStatus[] = [
  'Draft',
  'Upcoming',
  'In Progress',
  'Completed',
  'Cancelled',
];

export const TASK_STATUSES: TaskStatus[] = ['Pending', 'In Progress', 'Completed'];

export const TASK_DOMAINS: TaskDomain[] = [
  'Logistics',
  'Marketing',
  'General',
  'Fundraising',
  'Outreach',
  'Operations',
  'Other',
];

export const USER_ROLES: UserRole[] = ['Admin', 'Event Manager', 'Team Member'];

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/',
  EVENTS: '/events',
  EVENT_DETAIL: (id: string) => `/events/${id}`,
  TASKS: '/tasks',
} as const;

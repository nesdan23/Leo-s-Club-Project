// Generated from backend models

export type UserRole = 'Admin' | 'Event Manager' | 'Team Member';

export type EventStatus = 'Draft' | 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled';

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export type TaskDomain =
  | 'Logistics'
  | 'Marketing'
  | 'General'
  | 'Fundraising'
  | 'Outreach'
  | 'Operations'
  | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
}

export interface UserPopulated {
  _id: string;
  name: string;
  email: string;
  role?: UserRole;
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  manager: UserPopulated | string;
  status: EventStatus;
  attendees?: UserPopulated[] | string[];
  createdAt?: string;
  updatedAt?: string;
  volunteerTasks?: Task[];
}

export interface Task {
  _id: string;
  name: string;
  description: string;
  event: { _id: string; title: string; date?: string; status?: EventStatus } | string;
  assignee: UserPopulated | string | null;
  status: TaskStatus;
  completionPercentage: number;
  dueDate: string;
  domain: TaskDomain;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventVolunteersResponse {
  event: { id: string; title: string };
  totalVolunteers: number;
  volunteersByDomain: Record<TaskDomain, { id: string; name: string; email: string; role: string }[]>;
  allVolunteers: { id: string; name: string; email: string; preferredDomain: TaskDomain }[];
}

export interface AdminDashboardEvent {
  event: Event;
  totalTasks: number;
  averageCompletion: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface VolunteerImportSummary {
  total: number;
  created: number;
  linked: number;
  failed: number;
  emailsSent: number;
  emailsFailed: number;
}

export interface VolunteerImportResponse {
  message: string;
  summary: VolunteerImportSummary;
  details?: {
    created: { row: number; email: string; name: string; domain: string; emailSent: boolean }[];
    linked: { row: number; email: string; name: string; domain: string }[];
    failed: { row: number; email: string; reason: string }[];
  };
}

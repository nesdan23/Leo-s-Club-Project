export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Event Manager' | 'Team Member';
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  status: 'Draft' | 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled';
  manager: User;
  attendees: User[];
  volunteerTasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  name: string;
  description: string;
  event: {
    _id: string;
    title: string;
    date: string;
    status: string;
  };
  assignee: User | null;
  status: 'Pending' | 'In Progress' | 'Completed';
  completionPercentage: number;
  dueDate: string;
  domain: 'Logistics' | 'Marketing' | 'General' | 'Fundraising' | 'Outreach' | 'Operations' | 'Other';
  createdAt: string;
  updatedAt: string;
}

export interface EventVolunteer {
  id: string;
  name: string;
  email: string;
  preferredDomain: string;
}

export interface DashboardStats {
  events: Array<{
    event: Event;
    totalTasks: number;
    averageCompletion: number;
  }>;
}

export interface AuthResponse {
  user: User;
  token: string;
}

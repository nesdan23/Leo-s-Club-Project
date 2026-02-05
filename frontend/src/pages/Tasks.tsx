import { useEffect, useState } from 'react';
import api from '../services/api';
import { Task } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  CheckSquare,
  Clock,
  Calendar,
  Tag,
  ChevronDown,
  Search,
} from 'lucide-react';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed'];
const DOMAIN_OPTIONS = ['Logistics', 'Marketing', 'General', 'Fundraising', 'Outreach', 'Operations', 'Other'];

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get<Task[]>('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    setUpdating(taskId);
    try {
      await api.patch(`/tasks/${taskId}`, updates);
      fetchTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setUpdating(null);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? task.status === statusFilter : true;
    const matchesDomain = domainFilter ? task.domain === domainFilter : true;
    return matchesSearch && matchesStatus && matchesDomain;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Pending: 'bg-gray-100 text-gray-700',
      'In Progress': 'bg-amber-100 text-amber-700',
      Completed: 'bg-green-100 text-green-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getDomainColor = (domain: string) => {
    const colors: Record<string, string> = {
      Logistics: 'bg-blue-100 text-blue-700',
      Marketing: 'bg-pink-100 text-pink-700',
      General: 'bg-gray-100 text-gray-700',
      Fundraising: 'bg-green-100 text-green-700',
      Outreach: 'bg-purple-100 text-purple-700',
      Operations: 'bg-orange-100 text-orange-700',
      Other: 'bg-slate-100 text-slate-700',
    };
    return colors[domain] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="mt-1 text-gray-500">
          {user?.role === 'Team Member'
            ? 'View and update tasks assigned to you'
            : 'Manage tasks across all events'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="">All Domains</option>
          {DOMAIN_OPTIONS.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl card-shadow">
          <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
          <p className="text-gray-500 mt-1">
            {searchTerm || statusFilter || domainFilter
              ? 'Try adjusting your filters'
              : 'No tasks have been assigned to you yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div
              key={task._id}
              className="bg-white rounded-2xl card-shadow overflow-hidden"
            >
              <div
                className="p-6 cursor-pointer"
                onClick={() => setExpandedTask(expandedTask === task._id ? null : task._id)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getDomainColor(task.domain)}`}>
                        {task.domain}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{task.name}</h3>
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{task.description}</p>

                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{task.event?.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{task.completionPercentage}%</p>
                      <p className="text-xs text-gray-500">Complete</p>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedTask === task._id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        task.completionPercentage === 100
                          ? 'bg-green-500'
                          : task.completionPercentage > 50
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${task.completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Expanded section */}
              {expandedTask === task._id && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Update Status
                      </label>
                      <select
                        value={task.status}
                        onChange={(e) => updateTask(task._id, { status: e.target.value as Task['status'] })}
                        disabled={updating === task._id}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Completion: {task.completionPercentage}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={task.completionPercentage}
                        onChange={(e) =>
                          updateTask(task._id, { completionPercentage: parseInt(e.target.value) })
                        }
                        disabled={updating === task._id}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  {updating === task._id && (
                    <div className="flex items-center gap-2 mt-4 text-sm text-blue-600">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Updating...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

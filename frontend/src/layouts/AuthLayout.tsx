import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8 bg-surface-card">
        <Outlet />
      </div>
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-400/30 via-accent-lavender/40 to-accent-mint/30 rounded-l-3xl items-center justify-center p-12">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">
            Leos Club EventFlow
          </h2>
          <p className="text-slate-600">
            Manage events, volunteers, and tasks in one calm place.
          </p>
          <div className="mt-8 flex justify-center gap-4 opacity-80">
            <div className="w-16 h-16 rounded-2xl bg-accent-yellow/80 shadow-soft" />
            <div className="w-16 h-16 rounded-2xl bg-accent-lavender/80 shadow-soft" />
            <div className="w-16 h-16 rounded-2xl bg-accent-mint/80 shadow-soft" />
          </div>
        </div>
      </div>
    </div>
  );
}

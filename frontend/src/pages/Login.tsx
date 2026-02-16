import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/constants';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? ROUTES.DASHBOARD;

  const loginMutation = useMutation({
    mutationFn: () => authApi.login(email, password),
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.token);
      navigate(from, { replace: true });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      if (!err.response) {
        setError('Cannot reach the server. Is the backend running on port 5000?');
        return;
      }
      setError(err.response?.data?.message ?? 'Login failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    loginMutation.mutate();
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Welcome back</h1>
      <p className="text-slate-600 mb-8">Sign in to your account</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          error={error && !password ? error : undefined}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          error={error && password ? error : undefined}
        />
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <Link to={ROUTES.REGISTER} className="font-medium text-primary-600 hover:text-primary-700">
          Sign up
        </Link>
      </p>
    </div>
  );
}

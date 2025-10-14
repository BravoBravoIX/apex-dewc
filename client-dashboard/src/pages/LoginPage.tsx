import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = login(username, password);
    if (!success) {
      setError('Invalid username or password');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-surface border border-border rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">APEX</h1>
            <p className="text-text-secondary text-sm">
              Advanced Platform for Exercise & eXperimentation
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text-primary mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter username"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-text-muted">
            Authorized personnel only
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
